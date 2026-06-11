"""专注计时模块 — Pydantic 实体。"""

from __future__ import annotations

from datetime import date, datetime

from bedrock.entities import BedrockEntity
from pydantic import Field


class FocusReportRequest(BedrockEntity):
    """专注上报请求（HTTP 备用）。"""

    room_id: int
    total_focus_seconds: int


class FocusSessionReportRequest(BedrockEntity):
    room_id: int | None = None
    total_seconds: int = Field(0, ge=0)
    away_seconds: int = Field(0, ge=0)
    away_count: int = Field(0, ge=0)


class FocusHourlyReportRequest(BedrockEntity):
    room_id: int | None = None
    hour_start: datetime | str | None = None
    duration_seconds: int = Field(0, ge=0)


class RoomFocusItem(BedrockEntity):
    """单个房间的专注明细。"""

    room_id: int
    minutes: int


class DailyFocusResponse(BedrockEntity):
    """单日专注统计。"""

    date: date
    total_minutes: int
    records: list[RoomFocusItem] = []


class FocusSummaryResponse(BedrockEntity):
    """个人专注总览。"""

    today_minutes: int
    week_minutes: int
    daily: list[DailyFocusResponse] = []
