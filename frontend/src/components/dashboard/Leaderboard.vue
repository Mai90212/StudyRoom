<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle class="flex items-center gap-2 font-serif text-base">
        <Trophy class="h-4 w-4 text-primary" />
        专注排行榜
      </CardTitle>
      <Tabs :model-value="period" @update:model-value="(v) => emit('change-period', v)">
        <TabsList class="h-8 relative">
          <div
            class="absolute inset-y-0 left-0 bg-background shadow-sm rounded-md transition-[width,transform] duration-300 ease-in-out pointer-events-none"
            :style="period === 'weekly' ? { width: '50%', transform: 'translateX(0%)' } : { width: '50%', transform: 'translateX(100%)' }"
          />
          <TabsTrigger value="weekly" class="text-xs relative z-10">周榜</TabsTrigger>
          <TabsTrigger value="monthly" class="text-xs relative z-10">月榜</TabsTrigger>
        </TabsList>
      </Tabs>
    </CardHeader>
    <CardContent>
      <div
        v-if="items.length === 0"
        class="flex flex-col items-center gap-2 px-5 py-10 text-muted-foreground"
      >
        <Trophy class="h-8 w-8 opacity-40" />
        <span class="text-sm">暂无排行数据</span>
        <span class="text-xs">关注好友后可以看到排行</span>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="(item, index) in items"
          :key="item.user_id"
          :class="cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40',
            item.user_id === currentUserId && 'bg-secondary'
          )"
        >
          <div
            :class="cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              rankClass(index)
            )"
          >
            {{ index + 1 }}
          </div>
          <span class="flex-1 truncate text-sm font-medium">
            {{ item.nickname || "用户 #" + item.user_id }}
          </span>
          <span class="font-mono text-sm font-semibold text-[oklch(0.580_0.085_135)]">
            {{ formatMinutes(item.total_minutes) }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed } from "vue";
import { Trophy } from "@lucide/vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils.js";

defineProps({
  items: { type: Array, default: () => [] },
  period: { type: String, default: "weekly" },
});

const emit = defineEmits(["change-period"]);

// JWT 本地解析 user_id（用于高亮自己的行）—— sub.exp 标准 JWT payload
const currentUserId = computed(() => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id;
  } catch {
    return null;
  }
});

function rankClass(index) {
  if (index === 0) return "bg-[oklch(0.700_0.115_60)] text-white";
  if (index === 1) return "bg-muted text-muted-foreground";
  if (index === 2) return "bg-[oklch(0.560_0.140_28/0.8)] text-white";
  return "bg-muted text-muted-foreground";
}

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
</script>
