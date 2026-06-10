<template>
  <div class="grid gap-4 md:grid-cols-3">
    <Card class="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent class="flex items-start gap-3.5 pt-6">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <CalendarDays class="h-5 w-5" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <span class="font-mono text-2xl font-bold tabular-nums">
            {{ formatMinutes(stats.today_minutes) }}
          </span>
          <span class="text-sm font-medium text-muted-foreground">今日专注</span>
          <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-[oklch(0.624_0.090_145)] transition-all duration-500"
              :style="{ width: Math.min(100, stats.today_progress * 100) + '%' }"
            ></div>
          </div>
          <span class="text-xs text-muted-foreground">目标 {{ stats.today_goal }} 分钟</span>
        </div>
      </CardContent>
    </Card>

    <Card class="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent class="flex items-start gap-3.5 pt-6">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <BarChart3 class="h-5 w-5" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <span class="font-mono text-2xl font-bold tabular-nums">
            {{ formatMinutes(stats.week_minutes) }}
          </span>
          <span class="text-sm font-medium text-muted-foreground">本周专注</span>
        </div>
      </CardContent>
    </Card>

    <Card class="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent class="flex items-start gap-3.5 pt-6">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <TrendingUp class="h-5 w-5" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <span class="font-mono text-2xl font-bold tabular-nums">
            {{ formatMinutes(stats.month_minutes) }}
          </span>
          <span class="text-sm font-medium text-muted-foreground">本月专注</span>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { CalendarDays, BarChart3, TrendingUp } from "@lucide/vue";
import { Card, CardContent } from "@/components/ui/card";

defineProps({
  stats: {
    type: Object,
    default: () => ({
      today_minutes: 0,
      week_minutes: 0,
      month_minutes: 0,
      today_goal: 120,
      today_progress: 0,
    }),
  },
});

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
</script>
