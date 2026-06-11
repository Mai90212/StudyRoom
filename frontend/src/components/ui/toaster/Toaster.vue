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
  success: "border-[oklch(0.580_0.085_135_/_0.35)] bg-[oklch(0.945_0.032_135)] text-[oklch(0.295_0.018_60)]",
  error: "border-[oklch(0.560_0.140_28_/_0.40)] bg-[oklch(0.952_0.030_28)] text-[oklch(0.295_0.018_60)]",
  info: "border-[oklch(0.475_0.095_55_/_0.32)] bg-[oklch(0.948_0.028_55)] text-[oklch(0.295_0.018_60)]",
  warning: "border-[oklch(0.700_0.115_60_/_0.40)] bg-[oklch(0.955_0.030_60)] text-[oklch(0.295_0.018_60)]",
};

const iconColor = {
  success: "text-[oklch(0.580_0.085_135)]",
  error: "text-[oklch(0.560_0.140_28)]",
  info: "text-[oklch(0.475_0.095_55)]",
  warning: "text-[oklch(0.700_0.115_60)]",
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
