"""自习室模块 — 房间创建、加入、WebSocket 状态广播。"""

from __future__ import annotations

from .connection_manager import ConnectionManager, manager

# 导出 connection_manager 别名供其他模块使用
connection_manager = manager
from .entities import RoomCreate, RoomJoin, RoomMemberResponse, RoomResponse
from .exc import (
    InvalidInviteCode,
    NotRoomOwner,
    RoomFull,
    RoomNotFound,
    UserAlreadyInRoom,
    UserNotInRoom,
)
from .service import RoomService, room_service

__all__ = [
    "ConnectionManager",
    "InvalidInviteCode",
    "NotRoomOwner",
    "RoomCreate",
    "RoomFull",
    "RoomJoin",
    "RoomMemberResponse",
    "RoomNotFound",
    "RoomResponse",
    "RoomService",
    "UserAlreadyInRoom",
    "UserNotInRoom",
    "manager",
    "room_service",
]
