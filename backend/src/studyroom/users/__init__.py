"""用户模块 — 注册、登录、邮箱验证、JWT 认证。"""

from __future__ import annotations

from .entities import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
    VerifyEmailRequest,
)
from .exc import (
    EmailAlreadyExists,
    EmailNotVerified,
    InvalidCredentials,
    Unauthorized,
    VerificationCodeExpired,
    VerificationCodeInvalid,
)
from .service import AuthService, auth_service

__all__ = [
    "AuthResponse",
    "AuthService",
    "EmailAlreadyExists",
    "EmailNotVerified",
    "InvalidCredentials",
    "LoginRequest",
    "RegisterRequest",
    "Unauthorized",
    "UserResponse",
    "VerificationCodeExpired",
    "VerificationCodeInvalid",
    "VerifyEmailRequest",
    "auth_service",
]
