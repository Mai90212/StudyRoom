# 变更日志

> 格式参考：Keep a Changelog
> 版本：0.1.0（MVP 开发中）

---

## [Unreleased] — 2026-07-04

### Changed (前端从 Vue 3 完全重写为 React + TSX)

- **技术栈切换**：Vue 3 → React 18 + TypeScript (非严格模式)，保留现有 FastAPI 后端与 OKLCH 暖调书房主题
- **UI 组件库**：shadcn-vue → shadcn/ui (React 版) + Radix UI primitives，14 个原子组件手写（button/card/input/label/tabs/dialog/alert-dialog/dropdown-menu/badge/avatar/scroll-area/separator/tooltip/sonner/skeleton）
- **状态管理**：Pinia 风格 → Zustand stores (`authStore` / `uiStore`) + TanStack Query v5 hooks（useRooms/useDashboard/useFollow/useLeaderboard/useSettings/useFocus/useCurrentUser）
- **HTTP 层**：fetch 封装 → Axios 实例 (`lib/api.ts`)，JWT 请求拦截器 + 401 自动清 token 跳登录，`buildWsUrl()` 辅助函数
- **表单**：原生 v-model → React Hook Form + Zod schema 校验（login/register 表单）
- **路由**：Vue Router → React Router v6，`AuthGuard` 基于 `isAuthenticated` 守卫，路由 `/room/:roomId` 替代 query string
- **动画**：Vue `<Transition>` → framer-motion `<AnimatePresence>`（摸鱼遮罩/退出确认/删除确认/踢人确认/复制提示）
- **图表**：手动 ECharts init/dispose → `echarts-for-react` 组件（Heatmap/DistributionChart/ScoreGauge），自动生命周期管理
- **页面结构**：`src/views/` → `src/pages/` + `src/components/dashboard/` 7 个子组件
- **API 模块化**：`src/api/` 按模块拆分（auth/rooms/focus/dashboard/follow/leaderboard/settings），`src/types/api.ts` 集中类型定义
- **滑块指示器**：Login/Dashboard/Leaderboard 三处 Tabs 滑动指示器用 inline `style` + `transform` 实现（保持 Vue 版视觉效果）

### Added (React 重构新增)
- **Tailwind 配置**：OKLCH 颜色 token 通过 `oklch(var(--token))` 桥接，CSS 变量存储原始通道值（注释说明防双重包装 bug）
- **代码分割**：Vite `manualChunks` 拆分 echarts/radix/react-vendor 三个 vendor chunk
- **`.gitignore` / `eslint.config.js` / `tsconfig.json` / `vite.config.ts`**：React-TS 标准脚手架配置
- **dev proxy**：`/api` → `localhost:8000`，`/ws` → `ws://localhost:8000`（WebSocket 代理）

### Fixed
- **房间排行榜 API 类型**：后端返回 `{items, period}` 而非裸数组，`roomsApi.leaderboard` 类型修正为 `LeaderboardResponse`，`fetchLeaderboard` 提取 `.items`
- **OKLCH 双重包装 bug**：Tailwind config `oklch(var(--border))` + CSS `oklch(0.480 ...)` 冲突，CSS 变量改为存储原始通道值 `0.480 0.103 280`

---

## [Unreleased] — 2026-06-10

### Added (Wave 0-5: 前端 shadcn-vue 重构)
- **shadcn-vue 集成**：Tailwind v4 + Reka UI + 15 个原子组件（button/card/input/label/tabs/dialog/alert-dialog/dropdown-menu/badge/avatar/separator/scroll-area/sonner→自写/tooltip/skeleton）
- **OKLCH design tokens**：78 个 OKLCH 颜色值，shadcn-vue 标准 token + 应用专属 sage/amber/danger 语义色
- **暖奶油 + 学术靛蓝**主题保留，UI 视觉零回归（token bridge 让旧组件无缝过渡）
- **Night Library 暗色调**预留（CSS variables 就绪，未挂切换 UI）
- **lucide-vue icons**：全面替换 emoji，按页面分类列表见 [design-spec.md § 7](docs/design-spec.md#7-图标系统)
- **自写 toast 系统**：`composables/useToast.js` + `components/ui/toaster/Toaster.vue`（替代 vue-sonner，规避 Vite ESM 双实例问题），4 色调（sage/rose/indigo/amber）+ a11y region

### Changed (重构 6 个核心文件)
- **LoginView.vue** (351→220 行)：Card+Tabs+Form 重写，setTimeout 错误泄漏 → toast.error 自动 dismiss
- **LobbyView.vue** (474→240 行)：Card 卡片 + DropdownMenu + Skeleton + Badge + 自定义 stepper
- **Room.vue** (1080→700 行)：UI 全换 shadcn-vue（保持单文件，**逻辑零改动**），AlertDialog 替代 3 处 `confirm()`，nickname 从 leaderboard 反查
- **DashboardView.vue** (385→220 行)：Tabs + Dialog（设置弹窗带焦点陷阱）
- **3 个 dashboard 子组件**：StatsCards/StreakBadge/FriendStatus/Leaderboard 全部 Card 化
- **3 个 ECharts 组件**：Heatmap/DistributionChart/ScoreGauge — ECharts 调色板对齐 OKLCH（HEX 等价）

### Fixed (resize 监听 + setTimeout 泄漏)
- **3 个 ECharts 组件 resize 监听泄漏**：`window.addEventListener('resize', ...)` 现在保存 handler ref，`onBeforeUnmount` 中 removeEventListener + dispose ECharts instance
- **LobbyView setTimeout(4000) 泄漏**：错误提示改为 toast（自动 timeout 由 useToast 管理）
- **MCP server 配置错误**：项目 root + frontend 的 opencode.json 中 `shadcn@latest mcp` (React) → `shadcn-vue@latest mcp`

### Infrastructure
- **vite.config.js**：+ `@tailwindcss/vite` plugin + `@` → `./src` alias + `dedupe: ['vue', 'reka-ui']`
- **jsconfig.json**：shadcn-vue CLI 要求（非 TS Vue 项目需 jsconfig 解析 alias）
- **components.json**：shadcn-vue 配置（style: new-york, baseColor: neutral, iconLibrary: lucide）
- **依赖新增**：tailwindcss@4 + @tailwindcss/vite + tw-animate-css (dev), clsx + tailwind-merge + class-variance-authority + @lucide/vue + reka-ui + @vueuse/core (runtime)
- **依赖删除**：shadcn@4.10 (React CLI 误装), vue-sonner (双实例问题), lucide-vue-next (统一到 @lucide/vue)

### Verification
- 5 个 wave commit (M1-M5) + Wave 0 P0 修复 (cf1a285)，git history clean
- Playwright @ vite preview :4173 端到端验证：注册→登录→创建房间→Room WebSocket+timer+visibilitychange+overlay+chat→dashboard tabs 全部通过
- `npm run build` exit 0，CSS bundle 49→74 KB（shadcn 样式注入），JS bundle 706→908 KB（shadcn-vue + reka-ui + lucide tree-shake）

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
