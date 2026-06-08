"""自习室模块 — FastAPI 路由（HTTP + WebSocket）。"""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from studyroom.users.router import get_current_user_id

from .connection_manager import manager
from .entities import RoomCreate, RoomJoin
from .exc import RoomFull, RoomNotFound, UserAlreadyInRoom
from .service import room_service

router = APIRouter(prefix="/rooms", tags=["自习室"])


def _resolve_user_id(token_user_id: int | None, query_user_id: int | None) -> int:
    """解析用户 ID：优先使用 JWT，兼容旧的 query 参数。"""
    if token_user_id is not None:
        return token_user_id
    if query_user_id is not None:
        return query_user_id
    from .exc import UserNotInRoom
    raise UserNotInRoom()


# ------------------------------------------------------------------
# HTTP 路由
# ------------------------------------------------------------------


@router.get("/my")
async def my_rooms(
    token_user_id: int | None = Depends(get_current_user_id),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    """获取用户创建和加入的房间列表，含在线人数。"""
    uid = _resolve_user_id(token_user_id, user_id)
    rooms = room_service.get_my_rooms(uid)
    return [
        {
            **r.model_dump(),
            "online_count": manager.get_room_online_count(r.id),
            "is_owner": r.owner_id == uid,
        }
        for r in rooms
    ]


@router.post("")
async def create_room(
    data: RoomCreate,
    token_user_id: int | None = Depends(get_current_user_id),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    return room_service.create_room(data, owner_id=_resolve_user_id(token_user_id, user_id))


@router.post("/join")
async def join_room(
    data: RoomJoin,
    token_user_id: int | None = Depends(get_current_user_id),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    uid = _resolve_user_id(token_user_id, user_id)
    if manager.is_user_in_room(uid):
        raise UserAlreadyInRoom()
    return room_service.join_room(data.invite_code, uid)


@router.post("/{room_id}/leave")
async def leave_room(
    room_id: int,
    token_user_id: int | None = Depends(get_current_user_id),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    uid = _resolve_user_id(token_user_id, user_id)
    room_service.leave_room(room_id, uid)
    await manager.leave(room_id, uid)
    return {"detail": "已退出"}


@router.delete("/{room_id}")
async def delete_room(
    room_id: int,
    token_user_id: int | None = Depends(get_current_user_id),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    """删除房间（仅房主）。"""
    uid = _resolve_user_id(token_user_id, user_id)
    room_service.delete_room(room_id, uid)
    await manager.broadcast_to_room(room_id, {"type": "room_deleted"})
    return {"detail": "房间已删除"}


@router.post("/{room_id}/kick/{target_user_id}")
async def kick_member(
    room_id: int,
    target_user_id: int,
    token_user_id: int | None = Depends(get_current_user_id),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    """踢出成员（仅房主）。"""
    uid = _resolve_user_id(token_user_id, user_id)
    room_service.kick_member(room_id, uid, target_user_id)
    await manager.send_to_user(room_id, target_user_id, {"type": "kicked"})
    await manager.leave(room_id, target_user_id)
    return {"detail": "已踢出"}


@router.get("/{room_id}")
async def get_room(room_id: int):
    """获取单个房间信息。"""
    r = room_service.get_room(room_id)
    return {
        **r.model_dump(),
        "online_count": manager.get_room_online_count(r.id),
    }


@router.get("/{room_id}/members")
async def get_members(room_id: int):
    return room_service.get_room_members(room_id)


@router.get("/{room_id}/leaderboard")
async def get_room_leaderboard(room_id: int):
    """获取房间内今日专注排行榜。"""
    from studyroom.dashboard.service import leaderboard_service
    return leaderboard_service.get_room_leaderboard(room_id)


# ------------------------------------------------------------------
# WebSocket 路由
# ------------------------------------------------------------------


@router.websocket("/{room_id}/ws")
async def room_websocket(
    websocket: WebSocket,
    room_id: int,
    token: str = Query("", description="JWT Token"),
    user_id: int | None = Query(None, description="用户 ID（已废弃，请使用 JWT）"),
):
    """自习室 WebSocket 长连接。

    连接方式：``ws://host/rooms/{room_id}/ws?token=JWT_TOKEN``
    """
    if token:
        from studyroom.users.service import auth_service
        try:
            uid = auth_service.get_user_id_from_token(token)
        except Exception:
            await websocket.close(code=4001, reason="Token 无效")
            return
    elif user_id is not None:
        uid = user_id
    else:
        await websocket.close(code=4001, reason="请提供 token 或 user_id")
        return

    try:
        room = room_service.get_room(room_id)
    except RoomNotFound:
        await websocket.close(code=4004, reason="房间不存在")
        return

    if not room_service.is_member(room_id, uid):
        # 房主自动重新加入（可能之前退出过）
        if room.owner_id == uid:
            room_service.join_room(room.invite_code, uid)
        else:
            await websocket.close(code=4003, reason="你不在该房间中")
            return

    # 更新数据库成员状态为专注
    room_service.update_member_status(room_id, uid, "focusing")

    await manager.connect(websocket, room_id, uid)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type", "")

            if msg_type == "heartbeat":
                manager.update_heartbeat(room_id, uid)

            elif msg_type == "status_change":
                new_status = data.get("status", "focusing")
                if new_status in ("focusing", "away"):
                    room_service.update_member_status(room_id, uid, new_status)
                    await manager.broadcast_status(room_id, uid, new_status)

            elif msg_type == "chat":
                message = data.get("message", "")
                if message.strip():
                    await manager.broadcast_to_room(room_id, {
                        "type": "chat",
                        "user_id": uid,
                        "message": message.strip(),
                    })

            if data.get("action") == "report_time":
                total_seconds = data.get("total_focus_seconds", 0)
                if total_seconds > 0:
                    from studyroom.focus.service import focus_service
                    focus_service.record_focus(uid, room_id, total_seconds)

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        # 仅从连接管理器移除，保留 DB 成员记录以便从"我的房间"重新进入
        room_service.update_member_status(room_id, uid, "offline")
        await manager.disconnect(room_id, uid, websocket)
