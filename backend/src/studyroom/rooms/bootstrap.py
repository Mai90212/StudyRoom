"""自习室模块 — 生命周期钩子。"""

from __future__ import annotations

import asyncio

from bedrock.database import db
from bedrock.logging import get_logger
from bedrock.module import AppConfig, ModuleRegistry

from .connection_manager import manager

logger = get_logger(__name__)
_timeout_task: asyncio.Task | None = None


async def _timeout_check_loop(interval: float = 15.0) -> None:
    """后台循环：每 interval 秒检查超时连接并清理。"""
    while True:
        await asyncio.sleep(interval)
        try:
            await manager.check_timeouts()
        except Exception as exc:
            logger.warning(f"心跳超时检查出错: {exc}")


def ready(*, registry: ModuleRegistry, app: AppConfig) -> None:
    """所有模块就绪后调用 — 初始化数据库并启动超时检查。"""
    from bedrock.database.base import BedrockModel

    db.init("sqlite:///studyroom.db")
    BedrockModel.metadata.create_all(db.engine)

    global _timeout_task
    try:
        loop = asyncio.get_running_loop()
        _timeout_task = loop.create_task(_timeout_check_loop())
        logger.info("自习室模块已就绪，心跳超时检查已启动")
    except RuntimeError:
        logger.warning("当前无事件循环，心跳超时检查将在首次请求时启动")


def on_shutdown(*, registry: ModuleRegistry, app: AppConfig) -> None:
    """应用关闭时取消后台任务。"""
    global _timeout_task
    if _timeout_task is not None:
        _timeout_task.cancel()
        _timeout_task = None
