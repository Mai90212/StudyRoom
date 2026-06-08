"""专注计时模块 — SQLAlchemy 数据模型。"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, UniqueConstraint, func

from bedrock.database.base import BedrockModel


class FocusRecord(BedrockModel):
    """专注记录表。同用户同房间同天只有一条记录，多次上报累加 duration。"""

    __tablename__ = "focus_records"
    __table_args__ = (
        UniqueConstraint("user_id", "room_id", "date", name="uq_user_room_date"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="用户 ID")
    room_id = Column(Integer, nullable=False, comment="房间 ID")
    duration = Column(Integer, nullable=False, default=0, comment="专注分钟数")
    date = Column(Date, nullable=False, default=date.today, comment="记录日期")
    created_at = Column(DateTime, nullable=False, default=func.now(), comment="首次记录时间")
