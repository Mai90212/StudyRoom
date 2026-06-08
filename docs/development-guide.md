# 开发指南

> 更新：2026-05-28

---

## 1. 环境准备

### 前置要求
- Python 3.13+
- Node.js 21+
- uv（Python 包管理器）
- npm

### 初始化

```bash
# 后端
cd backend
uv sync                                          # 安装 Python 依赖
cp .env.example .env                             # 配置环境变量（SMTP 等）

# 前端
cd frontend
npm install                                       # 安装 Node 依赖
```

### 环境变量（backend/.env）

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_qq@qq.com
SMTP_PASSWORD=your_smtp_auth_code
JWT_SECRET=your-secret-key                       # 可选，默认 studyroom-dev-secret
```

SMTP 未配置时验证码会打印到终端（开发模式）。

---

## 2. 启动开发服务器

```bash
# 终端 1：后端（http://localhost:8000）
cd backend
.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 终端 2：前端（http://localhost:3000）
cd frontend
npx vite --host 0.0.0.0
```

---

## 3. 开发规范

### 3.1 通用

1. **分步开发**：不一次性写完所有模块，每完成一步停下来验证
2. **更新文档**：功能变更后同步更新 `docs/PROJECT_STATE.md`
3. **测试优先**：每步完成后手动测试验证

### 3.2 后端（Python）

**目录规范**：
- `models.py` — SQLAlchemy 数据模型
- `entities.py` — Pydantic 请求/响应实体
- `service.py` — 业务逻辑（单例模式）
- `exc.py` — 模块异常（继承 `BedrockExc`，设置 `detail` 属性）
- `router.py` — FastAPI 路由（`APIRouter`）
- `bootstrap.py` — 生命周期钩子（`ready` / `on_shutdown`）

**关键注意**：
1. `session.add()` 后必须调用 `session.flush()`（FastAPI 异步环境下 contextvar 有时序问题）
2. ORM 对象属性不能跨 `session_scope()` 访问（DetachedInstanceError）
3. 在 `with` 块内捕获 ORM 属性到局部变量

### 3.3 前端（Vue 3）

**目录规范**：
- `views/` — 页面级组件（对应路由）
- `components/` — 可复用组件
- `utils/` — 工具函数（API 封装等）
- `router/` — 路由配置

**关键注意**：
1. 使用 Composition API（`<script setup>`）
2. Scoped 样式，CSS 变量从 App.vue 继承
3. API 调用统一走 `utils/api.js`（自动带 JWT）

---

## 4. 数据库操作

```bash
# 查看 SQLite 数据
cd backend
.venv/bin/python -c "
import sqlite3
conn = sqlite3.connect('studyroom.db')
# 查询...
conn.close()
"

# 删除数据库重建（开发阶段）
rm backend/studyroom.db
# 重启后端自动创建
```

---

## 5. 执行步骤（已完成 → 下一步）

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 项目初始化 + rooms 模块骨架 | ✅ |
| 2 | rooms WebSocket 核心逻辑 | ✅ |
| 3 | users 模块（注册/登录/JWT） | ✅ |
| 4 | Vue 3 前端（切屏检测/计时/聊天） | ✅ |
| 5 | 前端重设计（暖调书房主题） | ✅ |
| 6 | rooms 高级功能（踢人/删房/我的房间） | ✅ |
| 7 | focus 计时模块（持久化专注记录） | ✅ |
| 8 | SMTP 邮箱配置 | ✅ |
| 9 | dashboard 数据大盘模块 | ✅ |
| 10 | v2 功能（番茄钟） | 📋 |
| 11 | 前端上线部署（项目完成后） | 📋 |

---

## 6. 常用调试

```bash
# 检查端口占用
lsof -ti:8000
lsof -ti:3000

# 杀掉占用进程
lsof -ti:8000 -ti:3000 | xargs kill

# 前端构建检查
cd frontend && npx vite build
```
