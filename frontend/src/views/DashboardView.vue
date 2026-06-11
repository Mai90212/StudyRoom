<template>
  <div class="min-h-screen bg-background pb-12">
    <div class="mx-auto max-w-4xl px-5">
      <!-- Top nav -->
      <header class="flex items-center justify-between py-4">
        <Button variant="outline" size="icon" class="h-9 w-9" title="返回大厅" @click="goBack">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <h1 class="font-serif text-2xl font-bold text-foreground">专注数据</h1>
        <Dialog v-model:open="showSettings">
          <DialogTrigger as-child>
            <Button variant="outline" size="icon" class="h-9 w-9" title="设置">
              <Settings class="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle class="font-serif">专注设置</DialogTitle>
              <DialogDescription>调整你的每日目标和连胜要求</DialogDescription>
            </DialogHeader>
            <div class="flex flex-col gap-4 py-2">
              <div class="flex flex-col gap-1.5">
                <Label for="daily-goal">每日目标（分钟）</Label>
                <Input
                  id="daily-goal"
                  v-model.number="settings.daily_goal_minutes"
                  type="number"
                  min="1"
                  max="480"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label for="streak-goal">连胜最低要求（分钟）</Label>
                <Input
                  id="streak-goal"
                  v-model.number="settings.streak_goal_minutes"
                  type="number"
                  min="1"
                  max="120"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" @click="showSettings = false">取消</Button>
              <Button @click="saveSettings">保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-3 relative">
          <div
            class="absolute left-0 inset-y-0 bg-background shadow-sm rounded-md transition-[width,transform] duration-300 ease-in-out pointer-events-none"
            :style="indicatorStyle"
          />
          <TabsTrigger value="stats">数据大盘</TabsTrigger>
          <TabsTrigger value="friends">好友状态</TabsTrigger>
          <TabsTrigger value="leaderboard">排行榜</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" class="flex flex-col gap-5">
          <StatsCards :stats="stats" />
          <Heatmap :data="heatmapData" />
          <StreakBadge :streak="streak" />
          <DistributionChart :data="distributionData" />
          <ScoreGauge :score="score" />
        </TabsContent>

        <TabsContent value="friends">
          <FriendStatus :users="followingList" @refresh="fetchFollowing" />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard
            :items="leaderboard"
            :period="leaderboardPeriod"
            @change-period="changeLeaderboardPeriod"
          />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Settings } from "@lucide/vue";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

import StatsCards from "@/components/dashboard/StatsCards.vue";
import Heatmap from "@/components/dashboard/Heatmap.vue";
import DistributionChart from "@/components/dashboard/DistributionChart.vue";
import ScoreGauge from "@/components/dashboard/ScoreGauge.vue";
import StreakBadge from "@/components/dashboard/StreakBadge.vue";
import FriendStatus from "@/components/dashboard/FriendStatus.vue";
import Leaderboard from "@/components/dashboard/Leaderboard.vue";

import { api } from "@/utils/api.js";

const router = useRouter();

const activeTab = ref("stats");
const showSettings = ref(false);
const tabsListRef = ref(null);

const tabOrder = ["stats", "friends", "leaderboard"];

const indicatorStyle = computed(() => {
  const idx = tabOrder.indexOf(activeTab.value);
  if (idx < 0) return { width: "0px", transform: "translateX(0px)" };
  const count = tabOrder.length;
  return {
    width: `${100 / count}%`,
    transform: `translateX(${idx * 100}%)`,
  };
});

const stats = ref({
  today_minutes: 0,
  week_minutes: 0,
  month_minutes: 0,
  today_goal: 120,
  today_progress: 0,
});

const heatmapData = ref([]);
const distributionData = ref([]);
const score = ref({
  score: 0,
  duration_score: 0,
  stability_score: 0,
  away_count: 0,
  focus_minutes: 0,
});
const streak = ref({
  current_streak: 0,
  longest_streak: 0,
  today_done: false,
});

const followingList = ref([]);
const leaderboard = ref([]);
const leaderboardPeriod = ref("weekly");

const settings = ref({
  daily_goal_minutes: 120,
  streak_goal_minutes: 30,
});

async function fetchStats() {
  try {
    stats.value = await api("/dashboard/stats");
  } catch {}
}

async function fetchHeatmap() {
  try {
    const data = await api("/dashboard/heatmap?days=180");
    heatmapData.value = data.data || [];
  } catch {}
}

async function fetchDistribution() {
  try {
    const data = await api("/dashboard/distribution?days=7");
    distributionData.value = data.hours || [];
  } catch {}
}

async function fetchScore() {
  try {
    score.value = await api("/dashboard/score");
  } catch {}
}

async function fetchStreak() {
  try {
    streak.value = await api("/dashboard/streak");
  } catch {}
}

async function fetchFollowing() {
  try {
    const data = await api("/follow/following");
    followingList.value = data.users || [];
  } catch {}
}

async function fetchLeaderboard() {
  try {
    const data = await api(`/leaderboard/${leaderboardPeriod.value}`);
    leaderboard.value = data.items || [];
  } catch {}
}

async function fetchSettings() {
  try {
    settings.value = await api("/settings");
  } catch {}
}

async function saveSettings() {
  try {
    await api("/settings", {
      method: "PUT",
      body: JSON.stringify(settings.value),
    });
    showSettings.value = false;
    toast.success("设置已保存");
    fetchStats();
    fetchHeatmap();
    fetchScore();
    fetchStreak();
  } catch (e) {
    toast.error(e.data?.detail || "保存失败");
  }
}

function changeLeaderboardPeriod(period) {
  leaderboardPeriod.value = period;
  fetchLeaderboard();
}

function goBack() {
  router.push("/lobby");
}

onMounted(() => {
  fetchStats();
  fetchHeatmap();
  fetchDistribution();
  fetchScore();
  fetchStreak();
  fetchFollowing();
  fetchLeaderboard();
  fetchSettings();
});

watch(activeTab, (tab) => {
  if (tab === "friends") fetchFollowing();
  if (tab === "leaderboard") fetchLeaderboard();
});
</script>
