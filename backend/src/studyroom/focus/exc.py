"""专注计时模块异常。"""

from __future__ import annotations

from bedrock.exc import BedrockExc


class InvalidFocusData(BedrockExc):
    """上报数据异常。"""

    detail: str = "专注数据异常。"
