"""专注计时模块 — 业务逻辑层。"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta

from bedrock.database import db

from .entities import DailyFocusResponse, FocusSummaryResponse, RoomFocusItem
from .models import FocusRecord


class FocusService:
    """专注记录服务。"""

    def record_focus(self, user_id: int, room_id: int, seconds: int) -> None:
        """记录专注时长。秒转分钟（向下取整），同天同房间累加。"""
        minutes = seconds // 60
        if minutes <= 0:
            return

        today = date.today()
        with db.session_scope() as session:
            record = (
                session.query(FocusRecord)
                .filter_by(user_id=user_id, room_id=room_id, date=today)
                .first()
            )
            if record is not None:
                record.duration += minutes
            else:
                record = FocusRecord(
                    user_id=user_id,
                    room_id=room_id,
                    duration=minutes,
                    date=today,
                )
                session.add(record)
                session.flush()

    def get_summary(self, user_id: int, days: int = 30) -> FocusSummaryResponse:
        """获取个人专注总览：今日、本周、近 N 天每日明细。"""
        today = date.today()
        start_date = today - timedelta(days=days - 1)
        week_start = today - timedelta(days=today.weekday())

        with db.session_scope() as session:
            records = (
                session.query(FocusRecord)
                .filter(
                    FocusRecord.user_id == user_id,
                    FocusRecord.date >= start_date,
                )
                .all()
            )

            today_minutes = 0
            week_minutes = 0
            by_date: dict[date, list[tuple[int, int]]] = defaultdict(list)

            for r in records:
                by_date[r.date].append((r.room_id, r.duration))
                if r.date == today:
                    today_minutes += r.duration
                if r.date >= week_start:
                    week_minutes += r.duration

        daily = []
        for d in sorted(by_date.keys(), reverse=True):
            items = by_date[d]
            daily.append(DailyFocusResponse(
                date=d,
                total_minutes=sum(m for _, m in items),
                records=[RoomFocusItem(room_id=rid, minutes=m) for rid, m in items],
            ))

        return FocusSummaryResponse(
            today_minutes=today_minutes,
            week_minutes=week_minutes,
            daily=daily,
        )

    def cleanup_old_records(self, keep_days: int = 30) -> int:
        """删除过期记录，返回删除条数。"""
        cutoff = date.today() - timedelta(days=keep_days)
        with db.session_scope() as session:
            count = (
                session.query(FocusRecord)
                .filter(FocusRecord.date < cutoff)
                .delete()
            )
            return count


focus_service = FocusService()
