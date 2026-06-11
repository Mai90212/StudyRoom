<template>
  <Card>
    <CardContent class="flex items-center gap-5 pt-6">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.955_0.030_60)] text-[oklch(0.700_0.115_60)]">
        <Flame class="h-7 w-7" />
      </div>
      <div class="flex flex-col items-center gap-1">
        <div class="flex items-baseline gap-1">
          <span class="font-mono text-4xl font-bold tabular-nums">{{ streak.current_streak }}</span>
          <span class="text-sm text-muted-foreground">天</span>
        </div>
        <span class="text-xs text-muted-foreground">当前连胜</span>
      </div>
      <Separator orientation="vertical" class="mx-1 h-12" />
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted-foreground">最长连胜:</span>
          <span class="font-mono text-sm font-semibold">{{ streak.longest_streak }} 天</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted-foreground">今日打卡:</span>
          <span
            v-if="streak.today_done"
            class="flex items-center gap-1 text-sm font-medium text-[oklch(0.580_0.085_135)]"
          >
            <CheckCircle2 class="h-3.5 w-3.5" />
            已完成
          </span>
          <span
            v-else
            class="flex items-center gap-1 text-sm font-medium text-[oklch(0.700_0.115_60)]"
          >
            <Hourglass class="h-3.5 w-3.5" />
            进行中
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Flame, CheckCircle2, Hourglass } from "@lucide/vue";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

defineProps({
  streak: {
    type: Object,
    default: () => ({
      current_streak: 0,
      longest_streak: 0,
      today_done: false,
    }),
  },
});
</script>
