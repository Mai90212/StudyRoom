<template>
  <router-view />
  <Toaster />
</template>

<script setup>
import { Toaster } from "@/components/ui/toaster";
</script>

<style>
/* 最小化全局 reset — design tokens 全部已迁移到 src/assets/index.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

/* 应用专属 breathe 动画（专注状态呼吸效果）— tw-animate-css 不提供，自定义 */
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.624 0.090 145 / 0.40); }
  50%      { box-shadow: 0 0 0 8px oklch(0.624 0.090 145 / 0); }
}
</style>
