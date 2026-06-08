# 技术架构设计

> 版本：0.1.0
> 更新：2026-05-28

---

## 1. 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | Vue 3 + Vite | Composition API，SPA 模式 |
| 路由 | vue-router 4 | createWebHistory，beforeEach 守卫 |
| 后端框架 | FastAPI | async/await，HTTP + WebSocket |
| 模块/DI/ORM | bedrock-py | manifest-driven 模块管理 |
| ORM | SQLAlchemy 2.0 | Column() 声明式，session_scope |
| 数据库 | SQLite | MVP 阶段，WAL 模式 |
| 实时通信 | WebSocket | 原生 WebSocket（非 Socket.IO） |
| 认证 | PyJWT | HS256，72h 过期 |
| 密码 | pbkdf2_hmac | sha256，100000 迭代，32-byte salt |
| 邮件 | smtplib | QQ 邮箱 SMTP（smtp.qq.com:587） |
| 后端包管理 | uv | pyproject.toml |
| 前端包管理 | npm | package.json |

---

## 2. 项目结构

```
StudyRoom/
├── CLAUDE.md                     # AI 工作指引
├── docs/                         # 项目文档
│   ├── README.md                 # 文档索引
│   ├── PROJECT_STATE.md          # 项目单点真相
│   ├── requirements.md           # 功能需求
│   ├── architecture.md           # 架构设计（本文件）
│   ├── design-spec.md            # 前端设计规范
│   ├── api-protocol.md           # API 协议
│   ├── development-guide.md      # 开发指南
│   └── changelog.md              # 变更日志
├── backend/                      # Python 后端
│   ├── main.py                   # 入口：bedrock.setup + FastAPI + CORS + 路由注册
│   ├── pyproject.toml            # uv 依赖配置
│   ├── uv.lock                   # 锁文件
│   ├── .env                      # 环境变量（SMTP、JWT Secret）
│   ├── studyroom.db              # SQLite 数据库文件
│   └── src/studyroom/            # 业务模块
│       ├── users/                # 用户模块
│       │   ├── __init__.py
│       │   ├── manifest.yaml
│       │   ├── models.py         # User, VerificationCode
│       │   ├── entities.py       # Pydantic 请求/响应
│       │   ├── service.py        # AuthService（注册/登录/验证/JWT）
│       │   ├── exc.py            # 认证异常
│       │   └── router.py         # /auth/* 路由 + get_current_user_id 依赖
│       └── rooms/                # 自习室模块
│           ├── __init__.py
│           ├── manifest.yaml
│           ├── bootstrap.py      # 生命周期：DB 初始化 + 超时检查
│           ├── models.py         # Room, RoomMember
│           ├── entities.py       # Pydantic 实体
│           ├── service.py        # RoomService（CRUD + 踢人/删房）
│           ├── exc.py            # 业务异常
│           ├── connection_manager.py  # WebSocket 连接管理
│           └── router.py         # HTTP + WebSocket 路由
├── frontend/                     # Vue 3 前端
│   ├── index.html                # 入口 HTML + Google Fonts
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js               # createApp + router
│       ├── App.vue               # 全局 CSS 变量 + 基础样式
│       ├── router/index.js       # 路由配置 + beforeEach 守卫
│       ├── utils/api.js          # fetch 封装 + wsUrl 构建 + token 管理
│       ├── views/
│       │   ├── LoginView.vue     # 登录/注册/验证
│       │   ├── LobbyView.vue     # 大厅：我的房间 + 创建/加入
│       │   └── RoomView.vue      # 房间包装组件
│       └── components/
│           └── Room.vue          # 核心组件：计时/成员/聊天/切屏检测
└── .gitignore
```

---

## 3. 数据流

### 3.1 认证流
```
注册 → 邮箱验证码 → 激活账号 → 返回 JWT
登录 → 验证密码 → 返回 JWT
每次请求 → HTTP Authorization: Bearer <JWT> → get_current_user_id 依赖解析
WebSocket → ?token=<JWT> → 解析 user_id
```

### 3.2 房间流
```
创建房间 → insert Room + RoomMember(owner) → 导航到 /room?roomId=X
加入房间 → 验证邀请码 → insert RoomMember → 导航到 /room?roomId=X
我的房间 → 查询 owner rooms + joined rooms → 含在线人数
WebSocket 连接 → is_member 检查 → 发送 room_state → 广播 user_join
```

### 3.3 状态广播流
```
切出页面 → 10s 宽限期 → 超时 → send status_change "away"
→ 后端 broadcast_status（10s 冷却）→ 广播 user_status 给所有人
→ 所有客户端更新成员列表

切回页面 → 显示遮罩 → 点击"我回来了" → send status_change "focusing"
→ 后端 broadcast_status → 广播 user_status
```

### 3.4 聊天流
```
用户输入 → send {type:"chat", message} → 后端 broadcast_to_room
→ 广播 {type:"chat", user_id, message} 给所有人（包括发送者）
```

---

## 4. 数据库设计

### rooms 表
| 列 | 类型 | 说明 |
|----|------|------|
| id | INTEGER PK | 自增 |
| name | VARCHAR(100) | 房间名称 |
| invite_code | VARCHAR(6) UNIQUE | 6 位邀请码 |
| max_members | INTEGER | 人数上限 |
| owner_id | INTEGER | 房主 user_id |
| is_active | BOOLEAN | 是否活跃 |
| created_at | DATETIME | 创建时间 |

### room_members 表
| 列 | 类型 | 说明 |
|----|------|------|
| id | INTEGER PK | 自增 |
| room_id | INTEGER FK→rooms.id CASCADE | 房间 ID |
| user_id | INTEGER | 用户 ID |
| status | VARCHAR(20) | focusing/away/offline |
| joined_at | DATETIME | 加入时间 |
| last_heartbeat | DATETIME | 最后心跳 |

### users 表
| 列 | 类型 | 说明 |
|----|------|------|
| id | INTEGER PK | 自增 |
| email | VARCHAR(255) UNIQUE | 邮箱 |
| nickname | VARCHAR(50) | 昵称 |
| password_hash | VARCHAR(255) | pbkdf2 哈希 |
| is_verified | BOOLEAN | 是否已验证 |
| created_at | DATETIME | 注册时间 |

### verification_codes 表
| 列 | 类型 | 说明 |
|----|------|------|
| id | INTEGER PK | 自增 |
| email | VARCHAR(255) | 邮箱 |
| code | VARCHAR(6) | 6 位验证码 |
| expires_at | DATETIME | 过期时间 |
| is_used | BOOLEAN | 是否已使用 |

---

## 5. 关键设计决策

1. **bedrock-py session_scope 必须显式 flush**：在 `session.add()` 后调用 `session.flush()` 确保 INSERT 在 commit 前排队（FastAPI 异步环境下有 contextvar 时序问题）
2. **WebSocket 断线不删成员记录**：保留 RoomMember，仅标记 offline，支持"我的房间"重连
3. **is_member 检查所有 WebSocket 连接**：防止未授权访问
4. **SQLAlchemy 对象不跨 session_scope 使用**：在 `with` 块内捕获局部变量
