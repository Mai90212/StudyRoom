"""自习室模块 — SQLAlchemy 数据模型。"""

from __future__ import annotations

import secrets
import string
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from bedrock.database.base import BedrockModel

MAX_ROOM_SIZE = 20

_INVITE_CODE_CHARS = string.ascii_letters + string.digits


def _generate_invite_code() -> str:
    """6 位邀请码 — 必须用 secrets（密码学安全），不可改回 random（可预测，会导致房间被猜中）。"""
    return "".join(secrets.choice(_INVITE_CODE_CHARS) for _ in range(6))


class Room(BedrockModel):
    """自习室房间表。"""

    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="房间名称")
    invite_code = Column(
        String(6),
        nullable=False,
        unique=True,
        default=_generate_invite_code,
        comment="6 位邀请码",
    )
    max_members = Column(
        Integer, nullable=False, default=MAX_ROOM_SIZE, comment="人数上限"
    )
    owner_id = Column(Integer, nullable=False, comment="房主用户 ID")
    is_active = Column(Boolean, nullable=False, default=True, comment="房间是否活跃")
    created_at = Column(
        DateTime, nullable=False, default=func.now(), comment="创建时间"
    )

    members = relationship(
        "RoomMember",
        back_populates="room",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class RoomMember(BedrockModel):
    """自习室成员表。"""

    __tablename__ = "room_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(
        Integer,
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
        comment="所属房间 ID",
    )
    user_id = Column(Integer, nullable=False, comment="用户 ID")
    status = Column(
        String(20), nullable=False, default="focusing", comment="当前状态: focusing/away/offline"
    )
    joined_at = Column(
        DateTime, nullable=False, default=func.now(), comment="加入时间"
    )
    last_heartbeat = Column(
        DateTime, nullable=False, default=func.now(), comment="最后心跳时间"
    )

    room = relationship("Room", back_populates="members")
