"""专注数据大盘模块 — FastAPI 路由。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from studyroom.users.router import get_current_user_id

from .entities import (
    DistributionResponse,
    FollowListResponse,
    HeatmapResponse,
    LeaderboardResponse,
    ScoreResponse,
    SettingsResponse,
    SettingsUpdateRequest,
    StatsResponse,
    StreakResponse,
)
from .service import dashboard_service, follow_service, leaderboard_service, settings_service

router = APIRouter(tags=["数据大盘"])


# ─── Dashboard ───


@router.get("/dashboard/stats", response_model=StatsResponse)
async def get_stats(user_id: int = Depends(get_current_user_id)):
    """获取今日/本周/本月专注总览。"""
    return dashboard_service.get_stats(user_id)


@router.get("/dashboard/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    days: int = Query(180, ge=1, le=365),
    user_id: int = Depends(get_current_user_id),
):
    """获取热力图数据。"""
    return dashboard_service.get_heatmap(user_id, days)


@router.get("/dashboard/distribution", response_model=DistributionResponse)
async def get_distribution(
    days: int = Query(7, ge=1, le=30),
    user_id: int = Depends(get_current_user_id),
):
    """获取按小时时间分布。"""
    return dashboard_service.get_distribution(user_id, days)


@router.get("/dashboard/score", response_model=ScoreResponse)
async def get_score(user_id: int = Depends(get_current_user_id)):
    """获取今日 Focus Score。"""
    return dashboard_service.get_score(user_id)


@router.get("/dashboard/streak", response_model=StreakResponse)
async def get_streak(user_id: int = Depends(get_current_user_id)):
    """获取连胜天数。"""
    return dashboard_service.get_streak(user_id)


# ─── 关注 ───


@router.post("/follow/{target_user_id}")
async def follow_user(target_user_id: int, user_id: int = Depends(get_current_user_id)):
    """关注用户。"""
    follow_service.follow(user_id, target_user_id)
    return {"detail": "已关注"}


@router.delete("/follow/{target_user_id}")
async def unfollow_user(target_user_id: int, user_id: int = Depends(get_current_user_id)):
    """取消关注。"""
    follow_service.unfollow(user_id, target_user_id)
    return {"detail": "已取消关注"}


@router.get("/follow/following", response_model=FollowListResponse)
async def get_following(user_id: int = Depends(get_current_user_id)):
    """获取我关注的人。"""
    return follow_service.get_following(user_id)


@router.get("/follow/followers", response_model=FollowListResponse)
async def get_followers(user_id: int = Depends(get_current_user_id)):
    """获取关注我的人。"""
    return follow_service.get_followers(user_id)


# ─── 排行榜 ───


@router.get("/leaderboard/{period}", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str,
    user_id: int = Depends(get_current_user_id),
):
    """获取好友排行榜。period: weekly / monthly"""
    if period not in ("weekly", "monthly"):
        period = "weekly"
    return leaderboard_service.get_friends_leaderboard(user_id, period)


# ─── 设置 ───


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(user_id: int = Depends(get_current_user_id)):
    """获取用户设置。"""
    return settings_service.get_settings(user_id)


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdateRequest,
    user_id: int = Depends(get_current_user_id),
):
    """更新用户设置。"""
    return settings_service.update_settings(user_id, data.daily_goal_minutes, data.streak_goal_minutes)
