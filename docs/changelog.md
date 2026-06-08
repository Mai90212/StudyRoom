# 变更日志

> 格式参考：Keep a Changelog
> 版本：0.1.0（MVP 开发中）

---

## [Unreleased] — 2026-06-04

### Added
- **dashboard 数据大盘模块**：专注数据可视化
  - 热力图（180 天，GitHub 风格，ECharts calendar）
  - Focus Score 仪表盘（时长分 × 0.6 + 稳定性分 × 0.4）
  - 专注时间分布（按小时，ECharts line）
  - 连胜徽章（当前连胜、最长连胜、今日打卡状态）
  - 好友状态墙（关注的人的在线状态）
  - 好友排行榜（周榜/月榜，前 20 名）
  - 房间内排行榜（今日专注，前 10 名）
  - 用户设置（每日目标、连胜最低要求）
- **新增表**：focus_hourly_records、focus_sessions、user_follows、user_settings
- **新增 API**：/dashboard/*、/follow/*、/leaderboard/*、/settings
- **前端数据采集**：切屏统计、按小时上报、离开房间时上报会话数据
- **前端入口**：大厅用户名下拉菜单 → "专注数据"

### Changed
- PROJECT_STATE.md 更新：dashboard 模块标记为已完成

---

## [Unreleased] — 2026-05-31

### Added
- **focus 计时模块**：专注记录持久化到数据库（FocusRecord 表）
- **focus API**：`POST /focus/report`（HTTP 上报）、`GET /focus/me`（个人专注总览）
- **WebSocket report_time**：退出房间时通过 WebSocket 上报专注时长
- **sendBeacon**：关闭页面时使用 sendBeacon 确保数据不丢失
- **SMTP 已配置**：QQ 邮箱验证码正式发送到邮箱

### Changed
- PROJECT_STATE.md 更新：focus 模块和 SMTP 标记为已完成

---

## [Unreleased] — 2026-05-28

### Added
- **rooms 高级功能**：踢人、删除房间、我的房间列表（含在线人数）
- **WebSocket 修复**：新用户连接时发送 `room_state` 同步现有成员列表
- **前端重设计**：暖调书房主题（Cream + Indigo + Sage Green 配色系统）
- **成员状态持久化**：WebSocket 断线保留 RoomMember 记录（标记 offline），支持重连
- **GET /rooms/{id}**：单房间查询端点
- **项目文档**：docs/ 文件夹，包含需求、架构、设计规范、API 协议、开发指南

### Fixed
- **SQLAlchemy DetachedInstanceError**：`verify_email()` 和 `login()` 中 ORM 属性在 session 外访问
- **WebSocket 403**：`create_room` 中 `session.add(member)` 后未显式 `flush()`，导致成员记录未持久化
- **聊天/状态不可见**：新用户连入后缺少 `room_state` 初始同步
- **邀请码输入框 CSS**：移除 `text-transform: uppercase`

### Changed
- WebSocket `finally` 块不再调用 `room_service.leave_room()`（保留成员记录）
- `join_room` 允许已是成员时直接返回房间信息（重连场景）
- 状态变更同步写入数据库（`update_member_status`）

---

## [0.1.0-alpha] — 2026-05-27

### Added
- 项目初始化：bedrock-py + FastAPI + SQLite + Vue 3 + Vite
- rooms 模块：Room/RoomMember 模型、CRUD、WebSocket 连接管理
- users 模块：注册/验证/登录、JWT 认证、QQ 邮箱验证码
- Vue 3 前端：登录/大厅/房间、Page Visibility 切屏检测、计时器、聊天
