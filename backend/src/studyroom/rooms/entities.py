"""自习室模块 — Pydantic 实体。"""

from __future__ import annotations

from datetime import datetime

from bedrock.entities import BedrockEntity
from pydantic import Field


class RoomCreate(BedrockEntity):
    """创建房间请求。"""

    name: str = Field(..., min_length=1, max_length=50)
    max_members: int = 20


class RoomJoin(BedrockEntity):
    """加入房间请求。"""

    invite_code: str


class RoomResponse(BedrockEntity):
    """房间信息响应。"""

    id: int
    name: str
    invite_code: str
    max_members: int
    owner_id: int
    is_active: bool
    created_at: datetime
    member_count: int = 0


class RoomMemberResponse(BedrockEntity):
    """房间成员信息响应。"""

    user_id: int
    status: str
    joined_at: datetime
