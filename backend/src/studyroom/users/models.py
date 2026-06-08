"""用户模块 — SQLAlchemy 数据模型。"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from bedrock.database.base import BedrockModel


class User(BedrockModel):
    """用户表。"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, comment="邮箱")
    nickname = Column(String(50), nullable=False, comment="昵称")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    is_verified = Column(Boolean, nullable=False, default=False, comment="邮箱是否已验证")
    created_at = Column(DateTime, nullable=False, default=func.now(), comment="创建时间")


class VerificationCode(BedrockModel):
    """邮箱验证码表。"""

    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, comment="目标邮箱")
    code = Column(String(6), nullable=False, comment="6 位验证码")
    expires_at = Column(DateTime, nullable=False, comment="过期时间")
    is_used = Column(Boolean, nullable=False, default=False, comment="是否已使用")

    @classmethod
    def generate(cls, email: str, ttl_minutes: int = 10) -> VerificationCode:
        code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)
        return cls(email=email, code=code, expires_at=expires_at)

    @property
    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)
