<template>
  <router-view />
  <Toaster />
</template>

<script setup>
import { Toaster } from "@/components/ui/toaster";
</script>

<style>
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 0 0 var(--focus-glow); }
  50%      { box-shadow: 0 0 0 8px oklch(0.620 0.100 145 / 0); }
}
</style>
