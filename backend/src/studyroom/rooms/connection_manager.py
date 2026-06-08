"""自习室模块 — WebSocket 连接管理器。

管理每个房间的 WebSocket 连接，处理加入/离开/广播，
以及状态变更冷却（10s 限速）和心跳超时检测。
"""

from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class UserConnection:
    """一个用户的 WebSocket 连接状态。"""

    user_id: int
    websocket: WebSocket
    status: str = "focusing"
    last_heartbeat: float = field(default_factory=time.time)
    last_status_broadcast: float = 0.0


class ConnectionManager:
    """WebSocket 连接管理器（单例）。

    每个用户只能在一个房间中。同一用户建立新连接时旧连接会被关闭。
    """

    STATUS_COOLDOWN = 10.0  # 状态广播冷却时间（秒）
    HEARTBEAT_TIMEOUT = 30.0  # 心跳超时（秒）

    def __init__(self) -> None:
        self._rooms: dict[int, dict[int, UserConnection]] = {}
        self._user_room: dict[int, int] = {}

    # ------------------------------------------------------------------
    # 连接管理
    # ------------------------------------------------------------------

    async def connect(self, websocket: WebSocket, room_id: int, user_id: int) -> None:
        """接受 WebSocket 连接并将用户加入房间。

        如果用户已在其他房间，先断开旧连接。
        新用户会先收到 room_state（已有成员列表），再广播 user_join 给所有人。
        """
        await websocket.accept()

        old_room_id = self._user_room.get(user_id)
        if old_room_id is not None:
            await self._remove_user_from_room(user_id, old_room_id, reason="offline")

        if room_id not in self._rooms:
            self._rooms[room_id] = {}

        # 先收集已有成员（新用户需要看到他们）
        existing = [
            {"user_id": uid, "status": conn.status}
            for uid, conn in self._rooms[room_id].items()
        ]

        # 将新用户加入房间
        conn = UserConnection(user_id=user_id, websocket=websocket)
        self._rooms[room_id][user_id] = conn
        self._user_room[user_id] = room_id

        # 给新用户发送当前房间状态（包含自己）
        all_members = existing + [{"user_id": user_id, "status": conn.status}]
        await self._send_json(websocket, {
            "type": "room_state",
            "members": all_members,
        })

        # 广播新用户加入（给其他用户）
        await self._broadcast(room_id, {
            "type": "user_join",
            "user_id": user_id,
            "status": conn.status,
        }, exclude_user_id=user_id)

    async def disconnect(self, room_id: int, user_id: int, websocket: WebSocket | None = None) -> None:
        """断开用户连接并从房间移除（不删除数据库成员记录）。

        如果传入 websocket，仅当当前连接与之匹配时才移除，
        防止旧连接的断开处理误杀已建立的新连接。
        """
        if websocket is not None:
            conn = self._get_connection(room_id, user_id)
            if conn is None or conn.websocket is not websocket:
                return
        await self._remove_user_from_room(user_id, room_id, reason="offline")

    async def leave(self, room_id: int, user_id: int) -> None:
        """用户主动离开房间。"""
        conn = self._get_connection(room_id, user_id)
        if conn:
            await self._close_socket(conn.websocket)
        await self._remove_user_from_room(user_id, room_id, reason="leave")

    # ------------------------------------------------------------------
    # 广播
    # ------------------------------------------------------------------

    async def broadcast_to_room(self, room_id: int, message: dict) -> None:
        """向房间内所有在线用户广播消息。"""
        await self._broadcast(room_id, message)

    async def broadcast_status(self, room_id: int, user_id: int, status: str) -> None:
        """广播用户状态变更（带 10s 冷却）。"""
        conn = self._get_connection(room_id, user_id)
        if conn is None:
            return

        now = time.time()
        if now - conn.last_status_broadcast < self.STATUS_COOLDOWN:
            return

        conn.status = status
        conn.last_status_broadcast = now
        await self._broadcast(room_id, {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
        })

    async def send_to_user(self, room_id: int, user_id: int, message: dict) -> None:
        """向房间内指定用户发送消息。"""
        conn = self._get_connection(room_id, user_id)
        if conn:
            await self._send_json(conn.websocket, message)

    # ------------------------------------------------------------------
    # 心跳
    # ------------------------------------------------------------------

    def update_heartbeat(self, room_id: int, user_id: int) -> None:
        """更新用户心跳时间。"""
        conn = self._get_connection(room_id, user_id)
        if conn:
            conn.last_heartbeat = time.time()

    async def check_timeouts(self) -> None:
        """检查所有房间中超时的连接并清理。

        应由后台定时任务周期性调用。
        """
        now = time.time()
        for room_id in list(self._rooms.keys()):
            for user_id in list(self._rooms[room_id].keys()):
                conn = self._rooms[room_id][user_id]
                if now - conn.last_heartbeat > self.HEARTBEAT_TIMEOUT:
                    await self._remove_user_from_room(user_id, room_id, reason="offline")

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------

    def get_online_users(self, room_id: int) -> list[dict]:
        """返回房间内在线用户列表。"""
        if room_id not in self._rooms:
            return []
        return [
            {"user_id": uid, "status": conn.status}
            for uid, conn in self._rooms[room_id].items()
        ]

    def get_room_online_count(self, room_id: int) -> int:
        """返回房间在线人数。"""
        return len(self._rooms.get(room_id, {}))

    def is_user_in_room(self, user_id: int) -> bool:
        """检查用户是否在某个房间中。"""
        return user_id in self._user_room

    def get_user_room(self, user_id: int) -> int | None:
        """返回用户所在的房间 ID，如果不在任何房间则返回 None。"""
        return self._user_room.get(user_id)

    def get_all_online_user_ids(self) -> set[int]:
        """返回所有在线用户的 ID 集合。"""
        return set(self._user_room.keys())

    # ------------------------------------------------------------------
    # 内部方法
    # ------------------------------------------------------------------

    def _get_connection(self, room_id: int, user_id: int) -> UserConnection | None:
        if room_id not in self._rooms:
            return None
        return self._rooms[room_id].get(user_id)

    async def _remove_user_from_room(
        self, user_id: int, room_id: int, reason: str
    ) -> None:
        """将用户从房间移除，关闭连接，广播离开事件。"""
        conn = self._rooms.get(room_id, {}).pop(user_id, None)
        self._user_room.pop(user_id, None)

        if conn:
            await self._close_socket(conn.websocket)
            await self._broadcast(room_id, {
                "type": "user_leave",
                "user_id": user_id,
                "reason": reason,
            })

        if room_id in self._rooms and not self._rooms[room_id]:
            del self._rooms[room_id]

    async def _broadcast(self, room_id: int, message: dict, exclude_user_id: int | None = None) -> None:
        """向房间内所有连接广播消息，断开失败的连接。"""
        if room_id not in self._rooms:
            return

        raw = json.dumps(message)
        dead_users: list[int] = []

        for user_id, conn in self._rooms[room_id].items():
            if user_id == exclude_user_id:
                continue
            try:
                await conn.websocket.send_text(raw)
            except Exception:
                dead_users.append(user_id)

        for user_id in dead_users:
            await self._remove_user_from_room(user_id, room_id, reason="offline")

    @staticmethod
    async def _send_json(websocket: WebSocket, message: dict) -> None:
        """向单个连接发送 JSON 消息。"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            pass

    @staticmethod
    async def _close_socket(websocket: WebSocket) -> None:
        """安全关闭 WebSocket 连接。"""
        try:
            await websocket.close()
        except Exception:
            pass


manager = ConnectionManager()
