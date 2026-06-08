"""自习室模块异常。"""

from __future__ import annotations

from bedrock.exc import BedrockExc


class RoomNotFound(BedrockExc):
    """房间不存在。"""

    detail: str = "房间不存在。"


class RoomFull(BedrockExc):
    """房间已满。"""

    detail: str = "房间已满，无法加入。"


class InvalidInviteCode(BedrockExc):
    """邀请码无效。"""

    detail: str = "邀请码无效。"


class UserAlreadyInRoom(BedrockExc):
    """用户已在某个房间中。"""

    detail: str = "你已经在另一个自习室中，请先退出。"


class UserNotInRoom(BedrockExc):
    """用户不在该房间中。"""

    detail: str = "你不在此自习室中。"


class NotRoomOwner(BedrockExc):
    """不是房主，无权执行此操作。"""

    detail: str = "只有房主才能执行此操作。"
