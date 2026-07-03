# PROJECT_STATE.md — 在线自习室项目单点真相

> 最后更新：2026-07-04
> 当前阶段：前端已从 Vue 3 重写为 React + TSX，下一步 v2 功能（番茄钟）或上线部署

---

## 项目概述

**带同侪压力的极简在线自习室（MVP）**。用户创建/加入自习室，实时看到他人专注状态，切出页面会被广播"摸鱼"并提醒，支持房间公屏聊天和专注时长统计。

---

## 技术栈与架构

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 18 + TypeScript + Vite | SPA，Page Visibility API 检测切屏 |
| UI 组件 | shadcn/ui + Radix UI + Tailwind CSS | 原子组件库 |
| 客户端状态 | Zustand | authStore / uiStore |
| 服务端状态 | TanStack Query v5 | 数据获取与缓存 |
| 表单 | React Hook Form + Zod | 类型安全校验 |
| 图表 | ECharts + echarts-for-react | 热力图/分布/仪表盘 |
| 动画 | framer-motion | 页面过渡与弹窗 |
| HTTP | Axios | JWT 拦截器 + 401 重定向 |
| 后端框架 | FastAPI | HTTP REST + WebSocket |
| 模块/DI/ORM | bedrock-py | manifest-driven 模块管理，SQLAlchemy 2.0 |
| 数据库 | SQLite | MVP 阶段，后续可换 PostgreSQL |
| 实时通信 | WebSocket | 状态广播、聊天、心跳 |
| 后端包管理 | uv | Python 项目依赖管理 |
| 前端包管理 | npm | Node.js 依赖管理 |

### 项目目录结构
```
StudyRoom/
├── backend/                # Python 后端
│   ├── main.py             # 入口（bedrock.setup + FastAPI）
│   ├── pyproject.toml      # uv 配置
│   ├── uv.lock
│   ├── test.html           # 手动测试客户端
│   └── studyroom/
│       └── rooms/          # 自习室模块
├── frontend/               # Vue 3 前端
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue         # 大厅（创建/加入房间）
│       └── components/
│           └── Room.vue    # 同侪压力核心组件
├── PROJECT_STATE.md        # 项目单点真相
└── .gitignore
```

### 核心机制
- **切屏检测**：前端 `Page Visibility API` + 定时心跳（~10s 宽限期后才广播）
- **状态广播**：WebSocket 推送 `user_status` / `user_join` / `user_leave` 事件
- **同侪压力**：切出页面 → 广播"摸鱼" → 切回后弹窗 → 用户点击"我回来了"才恢复
- **专注计时**：统计每日/每周专注时长（精确到分钟），保留 30 天

### bedrock-py 模块拆分
```
backend/studyroom/
├── rooms/     # 自习室模块 ✅
├── users/     # 用户模块（后续）
├── focus/     # 计时模块（后续）
└── chat/      # 聊天模块（后续）
```

---

## 核心决策与约束

> **重要**：以下决策已确认，新模型接手时请勿推翻或重新设计。

| # | 决策 | 详情 |
|---|------|------|
| 1 | MVP 优先，不做过度设计 | 排行榜、番茄钟等 v2 再做 |
| 2 | 邮箱注册 | 短信验证码后续可选 |
| 3 | 一人一设备一房间 | 后登录踢前连接，同时只能进一间房 |
| 4 | 6 位邀请码加入 | 字母+数字，自动生成 |
| 5 | 房间上限 20 人 | 个人服务器负载考虑 |
| 6 | 房主权限 | 踢人、删房；删房时级联删除所有关联数据 |
| 7 | 切屏宽限期 ~10s | 避免频繁切换导致广播骚扰 |
| 8 | 状态变更冷却 10s | 限速截流，防止刷屏 |
| 9 | "我回来了"弹窗确认 | 切回页面后必须手动确认才恢复专注 |
| 10 | 未恢复期间 = 摸鱼 | 弹窗挡着也算摸鱼时间 |
| 11 | 专注时长精确到分钟 | 不精确到秒 |
| 12 | 聊天不持久化 | 刷新即消失，仅房间公屏 |
| 13 | JWT 认证 | 用户登录后签发 JWT |
| 14 | 分步开发 | 不一次性写完所有模块，写完一步停一步 |
| 15 | PROJECT_STATE.md 持续更新 | 每完成核心功能或架构变更后主动更新 |

---

## 已完成事项

### 项目初始化
- [x] 项目目录创建
- [x] `pyproject.toml` 配置（bedrock-core + fastapi + uvicorn）
- [x] `studyroom/` 顶层包创建
- [x] PROJECT_STATE.md 创建

### rooms 模块骨架
- [x] `rooms/manifest.yaml` — 模块声明
- [x] `rooms/models.py` — Room + RoomMember 表（CASCADE 删除）
- [x] `rooms/entities.py` — Pydantic 实体（RoomCreate, RoomJoin, RoomResponse, RoomMemberResponse）
- [x] `rooms/exc.py` — 6 个业务异常
- [x] `rooms/__init__.py` — 公开导出

### rooms WebSocket 核心逻辑
- [x] `rooms/connection_manager.py` — WebSocket 连接管理器
  - 单例 `ConnectionManager`，按房间管理连接
  - `connect` / `disconnect` / `leave` — 生命周期管理
  - `broadcast_to_room` / `broadcast_status` — 消息广播
  - 状态变更 10s 冷却限速
  - 心跳超时 30s 自动清理
  - 广播时自动移除断线连接
- [x] `rooms/service.py` — 房间业务逻辑
  - `RoomService` 单例：`create_room` / `join_room` / `leave_room` / `get_room` / `get_room_members` / `is_member` / `is_owner`
  - 使用 `db.session_scope()` 进行数据库操作
  - 人数上限检查、重复加入检查
- [x] `rooms/router.py` — HTTP + WebSocket 路由
  - `POST /rooms` — 创建房间
  - `POST /rooms/join` — 加入房间
  - `POST /rooms/{room_id}/leave` — 退出房间
  - `GET /rooms/{room_id}/members` — 成员列表
  - `WS /rooms/{room_id}/ws?user_id=X` — WebSocket 长连接
    - 支持 `heartbeat` / `status_change` / `chat` 消息
- [x] `rooms/bootstrap.py` — 生命周期钩子
  - `ready`: 初始化 SQLite DB + 创建表 + 启动心跳超时后台检查
  - `on_shutdown`: 取消后台任务

### 入口与测试
- [x] `main.py` — FastAPI 入口（bedrock.setup + CORS + root 路由，注册 users + rooms 路由）
- [x] `test.html` — 手动测试客户端
- [x] 后端 WebSocket 和房间逻辑已通过手动测试 ✅

### users 模块
- [x] `users/models.py` — User + VerificationCode 表
- [x] `users/entities.py` — Register/Login/Verify 请求/响应
- [x] `users/exc.py` — 6 个认证异常
- [x] `users/service.py` — AuthService
  - `register` + `send_verification_code`（SMTP / QQ 邮箱）
  - `verify_email` → 激活账号 → 返回 JWT
  - `login` → 密码验证 → 返回 JWT
  - `get_user_id_from_token` → JWT 解析
  - pbkdf2_hmac 密码哈希（无额外依赖）
- [x] `users/router.py` — `POST /auth/register` `/auth/verify` `/auth/login` `GET /auth/me`
- [x] JWT 集成到 rooms 路由（`Depends(get_current_user_id)` + WebSocket `token` 参数）
- [x] 邮箱验证码注册流程：填写信息 → 发验证码 → 输入验证码 → 创建账号并登录
- [x] SMTP 未配置时回退打印到终端

### Vue 3 前端
- [x] `vue-router` — 路由保护（未登录重定向到 /）
- [x] `LoginView.vue` — 登录/注册/验证码输入
- [x] `LobbyView.vue` — 创建/加入房间
- [x] `RoomView.vue` — 包装 Room 组件
- [x] `Room.vue` — 同侪压力核心组件
  - Page Visibility API 切屏检测 + 10s 宽容期
  - 全屏遮罩"我回来了"确认机制
  - 状态广播（focusing/away）
  - 专注计时器 + report_time 上报
  - 邀请码分享按钮
  - 房间公屏聊天 + 在线成员列表
  - WebSocket 连接支持 JWT token 参数
- [x] `utils/api.js` — fetch 封装（自动带 Authorization header + wsUrl 构建）

---

### rooms 高级功能
- [x] 踢人（`POST /rooms/{id}/kick/{uid}`，WebSocket 通知）
- [x] 删除房间（`DELETE /rooms/{id}`，级联删除 + 广播通知）
- [x] 我的房间（`GET /rooms/my`，含在线人数）
- [x] 单房间查询（`GET /rooms/{id}`）
- [x] WebSocket 初始状态同步（`room_state` 消息）
- [x] 断线保留成员记录，支持重连

### Vue 3 前端重设计
- [x] 暖调书房主题（CSS 变量系统：Cream + Indigo + Sage Green）
- [x] LoginView — 滑动指示器、加载状态、验证码分隔线
- [x] LobbyView — 我的房间卡片网格、人数步进器、浮动错误提示
- [x] Room.vue — 全屏布局、成员气泡、聊天气泡、踢人/删房按钮
- [x] 动画系统（fadeIn / slideUp / breathe / spin）

### 项目文档
- [x] docs/ 文件夹 — 需求、架构、设计规范、API 协议、开发指南、变更日志
- [x] CLAUDE.md — AI 工作指引

### focus 计时模块
- [x] `focus/models.py` — FocusRecord 表（同用户同房间同天唯一）
- [x] `focus/entities.py` — Pydantic 实体（FocusReportRequest, FocusSummaryResponse）
- [x] `focus/service.py` — FocusService（record_focus, get_summary, cleanup_old_records）
- [x] `focus/router.py` — HTTP 路由（POST /focus/report, GET /focus/me）
- [x] `focus/manifest.yaml` — 模块声明（依赖 users + rooms）
- [x] `focus/bootstrap.py` — 生命周期钩子（30天记录清理）
- [x] WebSocket report_time 上报集成（前端 Room.vue）
- [x] sendBeacon 关闭页面时上报

### SMTP 邮箱配置
- [x] QQ 邮箱 SMTP 已配置（验证码正式发送到邮箱）

### 前端 shadcn-vue 重构（2026-06-10, 5 个 wave）
- [x] **Wave 1 基础设施**：Tailwind v4 + shadcn-vue init + OKLCH token bridge + MCP 切换 (`shadcn@latest mcp` → `shadcn-vue@latest mcp`)
- [x] **Wave 2 组件安装**：15 个 shadcn-vue 原子组件 (button/card/input/label/tabs/dialog/alert-dialog/dropdown-menu/badge/avatar/separator/scroll-area/sonner/tooltip/skeleton)
- [x] **Wave 3 LoginView**：Card+Tabs+Input+Button+自写 toast；修 setTimeout 错误泄漏
- [x] **Wave 4a LobbyView**：Card 卡片 + DropdownMenu + Skeleton + Badge + 自定义 stepper；修 4s setTimeout 泄漏
- [x] **Wave 4b Room.vue**：UI 全换 shadcn-vue（保持单文件，逻辑零改动）+ AlertDialog 替代 3 处 confirm() + nickname 反查
- [x] **Wave 4c Dashboard**：DashboardView + 3 ECharts + 4 子组件全部 Card 化；**修 3 个 resize 监听泄漏 + 1 个 LobbyView setTimeout 泄漏**
- [x] **Wave 5 文档同步**：design-spec.md v2（OKLCH/lucide/Theming/a11y 章节）+ changelog
- [x] **自写 toast 系统**：composables/useToast.js + components/ui/toaster（替代 vue-sonner ESM 双实例问题）
- [x] **lucide-vue icons**：全面替换 emoji（零 emoji）

### dashboard 数据大盘模块
- [x] `dashboard/models.py` — FocusHourlyRecord, FocusSession, UserFollow, UserSettings 表
- [x] `dashboard/entities.py` — Pydantic 实体（Stats, Heatmap, Distribution, Score, Streak, Follow, Leaderboard, Settings）
- [x] `dashboard/service.py` — DashboardService, FollowService, SettingsService, LeaderboardService
- [x] `dashboard/router.py` — HTTP 路由（/dashboard/*, /follow/*, /leaderboard/*, /settings）
- [x] `dashboard/manifest.yaml` — 模块声明（依赖 users + rooms + focus）
- [x] `dashboard/bootstrap.py` — 生命周期钩子（90天记录清理）
- [x] 扩展 focus router — session/hourly 上报 API
- [x] 扩展 rooms router — 房间排行榜 API
- [x] 注册到 main.py
- [x] 前端：ECharts 安装
- [x] 前端：Room.vue 数据采集（切屏统计 + 按小时上报 + 离开上报）
- [x] 前端：Room.vue 房间内排行榜
- [x] 前端：DashboardView 页面 + 路由（/dashboard）
- [x] 前端：StatsCards 组件（今日/本周/本月专注时长）
- [x] 前端：Heatmap 组件（180天热力图，ECharts calendar）
- [x] 前端：DistributionChart 组件（按小时时间分布，ECharts line）
- [x] 前端：ScoreGauge 组件（Focus Score 仪表盘，ECharts gauge）
- [x] 前端：StreakBadge 组件（连胜徽章）
- [x] 前端：FriendStatus 组件（好友状态墙）
- [x] 前端：Leaderboard 组件（好友周/月排行榜）
- [x] 前端：LobbyView 入口（用户名下拉菜单 → 专注数据）

---

## 待办事项

### 下一步
- [ ] v2 功能（番茄钟）
- [ ] 前端上线部署（项目完成后）

### 已完成
- [x] focus 计时模块（持久化专注记录到数据库）
- [x] 邮箱验证码服务正式接入（SMTP 已配置）
- [x] dashboard 数据大盘模块（热力图、Focus Score、时间分布、好友状态、排行榜）

---

## 用户状态机

```
进入自习室 → 专注中 → (切屏超10s) → 摸鱼中 → (切回弹窗) → 待确认 → (点"我回来了") → 专注中
                                                      ↘ (关页面/断网) → 离线
```

---

## WebSocket 协议

### 客户端 → 服务端
| 事件 | 载荷 |
|------|------|
| `heartbeat` | `{ts}` |
| `status_change` | `{status: "focusing"/"away"}` |
| `chat` | `{message}` |
| `leave` | `{}` |

### 服务端 → 客户端（广播）
| 事件 | 载荷 |
|------|------|
| `user_status` | `{user_id, nickname, status}` |
| `user_join` | `{user_id, nickname}` |
| `user_leave` | `{user_id, nickname, reason: "leave"/"kick"/"offline"}` |
| `chat` | `{user_id, nickname, message, ts}` |
| `room_deleted` | `{}` |
| `kicked` | `{}` |
| `force_logout` | `{}` |
