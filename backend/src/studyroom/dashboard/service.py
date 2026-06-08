"""专注数据大盘模块 — 业务逻辑层。"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta

from bedrock.database import db
from sqlalchemy import func

from .entities import (
    DistributionResponse,
    FollowListResponse,
    FollowUserItem,
    HeatmapItem,
    HeatmapResponse,
    HourlyDistributionItem,
    LeaderboardItem,
    LeaderboardResponse,
    ScoreResponse,
    SettingsResponse,
    StatsResponse,
    StreakResponse,
)
from .exc import AlreadyFollowing, CannotFollowSelf, NotFollowing, UserNotFound
from .models import FocusHourlyRecord, FocusSession, UserFollow, UserSettings


class DashboardService:
    """专注数据大盘服务。"""

    def get_stats(self, user_id: int) -> StatsResponse:
        """获取今日/本周/本月专注总览。"""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        with db.session_scope() as session:
            # 今日
            today_result = (
                session.query(func.coalesce(func.sum(FocusHourlyRecord.duration_seconds), 0))
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date == today)
                .scalar()
            )
            today_minutes = int(today_result) // 60

            # 本周
            week_result = (
                session.query(func.coalesce(func.sum(FocusHourlyRecord.duration_seconds), 0))
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date >= week_start)
                .scalar()
            )
            week_minutes = int(week_result) // 60

            # 本月
            month_result = (
                session.query(func.coalesce(func.sum(FocusHourlyRecord.duration_seconds), 0))
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date >= month_start)
                .scalar()
            )
            month_minutes = int(month_result) // 60

            # 用户目标
            settings = session.query(UserSettings).filter_by(user_id=user_id).first()
            daily_goal = settings.daily_goal_minutes if settings else 120

        progress = min(today_minutes / daily_goal, 1.0) if daily_goal > 0 else 0.0

        return StatsResponse(
            today_minutes=today_minutes,
            week_minutes=week_minutes,
            month_minutes=month_minutes,
            today_goal=daily_goal,
            today_progress=round(progress, 2),
        )

    def get_heatmap(self, user_id: int, days: int = 180) -> HeatmapResponse:
        """获取热力图数据。"""
        start_date = date.today() - timedelta(days=days - 1)

        with db.session_scope() as session:
            records = (
                session.query(
                    FocusHourlyRecord.date,
                    func.sum(FocusHourlyRecord.duration_seconds).label("total_seconds"),
                )
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date >= start_date)
                .group_by(FocusHourlyRecord.date)
                .all()
            )

            # 获取用户目标用于计算 level
            settings = session.query(UserSettings).filter_by(user_id=user_id).first()
            daily_goal_minutes = settings.daily_goal_minutes if settings else 120

        data = []
        for r in records:
            minutes = int(r.total_seconds) // 60
            level = self._calc_heatmap_level(minutes, daily_goal_minutes)
            data.append(HeatmapItem(date=r.date, minutes=minutes, level=level))

        return HeatmapResponse(data=data)

    def get_distribution(self, user_id: int, days: int = 7) -> DistributionResponse:
        """获取按小时时间分布。"""
        start_date = date.today() - timedelta(days=days - 1)

        with db.session_scope() as session:
            records = (
                session.query(
                    func.extract("hour", FocusHourlyRecord.hour_start).label("hour"),
                    func.sum(FocusHourlyRecord.duration_seconds).label("total_seconds"),
                    func.count(FocusHourlyRecord.id).label("count"),
                )
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date >= start_date)
                .group_by(func.extract("hour", FocusHourlyRecord.hour_start))
                .all()
            )

        hours = []
        for r in records:
            avg_minutes = (int(r.total_seconds) / 60) / max(int(r.count), 1)
            hours.append(HourlyDistributionItem(hour=int(r.hour), avg_minutes=round(avg_minutes, 1)))

        return DistributionResponse(hours=hours)

    def get_score(self, user_id: int) -> ScoreResponse:
        """获取今日 Focus Score。"""
        today = date.today()

        with db.session_scope() as session:
            # 今日专注时长
            focus_result = (
                session.query(func.coalesce(func.sum(FocusHourlyRecord.duration_seconds), 0))
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date == today)
                .scalar()
            )
            focus_minutes = int(focus_result) // 60

            # 今日切屏次数
            away_result = (
                session.query(func.coalesce(func.sum(FocusSession.away_count), 0))
                .filter(
                    FocusSession.user_id == user_id,
                    func.date(FocusSession.start_time) == today,
                )
                .scalar()
            )
            away_count = int(away_result)

            # 用户目标
            settings = session.query(UserSettings).filter_by(user_id=user_id).first()
            daily_goal = settings.daily_goal_minutes if settings else 120

        # 计算分数
        if focus_minutes == 0:
            # 没有专注记录，直接 0 分
            score = 0
            duration_score = 0
            stability_score = 0
        else:
            # 时长分：完成目标的比例，最高 100
            duration_score = min(focus_minutes / daily_goal, 1.0) * 100 if daily_goal > 0 else 0
            # 稳定性分：每次切屏扣 2 分，最低 0
            stability_score = max(0, 100 - away_count * 2)
            # 总分：时长分 × 0.6 + 稳定性分 × 0.4，最低 0
            score = max(0, int(duration_score * 0.6 + stability_score * 0.4))

        return ScoreResponse(
            score=score,
            duration_score=int(duration_score),
            stability_score=int(stability_score),
            away_count=away_count,
            focus_minutes=focus_minutes,
        )

    def get_streak(self, user_id: int) -> StreakResponse:
        """获取连胜天数。"""
        today = date.today()

        with db.session_scope() as session:
            settings = session.query(UserSettings).filter_by(user_id=user_id).first()
            streak_goal_minutes = settings.streak_goal_minutes if settings else 30

            # 获取最近 365 天的每日专注记录
            start_date = today - timedelta(days=365)
            records = (
                session.query(
                    FocusHourlyRecord.date,
                    func.sum(FocusHourlyRecord.duration_seconds).label("total_seconds"),
                )
                .filter(FocusHourlyRecord.user_id == user_id, FocusHourlyRecord.date >= start_date)
                .group_by(FocusHourlyRecord.date)
                .order_by(FocusHourlyRecord.date.desc())
                .all()
            )

        # 构建日期 -> 分钟映射
        date_minutes: dict[date, int] = {}
        for r in records:
            date_minutes[r.date] = int(r.total_seconds) // 60

        # 计算当前连胜
        current_streak = 0
        check_date = today
        today_done = date_minutes.get(today, 0) >= streak_goal_minutes

        if not today_done:
            # 如果今天还没完成，从昨天开始算
            check_date = today - timedelta(days=1)

        while True:
            minutes = date_minutes.get(check_date, 0)
            if minutes >= streak_goal_minutes:
                current_streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # 计算最长连胜
        longest_streak = 0
        temp_streak = 0
        sorted_dates = sorted(date_minutes.keys())
        for d in sorted_dates:
            if date_minutes[d] >= streak_goal_minutes:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 0

        return StreakResponse(
            current_streak=current_streak,
            longest_streak=longest_streak,
            today_done=today_done,
        )

    def _calc_heatmap_level(self, minutes: int, daily_goal: int) -> int:
        """计算热力图等级（0-4）。"""
        if minutes == 0:
            return 0
        ratio = minutes / daily_goal if daily_goal > 0 else 0
        if ratio < 0.25:
            return 1
        if ratio < 0.5:
            return 2
        if ratio < 1.0:
            return 3
        return 4


class FollowService:
    """关注服务。"""

    def follow(self, follower_id: int, following_id: int) -> None:
        """关注用户。"""
        if follower_id == following_id:
            raise CannotFollowSelf()

        with db.session_scope() as session:
            # 检查目标用户是否存在
            from studyroom.users.models import User

            target = session.query(User).filter_by(id=following_id).first()
            if target is None:
                raise UserNotFound()

            # 检查是否已关注
            existing = (
                session.query(UserFollow)
                .filter_by(follower_id=follower_id, following_id=following_id)
                .first()
            )
            if existing is not None:
                raise AlreadyFollowing()

            follow_record = UserFollow(follower_id=follower_id, following_id=following_id)
            session.add(follow_record)
            session.flush()

    def unfollow(self, follower_id: int, following_id: int) -> None:
        """取消关注。"""
        with db.session_scope() as session:
            count = (
                session.query(UserFollow)
                .filter_by(follower_id=follower_id, following_id=following_id)
                .delete()
            )
            if count == 0:
                raise NotFollowing()

    def get_following(self, user_id: int) -> FollowListResponse:
        """获取我关注的人。"""
        with db.session_scope() as session:
            from studyroom.users.models import User

            results = (
                session.query(UserFollow, User)
                .join(User, UserFollow.following_id == User.id)
                .filter(UserFollow.follower_id == user_id)
                .order_by(UserFollow.created_at.desc())
                .all()
            )

            # 获取在线用户 ID
            from studyroom.rooms import manager as connection_manager

            online_user_ids = connection_manager.get_all_online_user_ids()

            users = []
            for follow, user in results:
                users.append(
                    FollowUserItem(
                        user_id=user.id,
                        nickname=user.nickname,
                        is_online=user.id in online_user_ids,
                        followed_at=follow.created_at,
                    )
                )

        return FollowListResponse(users=users)

    def get_followers(self, user_id: int) -> FollowListResponse:
        """获取关注我的人。"""
        with db.session_scope() as session:
            from studyroom.users.models import User

            results = (
                session.query(UserFollow, User)
                .join(User, UserFollow.follower_id == User.id)
                .filter(UserFollow.following_id == user_id)
                .order_by(UserFollow.created_at.desc())
                .all()
            )

            from studyroom.rooms import manager as connection_manager

            online_user_ids = connection_manager.get_all_online_user_ids()

            users = []
            for follow, user in results:
                users.append(
                    FollowUserItem(
                        user_id=user.id,
                        nickname=user.nickname,
                        is_online=user.id in online_user_ids,
                        followed_at=follow.created_at,
                    )
                )

        return FollowListResponse(users=users)

    def is_following(self, follower_id: int, following_id: int) -> bool:
        """检查是否已关注。"""
        with db.session_scope() as session:
            existing = (
                session.query(UserFollow)
                .filter_by(follower_id=follower_id, following_id=following_id)
                .first()
            )
            return existing is not None


class SettingsService:
    """用户设置服务。"""

    def get_settings(self, user_id: int) -> SettingsResponse:
        """获取用户设置。"""
        with db.session_scope() as session:
            settings = session.query(UserSettings).filter_by(user_id=user_id).first()
            if settings is None:
                # 创建默认设置
                settings = UserSettings(user_id=user_id)
                session.add(settings)
                session.flush()

            return SettingsResponse(
                daily_goal_minutes=settings.daily_goal_minutes,
                streak_goal_minutes=settings.streak_goal_minutes,
            )

    def update_settings(self, user_id: int, daily_goal_minutes: int | None, streak_goal_minutes: int | None) -> SettingsResponse:
        """更新用户设置。"""
        with db.session_scope() as session:
            settings = session.query(UserSettings).filter_by(user_id=user_id).first()
            if settings is None:
                settings = UserSettings(user_id=user_id)
                session.add(settings)
                session.flush()

            if daily_goal_minutes is not None:
                settings.daily_goal_minutes = max(1, daily_goal_minutes)
            if streak_goal_minutes is not None:
                settings.streak_goal_minutes = max(1, streak_goal_minutes)

            session.flush()

            return SettingsResponse(
                daily_goal_minutes=settings.daily_goal_minutes,
                streak_goal_minutes=settings.streak_goal_minutes,
            )


class LeaderboardService:
    """排行榜服务。"""

    def get_friends_leaderboard(self, user_id: int, period: str = "weekly", limit: int = 20) -> LeaderboardResponse:
        """获取好友排行榜。"""
        today = date.today()
        if period == "weekly":
            start_date = today - timedelta(days=today.weekday())
        else:  # monthly
            start_date = today.replace(day=1)

        with db.session_scope() as session:
            from studyroom.users.models import User

            # 获取关注的用户 ID
            following_ids = (
                session.query(UserFollow.following_id)
                .filter(UserFollow.follower_id == user_id)
                .all()
            )
            following_ids = [fid for (fid,) in following_ids]
            following_ids.append(user_id)  # 包含自己

            # 查询专注时长
            results = (
                session.query(
                    FocusHourlyRecord.user_id,
                    func.sum(FocusHourlyRecord.duration_seconds).label("total_seconds"),
                )
                .filter(
                    FocusHourlyRecord.user_id.in_(following_ids),
                    FocusHourlyRecord.date >= start_date,
                )
                .group_by(FocusHourlyRecord.user_id)
                .order_by(func.sum(FocusHourlyRecord.duration_seconds).desc())
                .limit(limit)
                .all()
            )

            # 获取用户信息
            user_ids = [r.user_id for r in results]
            users = session.query(User).filter(User.id.in_(user_ids)).all()
            user_map = {u.id: u.nickname for u in users}

            items = []
            for rank, r in enumerate(results, 1):
                items.append(
                    LeaderboardItem(
                        user_id=r.user_id,
                        nickname=user_map.get(r.user_id, f"用户#{r.user_id}"),
                        total_minutes=int(r.total_seconds) // 60,
                        rank=rank,
                    )
                )

        return LeaderboardResponse(items=items, period=period)

    def get_room_leaderboard(self, room_id: int, limit: int = 10) -> LeaderboardResponse:
        """获取房间内排行榜。"""
        today = date.today()

        with db.session_scope() as session:
            from studyroom.rooms.models import RoomMember
            from studyroom.users.models import User

            # 获取房间成员
            member_ids = (
                session.query(RoomMember.user_id)
                .filter(RoomMember.room_id == room_id)
                .all()
            )
            member_ids = [mid for (mid,) in member_ids]

            if not member_ids:
                return LeaderboardResponse(items=[], period="daily")

            # 查询今日专注时长
            results = (
                session.query(
                    FocusHourlyRecord.user_id,
                    func.sum(FocusHourlyRecord.duration_seconds).label("total_seconds"),
                )
                .filter(
                    FocusHourlyRecord.user_id.in_(member_ids),
                    FocusHourlyRecord.date == today,
                )
                .group_by(FocusHourlyRecord.user_id)
                .order_by(func.sum(FocusHourlyRecord.duration_seconds).desc())
                .limit(limit)
                .all()
            )

            # 获取用户信息
            user_ids = [r.user_id for r in results]
            users = session.query(User).filter(User.id.in_(user_ids)).all()
            user_map = {u.id: u.nickname for u in users}

            items = []
            for rank, r in enumerate(results, 1):
                items.append(
                    LeaderboardItem(
                        user_id=r.user_id,
                        nickname=user_map.get(r.user_id, f"用户#{r.user_id}"),
                        total_minutes=int(r.total_seconds) // 60,
                        rank=rank,
                    )
                )

        return LeaderboardResponse(items=items, period="daily")


# 单例
dashboard_service = DashboardService()
follow_service = FollowService()
settings_service = SettingsService()
leaderboard_service = LeaderboardService()
