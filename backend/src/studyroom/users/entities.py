"""用户模块 — Pydantic 实体。"""

from __future__ import annotations

from bedrock.entities import BedrockEntity
from pydantic import EmailStr, Field


class RegisterRequest(BedrockEntity):
    """注册请求。"""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    nickname: str = Field(..., min_length=1, max_length=30)


class VerifyEmailRequest(BedrockEntity):
    """邮箱验证请求。"""

    email: str
    code: str


class LoginRequest(BedrockEntity):
    """登录请求。"""

    email: str
    password: str


class AuthResponse(BedrockEntity):
    """认证响应。"""

    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    nickname: str


class UserResponse(BedrockEntity):
    """用户信息响应。"""

    id: int
    email: str
    nickname: str
    is_verified: bool
