"""专注数据大盘模块 — 生命周期钩子。"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from loguru import logger


async def _cleanup_old_records() -> None:
    """定时清理过期记录（90 天）。"""
    while True:
        try:
            await asyncio.sleep(86400)  # 每天执行一次
            cutoff = datetime.now() - timedelta(days=90)

            from bedrock.database import db

            from .models import FocusHourlyRecord, FocusSession

            with db.session_scope() as session:
                # 清理小时记录
                hourly_count = (
                    session.query(FocusHourlyRecord)
                    .filter(FocusHourlyRecord.created_at < cutoff)
                    .delete()
                )

                # 清理会话记录
                session_count = (
                    session.query(FocusSession)
                    .filter(FocusSession.created_at < cutoff)
                    .delete()
                )

                if hourly_count > 0 or session_count > 0:
                    logger.info(f"清理过期记录: 小时记录 {hourly_count} 条, 会话记录 {session_count} 条")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"清理过期记录失败: {e}")
            await asyncio.sleep(60)  # 出错后等待 1 分钟重试


_cleanup_task: asyncio.Task | None = None


def ready(*, registry, app) -> None:
    """模块就绪时创建表并启动定时清理任务。"""
    global _cleanup_task

    # 创建表
    from bedrock.database import db
    from bedrock.database.base import BedrockModel

    BedrockModel.metadata.create_all(db.engine)
    logger.info("专注数据大盘表已创建")

    try:
        loop = asyncio.get_running_loop()
        _cleanup_task = loop.create_task(_cleanup_old_records())
        logger.info("专注数据大盘模块已就绪，定时清理任务已启动")
    except RuntimeError:
        logger.warning("当前无事件循环，清理任务将在首次请求时启动")


def on_shutdown(*, registry, app) -> None:
    """模块关闭时取消定时任务。"""
    global _cleanup_task
    if _cleanup_task is not None:
        _cleanup_task.cancel()
        _cleanup_task = None
