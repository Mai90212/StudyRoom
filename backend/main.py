"""在线自习室 — 入口文件。

启动方式：:

    BEDROCK_APP=studyroom.rooms uv run uvicorn main:app --reload
"""

from __future__ import annotations

import os
from pathlib import Path

import bedrock
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# 加载 .env 文件
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

bedrock.setup("studyroom.focus")

# 创建 dashboard 模块的表
from bedrock.database import db
from bedrock.database.base import BedrockModel
from studyroom.dashboard.models import FocusHourlyRecord, FocusSession, UserFollow, UserSettings

BedrockModel.metadata.create_all(db.engine)

app = FastAPI(title="在线自习室", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(bedrock.exc.BedrockExc)
async def bedrock_exc_handler(request: Request, exc: bedrock.exc.BedrockExc) -> JSONResponse:
    """业务异常 → HTTP 响应。状态码由异常类的 status_code 类属性决定，默认 400。"""
    status_code = getattr(exc, "status_code", 400)
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.detail},
    )


from studyroom.users.router import router as users_router
from studyroom.rooms.router import router as rooms_router
from studyroom.focus.router import router as focus_router
from studyroom.dashboard.router import router as dashboard_router

app.include_router(users_router)
app.include_router(rooms_router)
app.include_router(focus_router)
app.include_router(dashboard_router)


@app.get("/")
async def root():
    return {"app": "在线自习室", "version": "0.1.0"}
