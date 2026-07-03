# CLAUDE.md — 在线自习室 AI 工作指引

> 此文件为 AI 助手（Claude Code 等）提供项目上下文和工作规范。

---

## 项目概述

**带同侪压力的极简在线自习室（MVP）**。用户创建/加入自习室，实时看到他人专注状态，切出页面会被广播"摸鱼"，支持房间聊天和专注计时。

- **技术栈**：React 18 + TypeScript + FastAPI + WebSocket + bedrock-py + SQLite
- **当前阶段**：前端已从 Vue 3 重写为 React + TSX，下一步 v2 功能（番茄钟）或上线部署
- **核心文档**：[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — 单点真相，每次改动后更新

---

## 启动命令

```bash
# 后端（http://localhost:8000，支持热重载）
cd backend && .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 前端（http://localhost:3000）
cd frontend && npx vite --host 0.0.0.0
```

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) | **项目单点真相** — 决策、进度、状态机 |
| [docs/requirements.md](docs/requirements.md) | 功能需求规格 |
| [docs/architecture.md](docs/architecture.md) | 技术架构、模块拆分、数据库设计 |
| [docs/design-spec.md](docs/design-spec.md) | 前端设计规范（配色/字体/组件/动画） |
| [docs/api-protocol.md](docs/api-protocol.md) | HTTP API + WebSocket 协议 |
| [docs/development-guide.md](docs/development-guide.md) | 环境搭建、开发规范、调试技巧 |
| [docs/changelog.md](docs/changelog.md) | 变更日志 |

---

## 项目结构速览

```
StudyRoom/
├── CLAUDE.md                    # 本文件
├── docs/                        # 完整项目文档
│   ├── PROJECT_STATE.md         # （根目录有 symlink）
│   └── ...
├── backend/                     # Python FastAPI 后端
│   ├── main.py                  # 入口
│   ├── .env                     # SMTP、JWT Secret 配置
│   ├── studyroom.db             # SQLite 数据库
│   └── src/studyroom/
│       ├── users/               # 用户模块（注册/登录/验证/JWT）
│       └── rooms/               # 自习室模块（CRUD/WebSocket/踢人/删房）
└── frontend/                    # React 18 + TypeScript 前端
    └── src/
        ├── main.tsx             # 入口（QueryClient + BrowserRouter + Toaster）
        ├── App.tsx              # 路由根
        ├── index.css            # OKLCH 暖调书房主题 tokens
        ├── lib/api.ts           # Axios 实例 + JWT 拦截器 + buildWsUrl
        ├── types/api.ts         # 全局 API 类型定义
        ├── api/                 # 按模块拆分 API 调用
        ├── stores/              # Zustand stores（authStore, uiStore）
        ├── hooks/               # TanStack Query hooks
        ├── components/ui/       # shadcn/ui 原子组件
        ├── components/dashboard/# 仪表盘子组件（7 个）
        ├── pages/               # LoginPage, LobbyPage, RoomPage, DashboardPage
        └── router/index.tsx     # 路由表 + AuthGuard
```

---

## 关键规范和陷阱

### bedrock-py / SQLAlchemy

1. **`session.add()` 后必须 `session.flush()`**
   FastAPI 异步环境下 contextvar 有时序问题，未 flush 的 INSERT 可能丢失。
   ```python
   session.add(obj)
   session.flush()  # 必须！
   ```

2. **ORM 属性不能跨 `session_scope()` 访问**
   ```python
   # ❌ 错误
   with db.session_scope() as session:
       user = session.query(User).filter_by(...).first()
   return user.id  # DetachedInstanceError!

   # ✅ 正确
   with db.session_scope() as session:
       user = session.query(User).filter_by(...).first()
       user_id = user.id  # 捕获到局部变量
   return user_id
   ```

3. **模块结构**：每个模块有自己的 models / entities / service / exc / router

### 前端

1. **CSS 变量来自 App.vue `:root`**，组件 scoped 样式直接使用
2. **API 调用统一走 `utils/api.js`**（自动带 Authorization header）
3. **路由守卫在 `router/index.js` 的 `beforeEach`**，检查 token 存在性

### WebSocket

1. 新用户连接时先发 `room_state`（已有成员），再广播 `user_join`
2. 断线保留 RoomMember 记录（不删除），标记 status=offline
3. 状态广播有 10s 冷却（`STATUS_COOLDOWN`）

---

## 开发工作流

1. 阅读相关文档（docs/）
2. 逐步修改，每步验证
3. 功能完成后更新 `docs/PROJECT_STATE.md` 和 `docs/changelog.md`
4. 前后端都支持热重载，修改后直接刷新浏览器即可验证

## 决策约束

以下决策已确认，**请勿推翻**：

- MVP 优先，不做排行榜/番茄钟（v2 功能）
- 一人一设备一房间
- 聊天不持久化
- JWT 认证（HS256，72h）
- 切屏宽限期 10s，状态冷却 10s
- 专注时长精确到分钟
- QQ 邮箱 SMTP
- 分步开发，逐步验证
