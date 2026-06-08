<template>
  <div class="stats-cards">
    <div class="card">
      <div class="card-icon">📅</div>
      <div class="card-content">
        <span class="card-value">{{ formatMinutes(stats.today_minutes) }}</span>
        <span class="card-label">今日专注</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (stats.today_progress * 100) + '%' }"></div>
        </div>
        <span class="card-hint">目标 {{ stats.today_goal }} 分钟</span>
      </div>
    </div>

    <div class="card">
      <div class="card-icon">📊</div>
      <div class="card-content">
        <span class="card-value">{{ formatMinutes(stats.week_minutes) }}</span>
        <span class="card-label">本周专注</span>
      </div>
    </div>

    <div class="card">
      <div class="card-icon">📈</div>
      <div class="card-content">
        <span class="card-value">{{ formatMinutes(stats.month_minutes) }}</span>
        <span class="card-label">本月专注</span>
      </div>
    </div>
  </div>
</template>

<script setup>
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

<style scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: all 0.2s;
}
.card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.card-value {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.card-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border-light);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--focus);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.card-hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
