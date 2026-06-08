# 前端设计规范

> 设计主题：**暖调书房**（Warm Study）
> 更新：2026-05-28

---

## 1. 设计理念

柔和、温暖、专注的学术风格。灵感来自深夜图书馆的暖光、纸质感、木色调。避免冰冷科技感，营造让人平静专注的氛围。

- **核心词**：温暖 / 学者气 / 克制 / 质感
- **差异化**：淡奶油基底 + 深靛蓝学术点缀（非暗黑模式，非荧光色）
- **字体策略**：衬线标题（学术感）+ 无衬线正文（可读性）

---

## 2. 色彩系统（CSS 变量）

```css
:root {
  /* 背景 */
  --bg: #faf7f2;              /* 暖奶油色页面背景 */
  --surface: #ffffff;          /* 白色卡片 */
  --surface-hover: #f5f0e7;    /* 卡片悬停 */

  /* 边框 */
  --border: #e8e2d6;           /* 暖灰边框 */
  --border-light: #f0ebe0;     /* 浅边框 */

  /* 文字 */
  --text: #3d3529;             /* 深棕主文字 */
  --text-secondary: #8c8274;   /* 暖灰副文字 */
  --text-muted: #bfb8aa;       /* 浅灰辅助文字 */

  /* 主题色 — 学术靛蓝 */
  --accent: #5b5d9c;           /* 主色调 */
  --accent-light: #e8e7f5;     /* 浅色背景 */
  --accent-hover: #4a4c84;     /* 悬停/按下 */

  /* 语义色 */
  --focus: #6a9b6f;            /* 专注中 — 鼠尾草绿 */
  --focus-soft: #e8f0e5;       /* 专注背景 */
  --focus-glow: 0 0 0 3px rgba(106, 155, 111, 0.18);
  --away: #d4956b;             /* 摸鱼中 — 暖琥珀 */
  --away-soft: #faf0e7;        /* 摸鱼背景 */
  --danger: #b57070;           /* 危险操作 — 柔玫瑰 */
  --danger-hover: #9e5e5e;
  --danger-soft: #f9eeee;

  /* 阴影 */
  --shadow-xs: 0 1px 2px rgba(61, 53, 41, 0.04);
  --shadow-sm: 0 1px 3px rgba(61, 53, 41, 0.06), 0 1px 2px rgba(61, 53, 41, 0.04);
  --shadow-md: 0 4px 16px rgba(61, 53, 41, 0.07);
  --shadow-lg: 0 12px 40px rgba(61, 53, 41, 0.10);

  /* 圆角 */
  --radius: 14px;              /* 卡片 */
  --radius-sm: 10px;           /* 输入框/按钮 */
  --radius-xs: 6px;            /* 小元素 */
}
```

---

## 3. 排版

```css
:root {
  --font-display: "Noto Serif SC", "Songti SC", "STSong", serif;
  --font-body: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: "SF Mono", "JetBrains Code", "Cascadia Code", monospace;
}
```

| 用途 | 字体 | 大小 | 字重 |
|------|------|------|------|
| 页面标题 | --font-display | 24-26px | 700 |
| 区域标题 | --font-display | 15-20px | 600-700 |
| 正文 | --font-body | 14-15px | 400-500 |
| 计时器数字 | --font-mono | 22px | 700 |
| 邀请码 | --font-mono | 13-20px | 600 |
| 辅助文字 | --font-body | 12-13px | 400-500 |

**加载方式**：Google Fonts（`fonts.googleapis.com`），preconnect 优化

---

## 4. 组件规范

### 4.1 按钮

| 类型 | 背景 | 文字 | 圆角 | 用途 |
|------|------|------|------|------|
| btn-accent | --accent | #fff | --radius-sm | 主操作 |
| 危险按钮 | transparent → --danger-soft | --text-muted → --danger | --radius-xs | 删除/退出 |
| 图标按钮 | transparent | --text-muted | 50% | 发送/关闭 |

**交互**：
- hover: 颜色加深 + 阴影
- active: scale(0.97-0.98)
- disabled: opacity 0.4-0.6 + cursor not-allowed
- 加载中: spinner 动画

### 4.2 输入框

- 边框：1.5px solid --border
- 聚焦：border-color → --accent + box-shadow 光圈
- 圆角：--radius-sm（普通）/ 24px（聊天框）
- 占位符：--text-muted

### 4.3 卡片

- 背景：--surface
- 圆角：--radius
- 阴影：--shadow-sm → hover --shadow-md
- 边框：1px solid --border-light

### 4.4 状态指示器

| 状态 | 颜色 | 效果 |
|------|------|------|
| 专注中 | --focus | breathe 呼吸动画（2s） |
| 摸鱼中 | --away | 静态发光 |
| 离线 | --text-muted | 无发光 |

---

## 5. 动画规范

| 动画 | 属性 | 时长 | 缓动 | 用途 |
|------|------|------|------|------|
| fadeIn | opacity + translateY(8px) | 0.3s | ease | 元素出现 |
| slideUp | opacity + translateY(16px) | 0.4s | ease | 卡片/弹窗 |
| breathe | box-shadow 扩散 | 2s ∞ | ease-in-out | 专注状态呼吸 |
| spin | rotate(360deg) | 0.6s ∞ | linear | 加载 spinner |
| 成员进出 | fadeIn | 0.25s/0.2s | ease | transition-group |

---

## 6. 布局

- 最大宽度：780-820px（大厅、登录）
- 房间：全屏 100vh，flex 布局
- 成员面板：固定 280px 宽
- 聊天面板：flex: 1 填充剩余
- 移动端（< 640px）：垂直堆叠

---

## 7. 图标

优先使用 emoji（📚✨🔑⏳💬🌙）和内联 SVG（返回箭头、复制、发送、删除）。不引入图标库。
