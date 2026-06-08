"""专注数据大盘模块 — Pydantic 实体。"""

from __future__ import annotations

from datetime import date, datetime

from bedrock.entities import BedrockEntity


# ─── 请求体 ───


class SessionReportRequest(BedrockEntity):
    """专注会话上报请求。"""

    room_id: int
    total_seconds: int
    away_seconds: int = 0
    away_count: int = 0


class HourlyReportRequest(BedrockEntity):
    """小时专注上报请求。"""

    room_id: int
    hour_start: datetime
    duration_seconds: int


class SettingsUpdateRequest(BedrockEntity):
    """设置更新请求。"""

    daily_goal_minutes: int | None = None
    streak_goal_minutes: int | None = None


# ─── 响应体 ───


class StatsResponse(BedrockEntity):
    """专注总览响应。"""

    today_minutes: int = 0
    week_minutes: int = 0
    month_minutes: int = 0
    today_goal: int = 120
    today_progress: float = 0.0


class HeatmapItem(BedrockEntity):
    """热力图单日数据。"""

    date: date
    minutes: int
    level: int  # 0-4 表示深浅


class HeatmapResponse(BedrockEntity):
    """热力图响应。"""

    data: list[HeatmapItem] = []


class HourlyDistributionItem(BedrockEntity):
    """小时分布数据。"""

    hour: int
    avg_minutes: float


class DistributionResponse(BedrockEntity):
    """时间分布响应。"""

    hours: list[HourlyDistributionItem] = []


class ScoreResponse(BedrockEntity):
    """Focus Score 响应。"""

    score: int = 0
    duration_score: int = 0
    stability_score: int = 0
    away_count: int = 0
    focus_minutes: int = 0


class StreakResponse(BedrockEntity):
    """连胜响应。"""

    current_streak: int = 0
    longest_streak: int = 0
    today_done: bool = False


class FollowUserItem(BedrockEntity):
    """关注/粉丝用户项。"""

    user_id: int
    nickname: str
    is_online: bool = False
    followed_at: datetime | None = None


class FollowListResponse(BedrockEntity):
    """关注/粉丝列表响应。"""

    users: list[FollowUserItem] = []


class LeaderboardItem(BedrockEntity):
    """排行榜项。"""

    user_id: int
    nickname: str
    total_minutes: int
    rank: int


class LeaderboardResponse(BedrockEntity):
    """排行榜响应。"""

    items: list[LeaderboardItem] = []
    period: str = "weekly"  # weekly / monthly


class SettingsResponse(BedrockEntity):
    """设置响应。"""

    daily_goal_minutes: int = 120
    streak_goal_minutes: int = 30
