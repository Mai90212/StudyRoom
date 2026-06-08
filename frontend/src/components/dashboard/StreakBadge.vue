<template>
  <div class="streak-card">
    <div class="streak-icon">🔥</div>
    <div class="streak-content">
      <div class="streak-main">
        <span class="streak-value">{{ streak.current_streak }}</span>
        <span class="streak-unit">天</span>
      </div>
      <span class="streak-label">当前连胜</span>
    </div>
    <div class="streak-divider"></div>
    <div class="streak-details">
      <div class="detail-item">
        <span class="detail-label">最长连胜:</span>
        <span class="detail-value">{{ streak.longest_streak }} 天</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">今日打卡:</span>
        <span :class="['detail-status', streak.today_done ? 'done' : 'pending']">
          {{ streak.today_done ? '✅ 已完成' : '⏳ 进行中' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
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

<style scoped>
.streak-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 20px;
}

.streak-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.streak-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.streak-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.streak-value {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 700;
  color: var(--text);
}

.streak-unit {
  font-size: 14px;
  color: var(--text-secondary);
}

.streak-label {
  font-size: 12px;
  color: var(--text-muted);
}

.streak-divider {
  width: 1px;
  height: 50px;
  background: var(--border-light);
  flex-shrink: 0;
}

.streak-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.detail-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.detail-status {
  font-size: 13px;
  font-weight: 500;
}

.detail-status.done {
  color: var(--focus);
}

.detail-status.pending {
  color: var(--away);
}
</style>
