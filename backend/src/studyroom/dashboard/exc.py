"""专注数据大盘模块 — 业务异常。"""

from bedrock.exc import BedrockExc


class CannotFollowSelf(BedrockExc):
    """不能关注自己。"""

    def __init__(self) -> None:
        super().__init__(detail="不能关注自己", status_code=400)


class AlreadyFollowing(BedrockExc):
    """已经关注了该用户。"""

    def __init__(self) -> None:
        super().__init__(detail="已经关注了该用户", status_code=400)


class NotFollowing(BedrockExc):
    """未关注该用户。"""

    def __init__(self) -> None:
        super().__init__(detail="未关注该用户", status_code=400)


class UserNotFound(BedrockExc):
    """用户不存在。"""

    def __init__(self) -> None:
        super().__init__(detail="用户不存在", status_code=404)
