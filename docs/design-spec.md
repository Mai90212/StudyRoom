# 前端设计规范

> 设计主题：**暖调书房**（Warm Study）
> 实现：shadcn-vue (Reka UI) + Tailwind v4 + OKLCH tokens
> 更新：2026-06-11（v2.1 — 全暖调色系统，移除冷靛蓝）

---

## 1. 设计理念

柔和、温暖、专注的学术风格。灵感来自深夜图书馆的暖光、纸质感、木色调。避免冰冷科技感，营造让人平静专注的氛围。

- **核心词**：温暖 / 学者气 / 克制 / 质感
- **差异化**：淡奶油基底 + **焦糖棕**学术点缀 + **苔藓绿**（专注）+ **暖琥珀**（摸鱼）
- **字体策略**：衬线标题（学术感）+ 无衬线正文（可读性）+ 等宽数字（计时器/邀请码）
- **实现栈**：shadcn-vue (Reka UI 无头组件) + Tailwind v4 (utility-first) + OKLCH 颜色空间

### 1.1 色相约束（v2.1 关键决策）

所有颜色必须落在 **hue 30°–145°** 暖色弧线内。**严禁使用 hue 200°–320°（冷蓝→紫蓝→紫红）**。

| 色相区间 | 用途 | 示例 token |
|---------|------|-----------|
| 30°–55°  | 朱砂红、焦糖棕、琥珀 | `--destructive`、`--primary`、`--away` |
| 60°–90°  | 暖奶油、米色、卡其 | `--background`、`--secondary`、`--muted` |
| 130°–145°| 苔藓绿、橄榄、墨绿 | `--focus` |

> v2 → v2.1 变更原因：旧 `--primary: oklch(0.480 0.103 280)`（学术靛蓝, hue 280）与暖奶油底（hue 80）色环对角，视觉冲撞，破坏"书房"沉浸感。v2.1 全部替换为同温区配色。

---

## 2. 色彩系统（OKLCH tokens）

> v2 升级到 OKLCH：屏幕一致性更高、感知均匀，配合 Tailwind v4 `@theme inline` 直接使用。
> 所有 design token 定义在 [`frontend/src/assets/index.css`](../frontend/src/assets/index.css)。

### 2.1 shadcn-vue 标准 tokens（light）

```css
:root {
  /* 表面 */
  --background:        oklch(0.972 0.013 80);   /* 暖奶油页面背景 */
  --foreground:        oklch(0.295 0.018 60);   /* 深棕主文字 */
  --card:              oklch(1 0 0);            /* 白色卡片 */
  --card-foreground:   oklch(0.295 0.018 60);
  --popover:           oklch(1 0 0);
  --popover-foreground: oklch(0.295 0.018 60);

  /* 主题色 — 焦糖棕（warm caramel, hue 55） */
  --primary:           oklch(0.475 0.095 55);
  --primary-foreground: oklch(0.985 0.008 80);

  /* 次级 */
  --secondary:         oklch(0.945 0.018 70);
  --secondary-foreground: oklch(0.295 0.018 60);

  --muted:             oklch(0.945 0.014 75);
  --muted-foreground:  oklch(0.555 0.025 65);

  --accent:            oklch(0.930 0.032 60);  /* 浅焦糖 hover */
  --accent-foreground: oklch(0.350 0.060 50);

  /* 危险 — 朱砂红（vermillion, hue 28，暖系不带冷玫瑰感） */
  --destructive:       oklch(0.560 0.140 28);
  --destructive-foreground: oklch(0.985 0.008 80);

  /* 边界 */
  --border:            oklch(0.895 0.022 70);
  --input:             oklch(0.895 0.022 70);
  --ring:              oklch(0.475 0.095 55 / 0.35);

  --radius:            0.875rem;  /* 14px */
}
```

### 2.2 应用专属语义色（状态指示）

```css
:root {
  --focus:      oklch(0.580 0.085 135);  /* 专注中 — 苔藓绿（hue 135 偏黄） */
  --focus-soft: oklch(0.945 0.032 135);
  --focus-glow: oklch(0.580 0.085 135 / 0.28);

  --away:       oklch(0.700 0.115 60);   /* 摸鱼中 — 暖琥珀 */
  --away-soft:  oklch(0.955 0.030 60);
}
```

### 2.2.1 ECharts HEX 等价（v2.1）

ECharts 不支持 OKLCH，使用 HEX 等价值（在 sRGB gamut 内匹配）：

| Token | OKLCH | HEX |
|-------|-------|-----|
| primary | 0.475 0.095 55 | `#844c21` |
| focus | 0.580 0.085 135 | `#648652` |
| focus mid | 0.700 0.075 135 | `#8aa97a` |
| focus light | 0.870 0.060 135 | `#c4deb6` |
| focus deep | 0.430 0.075 135 | `#3d592e` |
| away | 0.700 0.115 60 | `#d28c50` |
| heatmap empty | (neutral cream) | `#f0ebe0` |

### 2.3 Night Library 暗色调（预留）

`.dark` class 已就绪，token 已定义，目前不挂切换按钮（v2.1 后再上）。

```css
.dark {
  --background:   oklch(0.185 0.014 55);  /* 深胡桃木 */
  --foreground:   oklch(0.925 0.018 75);  /* 柔奶油 */
  --card:         oklch(0.235 0.016 55);
  --primary:      oklch(0.700 0.115 60); /* 亮焦糖（夜间提亮） */
  /* ... 完整定义见 index.css */
}
```

### 2.4 HEX 对照（用于 ECharts canvas 等不支持 OKLCH 的场景）

| Token | OKLCH | HEX 等价 |
|-------|-------|---------|
| `--background` | `oklch(0.972 0.013 80)` | `#faf7f2` |
| `--foreground` | `oklch(0.295 0.018 60)` | `#3d3529` |
| `--primary` | `oklch(0.475 0.095 55)` | `#844c21` |
| `--focus` | `oklch(0.580 0.085 135)` | `#648652` |
| `--away` | `oklch(0.700 0.115 60)` | `#d28c50` |
| `--destructive` | `oklch(0.560 0.140 28)` | `#a44a1f` |
| `--border` | `oklch(0.895 0.022 70)` | `#e0d4c0` |
| `--muted-foreground` | `oklch(0.555 0.025 65)` | `#857058` |

---

## 3. 排版

```css
@theme inline {
  --font-sans:  "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --font-serif: "Noto Serif SC", "Songti SC", "STSong", serif;
  --font-mono:  "SF Mono", "JetBrains Mono", "Cascadia Code", monospace;
}
```

Tailwind utility 直接调用：`class="font-serif"` / `font-sans` / `font-mono`。

| 用途 | Tailwind class | 大小 | 字重 |
|------|---------------|------|------|
| 页面标题 | `font-serif text-2xl font-bold` | 24px | 700 |
| 区域标题 (CardTitle) | `font-serif text-base font-semibold` | 16px | 600 |
| 正文 | (默认 font-sans) | 14-15px | 400-500 |
| 计时器数字 | `font-mono text-2xl font-bold tabular-nums` | 22px | 700 |
| 邀请码 | `font-mono tracking-[0.15em]` | 13-20px | 500-600 |
| 辅助文字 | `text-xs text-muted-foreground` | 12px | 400-500 |

**加载方式**：Google Fonts（`fonts.googleapis.com`），preconnect 优化。

---

## 4. 组件系统（shadcn-vue）

> 全部组件源码在 `frontend/src/components/ui/<name>/`，可直接修改。

### 4.1 安装的 15 个原子组件

| 组件 | 用途 | 文件 |
|------|------|------|
| `Button` | 按钮 — variant: default/secondary/outline/ghost/destructive；size: default/sm/lg/icon | button/Button.vue |
| `Card` (+ Header/Title/Description/Content/Footer/Action) | 卡片容器 | card/*.vue |
| `Input` | 输入框 | input/Input.vue |
| `Label` | 表单标签 | label/Label.vue |
| `Tabs` (+ List/Trigger/Content) | 标签页切换 | tabs/*.vue |
| `Dialog` (+ Content/Header/Title/Description/Footer/Trigger) | 模态弹窗（带焦点陷阱） | dialog/*.vue |
| `AlertDialog` (+ Action/Cancel/...) | 确认对话框（替代 native confirm） | alert-dialog/*.vue |
| `DropdownMenu` (+ Trigger/Content/Item/Label/Separator) | 下拉菜单 | dropdown-menu/*.vue |
| `Badge` | 标签徽章 — variant: default/secondary/destructive/outline | badge/Badge.vue |
| `Avatar` (+ Image/Fallback) | 头像（带 fallback 文字） | avatar/*.vue |
| `Separator` | 分隔线 — orientation: horizontal/vertical | separator/Separator.vue |
| `ScrollArea` (+ ScrollBar) | 自定义滚动容器 | scroll-area/*.vue |
| `Tooltip` (+ Provider/Trigger/Content) | 工具提示（**未使用** — 需要全局 Provider） | tooltip/*.vue |
| `Skeleton` | 加载占位 | skeleton/Skeleton.vue |
| `Toaster` (自写) | 全局通知 | components/ui/toaster + composables/useToast.js |

### 4.2 Toaster 系统（自实现，非 vue-sonner）

> 为何不用 vue-sonner？Vite dev mode 下 `vue-sonner` 出现 ESM 双 module 实例问题（toast publisher 和 Toaster subscriber 拿到不同 Observer 实例）。我们自写 80 行的 reactive toast store 替代。

```js
// composables/useToast.js
import { toast } from "@/components/ui/toaster";

toast.success("操作成功");
toast.error("操作失败");
toast.info("提示");
toast.warning("警告");
```

- 全局单一 store：`reactive({ toasts: [] })` 单例
- 自动消失：默认 4000ms，自定义 `{ duration: N }`
- 渲染：`<Teleport to="body">` + `<TransitionGroup>` + role="region" aria-label="通知"
- 4 色调（sage/vermillion/caramel/amber）匹配 OKLCH design tokens，全暖调

### 4.3 状态指示器（自定义）

| 状态 | 颜色 (Tailwind class) | 效果 |
|------|----------------------|------|
| 专注中 | `bg-[oklch(0.580_0.085_135)] animate-pulse` | breathe 呼吸 |
| 摸鱼中 | `bg-[oklch(0.700_0.115_60)] shadow-[0_0_6px_oklch(0.700_0.115_60/0.4)]` | 静态发光 |
| 离线 | `bg-muted-foreground/40` | 无发光 |

---

## 5. 动画

| 动画 | 来源 | 用途 |
|------|------|------|
| `animate-in fade-in` | tw-animate-css | 元素出现 |
| `slide-in-from-bottom-4` / `slide-in-from-top-2` | tw-animate-css | 卡片/弹窗入场 |
| `animate-pulse` | Tailwind | 专注状态呼吸 / 在线指示 |
| `animate-spin` | Tailwind | 加载 Loader2 |
| TransitionGroup with `transition duration-{200,250}` | Vue | 列表项进出 |
| Toast custom keyframe | Toaster.vue | 顶部弹出 (translateY + scale) |

---

## 6. 布局

- **最大宽度**：`max-w-md`(登录) / `max-w-4xl`(dashboard) / `max-w-5xl`(lobby)
- **房间**：`h-screen flex flex-col` 全屏布局
- **成员面板**：`w-[300px] shrink-0`
- **聊天面板**：`flex-1`
- **响应式**：`md:grid-cols-2` / `md:grid-cols-3` 在中等屏自动多列

---

## 7. 图标系统

> 全面切换到 [lucide-vue](https://lucide.dev/icons/) (`@lucide/vue@1.17`)。零 emoji。

```js
import { BookOpenText, Mail, Lock, User, KeyRound, Loader2 } from "@lucide/vue";
```

### 按页面分类的图标清单

**LoginView**: `BookOpenText` (logo) / `Mail` / `Lock` / `User` / `KeyRound` / `Loader2`

**LobbyView**: `BookOpenText` / `Bookmark` / `Sparkles` (create) / `KeyRound` (join) / `Minus` / `Plus` / `Loader2` / `ChevronDown` / `BarChart3` (dashboard) / `LogOut`

**Room.vue**: `ArrowLeft` (leave) / `Trash2` (delete room) / `Copy` (invite) / `Users` / `Crown` (owner badge) / `UserX` (kick) / `Moon` (empty) / `Trophy` (leaderboard) / `TrendingUp` / `MessageCircle` / `Send` / `Hourglass` (away overlay)

**DashboardView**: `ArrowLeft` / `Settings`

**Dashboard 子组件**:
- StatsCards: `CalendarDays` / `BarChart3` / `TrendingUp`
- StreakBadge: `Flame` / `CheckCircle2` / `Hourglass`
- Heatmap: `Activity`
- DistributionChart: `LineChart`
- ScoreGauge: `Gauge`
- FriendStatus: `Users` / `UsersRound` / `RefreshCw` / `X`
- Leaderboard: `Trophy`

**Toaster**: `CircleCheck` / `OctagonX` / `Info` / `TriangleAlert` / `X`

---

## 8. 主题切换（Dark Mode 预留）

`.dark` class 加到 `<html>` 即可激活。CSS variables 自动 cascade 到所有 shadcn-vue 组件。

**目前未实现切换按钮**——所有 OKLCH dark token 已就绪，等 v2.1 加 ThemeToggle 组件（基于 `useColorMode` from `@vueuse/core`）。

---

## 9. 无障碍（a11y）

由 Reka UI 内置提供（shadcn-vue 底层）：

- **键盘导航**：所有交互组件（Button/Tabs/Dialog/AlertDialog/DropdownMenu）支持 Tab + Enter + Esc 操作
- **ARIA**：自动生成 `role` / `aria-selected` / `aria-haspopup` / `aria-expanded` 等属性
- **焦点管理**：Dialog/AlertDialog 自动 trap focus + Esc close + 还原焦点
- **屏幕阅读器**：Toast region 带 `role="region" aria-label="通知"`，每条 toast 带 `role="status"`
- **对比度**：OKLCH 调色保证 foreground/background 对比度 WCAG AA 级

测试方式：用 keyboard-only 走通所有流程（注册→登录→创建房间→聊天→退出）。

---

## 10. 工程实现速查

| 想做什么 | 用什么 |
|---------|--------|
| 加新页面 | 在 `src/views/` 加 .vue，router 注册 |
| 加新 shadcn-vue 组件 | `npx shadcn-vue@latest add <name>` |
| 全局 toast | `import { toast } from "@/components/ui/toaster"` |
| 类名合并 | `import { cn } from "@/lib/utils"` |
| 字体衬线 | `class="font-serif"` |
| 状态色 | `bg-[oklch(0.624_0.090_145)]` 或 CSS var `var(--focus)` |
| 间距 | Tailwind utility (`gap-4` / `p-6` / `mt-2`) |
| 阴影 | `shadow-sm` / `shadow-md` / `shadow-lg` |
| 圆角 | `rounded-md` / `rounded-lg` / `rounded-xl` / `rounded-full` |
