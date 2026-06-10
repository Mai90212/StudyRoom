"""专注数据大盘模块 — 业务异常。"""

from __future__ import annotations

from bedrock.exc import BedrockExc


class CannotFollowSelf(BedrockExc):
    """不能关注自己。"""

    detail: str = "不能关注自己。"
    status_code: int = 400


class AlreadyFollowing(BedrockExc):
    """已经关注了该用户。"""

    detail: str = "已经关注了该用户。"
    status_code: int = 409


class NotFollowing(BedrockExc):
    """未关注该用户。"""

    detail: str = "未关注该用户。"
    status_code: int = 400


class UserNotFound(BedrockExc):
    """用户不存在。"""

    detail: str = "用户不存在。"
    status_code: int = 404
