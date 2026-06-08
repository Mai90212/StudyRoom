"""用户模块 — FastAPI 认证路由。"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .entities import LoginRequest, RegisterRequest, UserResponse, VerifyEmailRequest
from .service import auth_service

router = APIRouter(prefix="/auth", tags=["认证"])
security = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """从 Bearer Token 中提取 user_id 的 FastAPI 依赖。"""
    return auth_service.get_user_id_from_token(credentials.credentials)


@router.post("/register")
async def register(data: RegisterRequest):
    """注册新用户，发送验证码到邮箱。"""
    return auth_service.register(data.email, data.password, data.nickname)


@router.post("/verify")
async def verify_email(data: VerifyEmailRequest):
    """验证邮箱并返回 JWT。"""
    return auth_service.verify_email(data.email, data.code)


@router.post("/login")
async def login(data: LoginRequest):
    """登录并返回 JWT。"""
    return auth_service.login(data.email, data.password)


@router.get("/me", response_model=UserResponse)
async def me(user_id: int = Depends(get_current_user_id)):
    """获取当前登录用户信息。"""
    return auth_service.get_user(user_id)
