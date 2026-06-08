"""用户模块 — 生命周期钩子。"""

from __future__ import annotations

from bedrock.module import AppConfig, ModuleRegistry


def ready(*, registry: ModuleRegistry, app: AppConfig) -> None:
    pass
