"""用户模块 — 认证业务逻辑。"""

from __future__ import annotations

import hashlib
import os
import smtplib
import time
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText

import jwt
from bedrock.database import db

from .entities import AuthResponse, UserResponse
from .exc import (
    EmailAlreadyExists,
    EmailNotVerified,
    InvalidCredentials,
    Unauthorized,
    VerificationCodeExpired,
    VerificationCodeInvalid,
)
from .models import User, VerificationCode

JWT_SECRET = os.environ.get("JWT_SECRET", "").strip()
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET 环境变量未设置。请在 backend/.env 中配置 JWT_SECRET。\n"
        "生成强随机值：python3 -c 'import secrets; print(secrets.token_urlsafe(64))'"
    )
if len(JWT_SECRET) < 32:
    raise RuntimeError(
        f"JWT_SECRET 长度 {len(JWT_SECRET)} 过短（要求 ≥32 字符）。"
        "请使用 secrets.token_urlsafe(64) 生成。"
    )
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.qq.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")


class AuthService:
    """用户认证服务。"""

    # ------------------------------------------------------------------
    # 注册 & 验证
    # ------------------------------------------------------------------

    def register(self, email: str, password: str, nickname: str) -> dict:
        """注册新用户并发送验证码。"""
        with db.session_scope() as session:
            existing = session.query(User).filter_by(email=email).first()
            if existing is not None:
                raise EmailAlreadyExists()

            user = User(
                email=email,
                nickname=nickname,
                password_hash=self._hash_password(password),
                is_verified=False,
            )
            session.add(user)
            session.flush()

            vc = VerificationCode.generate(email)
            session.add(vc)
            session.flush()
            verification_code = vc.code

        self._send_email(email, verification_code)
        return {"detail": "验证码已发送到邮箱，请查收。"}

    def verify_email(self, email: str, code: str) -> AuthResponse:
        """验证邮箱并激活账号。"""
        with db.session_scope() as session:
            vc = (
                session.query(VerificationCode)
                .filter_by(email=email, code=code, is_used=False)
                .order_by(VerificationCode.id.desc())
                .first()
            )
            if vc is None:
                raise VerificationCodeInvalid()
            if vc.is_expired:
                raise VerificationCodeExpired()

            vc.is_used = True

            user = session.query(User).filter_by(email=email).first()
            if user is None:
                raise VerificationCodeInvalid()
            user.is_verified = True

            token = self._create_token(user)
            user_id = user.id
            email = user.email
            nickname = user.nickname

        return AuthResponse(
            access_token=token,
            user_id=user_id,
            email=email,
            nickname=nickname,
        )

    # ------------------------------------------------------------------
    # 登录
    # ------------------------------------------------------------------

    def login(self, email: str, password: str) -> AuthResponse:
        """用户登录。"""
        with db.session_scope() as session:
            user = session.query(User).filter_by(email=email).first()
            if user is None:
                raise InvalidCredentials()
            if not self._verify_password(password, user.password_hash):
                raise InvalidCredentials()
            if not user.is_verified:
                raise EmailNotVerified()

            token = self._create_token(user)
            user_id = user.id
            user_email = user.email
            nickname = user.nickname

        return AuthResponse(
            access_token=token,
            user_id=user_id,
            email=user_email,
            nickname=nickname,
        )

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------

    def get_user(self, user_id: int) -> UserResponse:
        """获取用户信息。"""
        with db.session_scope() as session:
            user = session.query(User).filter_by(id=user_id).first()
            if user is None:
                raise Unauthorized()
            return UserResponse(
                id=user.id,
                email=user.email,
                nickname=user.nickname,
                is_verified=user.is_verified,
            )

    @staticmethod
    def get_user_id_from_token(token: str) -> int:
        """从 JWT 中解析 user_id，token 无效时抛出 Unauthorized。"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload["user_id"]
        except jwt.PyJWTError:
            raise Unauthorized()

    # ------------------------------------------------------------------
    # 内部
    # ------------------------------------------------------------------

    @staticmethod
    def _hash_password(password: str) -> str:
        salt = os.urandom(32)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
        return salt.hex() + ":" + key.hex()

    @staticmethod
    def _verify_password(password: str, stored: str) -> bool:
        salt_hex, key_hex = stored.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
        return new_key == key

    @staticmethod
    def _create_token(user: User) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "user_id": user.id,
            "email": user.email,
            "iat": now,
            "exp": now + timedelta(hours=JWT_EXPIRE_HOURS),
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def _send_email(to: str, code: str) -> None:
        """通过 QQ 邮箱 SMTP 发送验证码。"""
        msg = MIMEText(
            f"【在线自习室】\n\n你的验证码是：{code}\n有效期 10 分钟，请勿泄露。\n\n如非本人操作，请忽略此邮件。",
            "plain",
            "utf-8",
        )
        msg["Subject"] = "在线自习室 - 邮箱验证码"
        msg["From"] = SMTP_USER or "noreply@studyroom.local"
        msg["To"] = to

        if not SMTP_USER or not SMTP_PASSWORD:
            print(f"[Email] SMTP 未配置，验证码发送到 {to}: {code}")
            return

        try:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to], msg.as_string())
            server.quit()
        except Exception as exc:
            print(f"[Email] 发送失败: {exc}")
            print(f"[Email] 验证码发送到 {to}: {code}")


auth_service = AuthService()
