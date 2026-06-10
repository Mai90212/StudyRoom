<script setup>
import { CircleCheck, OctagonX, Info, TriangleAlert, X } from "@lucide/vue";
import { useToast } from "@/composables/useToast.js";
import { cn } from "@/lib/utils";

const { toasts, toast } = useToast();

const iconMap = {
  success: CircleCheck,
  error: OctagonX,
  info: Info,
  warning: TriangleAlert,
};

const toneClasses = {
  success: "border-[oklch(0.624_0.090_145_/_0.35)] bg-[oklch(0.945_0.030_145)] text-[oklch(0.295_0.018_60)]",
  error: "border-[oklch(0.598_0.106_25_/_0.40)] bg-[oklch(0.945_0.028_25)] text-[oklch(0.295_0.018_60)]",
  info: "border-[oklch(0.480_0.103_280_/_0.30)] bg-[oklch(0.945_0.025_280)] text-[oklch(0.295_0.018_60)]",
  warning: "border-[oklch(0.710_0.110_55_/_0.40)] bg-[oklch(0.955_0.024_55)] text-[oklch(0.295_0.018_60)]",
};

const iconColor = {
  success: "text-[oklch(0.624_0.090_145)]",
  error: "text-[oklch(0.598_0.106_25)]",
  info: "text-[oklch(0.480_0.103_280)]",
  warning: "text-[oklch(0.710_0.110_55)]",
};
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed left-1/2 top-6 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      role="region"
      aria-label="通知"
    >
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="cn(
            'pointer-events-auto flex min-w-[280px] max-w-[420px] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
            toneClasses[t.type]
          )"
          role="status"
        >
          <component
            :is="iconMap[t.type]"
            :class="cn('mt-0.5 h-4 w-4 shrink-0', iconColor[t.type])"
          />
          <span class="flex-1 text-sm leading-relaxed">{{ t.message }}</span>
          <button
            type="button"
            class="shrink-0 rounded-sm opacity-50 transition hover:opacity-100"
            aria-label="关闭"
            @click="toast.dismiss(t.id)"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.toast-leave-active {
  position: absolute;
  width: 100%;
}
</style>
