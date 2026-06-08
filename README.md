# 在线自习室 StudyRoom

> 带同侪压力的极简在线自习室 — 和好友一起专注，摸鱼会被发现。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/vue-3.5%2B-4fc08d)](https://vuejs.org/)

## 简介

StudyRoom 是一个实时在线自习室应用。用户可以创建/加入自习室，彼此看到对方的专注状态，切出页面会被广播"摸鱼"，支持房间聊天和专注数据统计。

**MVP 特性**：
- 创建/加入自习室（邀请码机制）
- 实时在线成员列表，专注/摸鱼状态广播
- 房间内聊天
- 切屏检测 + 10s 宽限期，切出即"摸鱼"
- 专注计时、打卡统计、热力图
- 好友关注 + 排行榜（周/月）
- 每日专注评分、连续打卡

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vue Router + ECharts |
| 后端 | FastAPI + WebSocket |
| ORM | SQLAlchemy (via bedrock-py) |
| 数据库 | SQLite |
| 认证 | JWT (HS256, 72h) |
| 构建 | Vite + uv |

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 18+
- uv (Python 包管理器)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/StudyRoom.git
cd StudyRoom
```

### 2. 后端

```bash
cd backend

# 创建虚拟环境并安装依赖
uv sync

# 复制环境变量文件并填写配置
cp ../.env.example .env
# 编辑 .env，填写 QQ 邮箱 SMTP 配置

# 启动后端（http://localhost:8000，支持热重载）
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（http://localhost:3000）
npx vite --host 0.0.0.0
```

### 4. 使用

打开浏览器访问 `http://localhost:3000`，注册账号即可使用。

## 项目结构

```
StudyRoom/
├── .env.example                 # 环境变量模板
├── .gitignore
├── README.md
├── CLAUDE.md                    # AI 助手工作指引
├── docs/                        # 完整项目文档
│   ├── PROJECT_STATE.md         # 项目进度与决策
│   ├── architecture.md          # 技术架构
│   ├── api-protocol.md          # API 协议
│   ├── design-spec.md           # 前端设计规范
│   └── development-guide.md     # 开发环境搭建
├── backend/                     # FastAPI 后端
│   ├── main.py                  # 入口
│   ├── pyproject.toml           # Python 依赖
│   └── src/studyroom/
│       ├── users/               # 用户模块（注册/登录/JWT）
│       ├── rooms/               # 自习室模块（CRUD/WebSocket）
│       ├── focus/               # 专注计时模块
│       └── dashboard/           # 数据大盘模块
└── frontend/                    # Vue 3 前端
    ├── package.json
    └── src/
        ├── App.vue              # 全局 CSS 变量
        ├── utils/api.js         # HTTP 封装 + JWT
        ├── views/               # LoginView, LobbyView, DashboardView
        └── components/          # Room, 数据大盘组件
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥 | `studyroom-dev-secret` |
| `SMTP_HOST` | SMTP 服务器 | `smtp.qq.com` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | 发件邮箱地址 | — |
| `SMTP_PASSWORD` | SMTP 授权码 | — |

> 完整模板见 `.env.example`。生产环境请务必修改 `JWT_SECRET`。

## 文档

| 文档 | 内容 |
|------|------|
| [架构设计](docs/architecture.md) | 技术架构、模块拆分、数据库设计 |
| [API 协议](docs/api-protocol.md) | HTTP API + WebSocket 协议 |
| [设计规范](docs/design-spec.md) | 配色、字体、组件、动画 |
| [开发指南](docs/development-guide.md) | 环境搭建、开发规范、调试技巧 |
| [项目进度](docs/PROJECT_STATE.md) | 决策记录、开发进度 |

## License

MIT
