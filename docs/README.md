# 在线自习室 — 文档索引

> 项目：带同侪压力的在线自习室（MVP）
> 更新：2026-05-28

## 文档导航

| 文档 | 说明 | 面向 |
|------|------|------|
| [PROJECT_STATE.md](./PROJECT_STATE.md) | **项目单点真相** — 总览、决策、进度 | 所有人 |
| [requirements.md](./requirements.md) | 功能需求规格 | PM / 开发者 |
| [architecture.md](./architecture.md) | 技术架构设计 | 后端 / 全栈 |
| [design-spec.md](./design-spec.md) | 前端设计规范（配色、字体、组件、动画） | 前端 |
| [api-protocol.md](./api-protocol.md) | HTTP API + WebSocket 通信协议 | 前后端 |
| [development-guide.md](./development-guide.md) | 开发环境、规范、执行步骤 | 开发者 |
| [changelog.md](./changelog.md) | 变更日志 | 所有人 |

## 快速链接

- **启动后端**：`cd backend && .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **启动前端**：`cd frontend && npx vite --host 0.0.0.0`
- **后端入口**：`backend/main.py`
- **数据库文件**：`backend/studyroom.db`（SQLite）
- **前端入口**：`frontend/src/main.js`
- **环境配置**：`backend/.env`（SMTP、JWT Secret 等）
