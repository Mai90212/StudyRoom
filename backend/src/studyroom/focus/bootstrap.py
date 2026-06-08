"""专注计时模块 — 生命周期钩子。"""

from __future__ import annotations

import asyncio

from bedrock.database import db
from bedrock.logging import get_logger
from bedrock.module import AppConfig, ModuleRegistry

from .service import focus_service

logger = get_logger(__name__)
_cleanup_task: asyncio.Task | None = None

CLEANUP_INTERVAL = 3600 * 24  # 每 24 小时清理一次


async def _cleanup_loop() -> None:
    """后台循环：定期清理过期专注记录。"""
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL)
        try:
            count = focus_service.cleanup_old_records()
            if count > 0:
                logger.info(f"清理了 {count} 条过期专注记录")
        except Exception as exc:
            logger.warning(f"专注记录清理出错: {exc}")


def ready(*, registry: ModuleRegistry, app: AppConfig) -> None:
    """模块就绪 — 建表并启动清理任务。"""
    from bedrock.database.base import BedrockModel

    BedrockModel.metadata.create_all(db.engine)

    global _cleanup_task
    try:
        loop = asyncio.get_running_loop()
        _cleanup_task = loop.create_task(_cleanup_loop())
        logger.info("专注计时模块已就绪")
    except RuntimeError:
        logger.warning("当前无事件循环，清理任务将延迟启动")


def on_shutdown(*, registry: ModuleRegistry, app: AppConfig) -> None:
    """应用关闭时取消后台任务。"""
    global _cleanup_task
    if _cleanup_task is not None:
        _cleanup_task.cancel()
        _cleanup_task = None
