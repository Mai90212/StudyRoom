"""专注计时模块 — FastAPI 路由。"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from studyroom.users.service import auth_service

from .entities import FocusReportRequest, FocusSummaryResponse
from .service import focus_service

router = APIRouter(prefix="/focus", tags=["专注计时"])
_optional_bearer = HTTPBearer(auto_error=False)


def _resolve_focus_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
    token: str | None = Query(None),
) -> int:
    """支持 Bearer header 或 query token（sendBeacon 场景）。"""
    if credentials is not None:
        return auth_service.get_user_id_from_token(credentials.credentials)
    if token:
        return auth_service.get_user_id_from_token(token)
    from studyroom.users.exc import Unauthorized
    raise Unauthorized()


@router.post("/report")
async def report_focus(
    data: FocusReportRequest,
    user_id: int = Depends(_resolve_focus_user),
):
    """HTTP 上报专注时长。"""
    focus_service.record_focus(user_id, data.room_id, data.total_focus_seconds)
    return {"detail": "已记录"}


@router.get("/me", response_model=FocusSummaryResponse)
async def my_focus(user_id: int = Depends(_resolve_focus_user)):
    """获取个人专注总览（今日 + 本周 + 30 天历史）。"""
    return focus_service.get_summary(user_id)


@router.post("/session")
async def report_session(
    data: dict,
    user_id: int = Depends(_resolve_focus_user),
):
    """上报专注会话（离开房间时）。"""
    from bedrock.database import db
    from studyroom.dashboard.models import FocusSession

    room_id = data.get("room_id")
    total_seconds = data.get("total_seconds", 0)
    away_seconds = data.get("away_seconds", 0)
    away_count = data.get("away_count", 0)

    if room_id is None:
        return {"detail": "缺少 room_id"}

    with db.session_scope() as session:
        focus_session = FocusSession(
            user_id=user_id,
            room_id=room_id,
            start_time=datetime.now(),
            end_time=datetime.now(),
            total_seconds=total_seconds,
            away_seconds=away_seconds,
            away_count=away_count,
        )
        session.add(focus_session)
        session.flush()

    return {"detail": "已记录"}


@router.post("/hourly")
async def report_hourly(
    data: dict,
    user_id: int = Depends(_resolve_focus_user),
):
    """上报小时专注时长。"""
    from bedrock.database import db
    from studyroom.dashboard.models import FocusHourlyRecord

    room_id = data.get("room_id")
    hour_start = data.get("hour_start")
    duration_seconds = data.get("duration_seconds", 0)

    if room_id is None or hour_start is None:
        return {"detail": "缺少参数"}

    # 解析 hour_start
    if isinstance(hour_start, str):
        hour_start = datetime.fromisoformat(hour_start)

    from datetime import date

    with db.session_scope() as session:
        # 检查是否已存在
        existing = (
            session.query(FocusHourlyRecord)
            .filter_by(user_id=user_id, room_id=room_id, hour_start=hour_start)
            .first()
        )

        if existing is not None:
            existing.duration_seconds += duration_seconds
        else:
            record = FocusHourlyRecord(
                user_id=user_id,
                room_id=room_id,
                hour_start=hour_start,
                duration_seconds=duration_seconds,
                date=hour_start.date() if isinstance(hour_start, datetime) else date.today(),
            )
            session.add(record)
            session.flush()

    return {"detail": "已记录"}
