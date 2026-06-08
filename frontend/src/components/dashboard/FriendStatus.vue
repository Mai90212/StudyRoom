<template>
  <div class="friend-status-card">
    <div class="card-header">
      <h3>好友状态</h3>
      <button class="btn-refresh" @click="$emit('refresh')" title="刷新">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>
    </div>

    <div v-if="users.length === 0" class="empty-state">
      <span class="empty-icon">👥</span>
      <span>还没有关注的好友</span>
      <span class="empty-hint">在房间内关注其他用户</span>
    </div>

    <div v-else class="user-list">
      <div v-for="user in users" :key="user.user_id" class="user-item">
        <div :class="['status-indicator', user.is_online ? 'online' : 'offline']"></div>
        <div class="user-info">
          <span class="user-name">{{ user.nickname || ('用户 #' + user.user_id) }}</span>
          <span :class="['user-status', user.is_online ? 'online' : 'offline']">
            {{ user.is_online ? '在线' : '离线' }}
          </span>
        </div>
        <button class="btn-unfollow" @click="handleUnfollow(user.user_id)" title="取消关注">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { api } from "../../utils/api.js";

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["refresh"]);

async function handleUnfollow(userId) {
  if (!confirm("确定要取消关注吗？")) return;
  try {
    await api(`/follow/${userId}`, { method: "DELETE" });
    emit("refresh");
  } catch {}
}
</script>

<style scoped>
.friend-status-card {
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

.btn-refresh {
  width: 32px;
  height: 32px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-refresh:hover {
  border-color: var(--accent);
  color: var(--accent);
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

.user-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.user-item:hover {
  background: var(--bg);
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.online {
  background: var(--focus);
  box-shadow: 0 0 6px rgba(106, 155, 111, 0.5);
}

.status-indicator.offline {
  background: var(--text-muted);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-status {
  font-size: 12px;
  font-weight: 500;
}

.user-status.online {
  color: var(--focus);
}

.user-status.offline {
  color: var(--text-muted);
}

.btn-unfollow {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.user-item:hover .btn-unfollow {
  opacity: 1;
}

.btn-unfollow:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
</style>
