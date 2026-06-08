"""专注数据大盘模块 — SQLAlchemy 数据模型。"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, UniqueConstraint, func

from bedrock.database.base import BedrockModel


class FocusHourlyRecord(BedrockModel):
    """小时专注记录表。同用户同房间同小时只有一条记录。"""

    __tablename__ = "focus_hourly_records"
    __table_args__ = (
        UniqueConstraint("user_id", "room_id", "hour_start", name="uq_user_room_hour"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="用户 ID")
    room_id = Column(Integer, nullable=False, comment="房间 ID")
    hour_start = Column(DateTime, nullable=False, comment="小时开始时间")
    duration_seconds = Column(Integer, nullable=False, default=0, comment="该小时专注秒数")
    date = Column(Date, nullable=False, default=date.today, comment="记录日期")
    created_at = Column(DateTime, nullable=False, default=func.now(), comment="记录时间")


class FocusSession(BedrockModel):
    """专注会话表。记录用户每次进入房间的专注数据。"""

    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="用户 ID")
    room_id = Column(Integer, nullable=False, comment="房间 ID")
    start_time = Column(DateTime, nullable=False, comment="进入房间时间")
    end_time = Column(DateTime, nullable=True, comment="离开房间时间")
    total_seconds = Column(Integer, nullable=False, default=0, comment="总专注秒数")
    away_seconds = Column(Integer, nullable=False, default=0, comment="离开（摸鱼）秒数")
    away_count = Column(Integer, nullable=False, default=0, comment="切屏/离开次数")
    created_at = Column(DateTime, nullable=False, default=func.now(), comment="记录时间")


class UserFollow(BedrockModel):
    """关注关系表。单向关注，不需要对方确认。"""

    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    follower_id = Column(Integer, nullable=False, comment="关注者 user_id")
    following_id = Column(Integer, nullable=False, comment="被关注者 user_id")
    created_at = Column(DateTime, nullable=False, default=func.now(), comment="关注时间")


class UserSettings(BedrockModel):
    """用户设置表。"""

    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, unique=True, nullable=False, comment="用户 ID")
    daily_goal_minutes = Column(Integer, nullable=False, default=120, comment="每日目标（分钟）")
    streak_goal_minutes = Column(Integer, nullable=False, default=30, comment="连胜最低要求（分钟）")
    created_at = Column(DateTime, nullable=False, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now(), comment="更新时间")
