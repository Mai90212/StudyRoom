<template>
  <div class="dashboard">
    <!-- 顶部导航 -->
    <div class="dashboard-nav">
      <button class="btn-back" @click="goBack" title="返回大厅">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <h1 class="dashboard-title">专注数据</h1>
      <button class="btn-settings" @click="showSettings = true" title="设置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 数据大盘 Tab -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <StatsCards :stats="stats" />
      <Heatmap :data="heatmapData" />
      <StreakBadge :streak="streak" />
      <DistributionChart :data="distributionData" />
      <ScoreGauge :score="score" />
    </div>

    <!-- 好友状态 Tab -->
    <div v-if="activeTab === 'friends'" class="tab-content">
      <FriendStatus :users="followingList" @refresh="fetchFollowing" />
    </div>

    <!-- 排行榜 Tab -->
    <div v-if="activeTab === 'leaderboard'" class="tab-content">
      <Leaderboard
        :items="leaderboard"
        :period="leaderboardPeriod"
        @change-period="changeLeaderboardPeriod"
      />
    </div>

    <!-- 设置弹窗 -->
    <transition name="overlay">
      <div v-if="showSettings" class="settings-overlay" @click.self="showSettings = false">
        <div class="settings-card">
          <h2>专注设置</h2>
          <div class="setting-item">
            <label>每日目标（分钟）</label>
            <input v-model.number="settings.daily_goal_minutes" type="number" min="1" max="480" />
          </div>
          <div class="setting-item">
            <label>连胜最低要求（分钟）</label>
            <input v-model.number="settings.streak_goal_minutes" type="number" min="1" max="120" />
          </div>
          <div class="settings-actions">
            <button class="btn-cancel" @click="showSettings = false">取消</button>
            <button class="btn-save" @click="saveSettings">保存</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { api } from "../utils/api.js";
import StatsCards from "../components/dashboard/StatsCards.vue";
import Heatmap from "../components/dashboard/Heatmap.vue";
import DistributionChart from "../components/dashboard/DistributionChart.vue";
import ScoreGauge from "../components/dashboard/ScoreGauge.vue";
import StreakBadge from "../components/dashboard/StreakBadge.vue";
import FriendStatus from "../components/dashboard/FriendStatus.vue";
import Leaderboard from "../components/dashboard/Leaderboard.vue";

const router = useRouter();

const activeTab = ref("stats");
const showSettings = ref(false);

const tabs = [
  { key: "stats", label: "数据大盘" },
  { key: "friends", label: "好友状态" },
  { key: "leaderboard", label: "排行榜" },
];

// 数据
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

// 数据获取
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
    // 刷新数据
    fetchStats();
    fetchHeatmap();
    fetchScore();
    fetchStreak();
  } catch {}
}

function changeLeaderboardPeriod(period) {
  leaderboardPeriod.value = period;
  fetchLeaderboard();
}

function goBack() {
  router.push("/lobby");
}

// 初始化
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

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 20px 40px;
}

/* ---- Navigation ---- */
.dashboard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  max-width: 800px;
  margin: 0 auto;
}
.btn-back {
  width: 36px; height: 36px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.dashboard-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}
.btn-settings {
  width: 36px; height: 36px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-settings:hover { border-color: var(--accent); color: var(--accent); }

/* ---- Tabs ---- */
.tabs {
  display: flex;
  gap: 4px;
  max-width: 800px;
  margin: 0 auto 24px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 4px;
  box-shadow: var(--shadow-xs);
}
.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover { color: var(--text); background: var(--bg); }
.tab-btn.active {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

/* ---- Tab Content ---- */
.tab-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---- Settings Overlay ---- */
.settings-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(61, 53, 41, 0.88);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.settings-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}
.settings-card h2 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 24px;
}
.setting-item {
  margin-bottom: 20px;
}
.setting-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}
.setting-item input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
}
.setting-item input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(91, 93, 156, 0.1);
}
.settings-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
.btn-cancel {
  padding: 10px 20px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--text-secondary); color: var(--text); }
.btn-save {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-xs);
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover { background: var(--accent-hover); }
</style>
