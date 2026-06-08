"""用户模块 — 异常。"""

from __future__ import annotations

from bedrock.exc import BedrockExc


class EmailAlreadyExists(BedrockExc):
    """邮箱已被注册。"""

    detail: str = "该邮箱已被注册。"


class InvalidCredentials(BedrockExc):
    """邮箱或密码错误。"""

    detail: str = "邮箱或密码错误。"


class EmailNotVerified(BedrockExc):
    """邮箱未验证。"""

    detail: str = "邮箱未验证，请先完成验证。"


class VerificationCodeInvalid(BedrockExc):
    """验证码无效或已使用。"""

    detail: str = "验证码无效或已使用。"


class VerificationCodeExpired(BedrockExc):
    """验证码已过期。"""

    detail: str = "验证码已过期，请重新获取。"


class Unauthorized(BedrockExc):
    """未登录或 token 无效。"""

    detail: str = "请先登录。"
