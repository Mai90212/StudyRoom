<template>
  <router-view />
</template>

<style>
:root {
  --bg: #faf7f2;
  --surface: #ffffff;
  --surface-hover: #f5f0e7;
  --border: #e8e2d6;
  --border-light: #f0ebe0;
  --text: #3d3529;
  --text-secondary: #8c8274;
  --text-muted: #bfb8aa;
  --accent: #5b5d9c;
  --accent-light: #e8e7f5;
  --accent-hover: #4a4c84;
  --focus: #6a9b6f;
  --focus-soft: #e8f0e5;
  --focus-glow: 0 0 0 3px rgba(106, 155, 111, 0.18);
  --away: #d4956b;
  --away-soft: #faf0e7;
  --danger: #b57070;
  --danger-hover: #9e5e5e;
  --danger-soft: #f9eeee;
  --shadow-xs: 0 1px 2px rgba(61, 53, 41, 0.04);
  --shadow-sm: 0 1px 3px rgba(61, 53, 41, 0.06), 0 1px 2px rgba(61, 53, 41, 0.04);
  --shadow-md: 0 4px 16px rgba(61, 53, 41, 0.07), 0 1px 3px rgba(61, 53, 41, 0.04);
  --shadow-lg: 0 12px 40px rgba(61, 53, 41, 0.10), 0 4px 12px rgba(61, 53, 41, 0.05);
  --radius: 14px;
  --radius-sm: 10px;
  --radius-xs: 6px;
  --font-display: "Noto Serif SC", "Songti SC", "STSong", serif;
  --font-body: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", system-ui, -apple-system, sans-serif;
  --font-mono: "SF Mono", "JetBrains Mono", "Cascadia Code", monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; -webkit-font-smoothing: antialiased; }

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.6;
}

input, button, textarea {
  font-family: inherit;
  font-size: inherit;
}

input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(91, 93, 156, 0.1);
}
input::placeholder { color: var(--text-muted); }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(106, 155, 111, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(106, 155, 111, 0); }
}

.fade-enter-active { animation: fadeIn 0.3s ease; }
.fade-leave-active { animation: fadeIn 0.2s ease reverse; }
</style>
