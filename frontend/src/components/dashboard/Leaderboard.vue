<template>
  <div class="leaderboard-card">
    <div class="card-header">
      <h3>专注排行榜</h3>
      <div class="period-switch">
        <button
          :class="['period-btn', { active: period === 'weekly' }]"
          @click="$emit('change-period', 'weekly')"
        >
          周榜
        </button>
        <button
          :class="['period-btn', { active: period === 'monthly' }]"
          @click="$emit('change-period', 'monthly')"
        >
          月榜
        </button>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <span class="empty-icon">🏆</span>
      <span>暂无排行数据</span>
      <span class="empty-hint">关注好友后可以看到排行</span>
    </div>

    <div v-else class="leaderboard-list">
      <div
        v-for="(item, index) in items"
        :key="item.user_id"
        :class="['leaderboard-item', { 'is-self': item.user_id === currentUserId }]"
      >
        <span :class="['rank', getRankClass(index)]">{{ index + 1 }}</span>
        <span class="nickname">{{ item.nickname || ('用户 #' + item.user_id) }}</span>
        <span class="minutes">{{ formatMinutes(item.total_minutes) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  period: {
    type: String,
    default: "weekly",
  },
});

defineEmits(["change-period"]);

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

function getRankClass(index) {
  if (index === 0) return "rank-gold";
  if (index === 1) return "rank-silver";
  if (index === 2) return "rank-bronze";
  return "";
}

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
</script>

<style scoped>
.leaderboard-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--border-light);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-header h3 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.period-switch {
  display: flex;
  gap: 4px;
  background: var(--bg);
  border-radius: var(--radius-xs);
  padding: 3px;
}

.period-btn {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  color: var(--text);
}

.period-btn.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow-xs);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.leaderboard-item:hover {
  background: var(--bg);
}

.leaderboard-item.is-self {
  background: var(--accent-light);
}

.rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg);
  flex-shrink: 0;
}

.rank-gold {
  background: #ffd700;
  color: #8b6914;
}

.rank-silver {
  background: #c0c0c0;
  color: #555;
}

.rank-bronze {
  background: #cd7f32;
  color: #5c3a1e;
}

.nickname {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.minutes {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--focus);
  flex-shrink: 0;
}
</style>
