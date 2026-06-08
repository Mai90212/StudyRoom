<template>
  <div class="room">
    <!-- 全屏遮罩 -->
    <transition name="overlay">
      <div v-if="showOverlay" class="overlay">
        <div class="overlay-card">
          <div class="overlay-icon">⏳</div>
          <h2>你刚才离开了页面</h2>
          <p>系统已将你标记为"摸鱼中"并通知了房间内所有人</p>
          <p class="overlay-hint">点击下方按钮恢复专注状态</p>
          <button class="overlay-btn" @click="confirmReturn">我回来了</button>
        </div>
      </div>
    </transition>

    <!-- 房间主界面 -->
    <div class="room-main">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn-back" @click="handleLeave" title="退出房间">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <span class="room-name">{{ roomInfo?.name || ('自习室 #' + roomId) }}</span>
        </div>

        <div class="toolbar-center">
          <div class="focus-timer">
            <span :class="['timer-ring', localStatus === 'focusing' ? 'ring-active' : 'ring-idle']"></span>
            <span class="timer-value">{{ formattedTime }}</span>
          </div>
        </div>

        <div class="toolbar-right">
          <button v-if="isOwner" class="btn-delete" @click="handleDeleteRoom" title="删除房间">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          <button class="btn-invite" @click="copyInviteCode">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="invite-code-text">{{ inviteCode }}</span>
          </button>
          <transition name="fade">
            <span v-if="copied" class="copied-badge">已复制</span>
          </transition>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="content">
        <!-- 左：成员列表 -->
        <div class="panel panel-members">
          <div class="panel-head">
            <h3>在线成员</h3>
            <span class="badge">{{ members.length }}</span>
          </div>
          <div class="member-list">
            <transition-group name="member">
              <div
                v-for="m in members"
                :key="m.user_id"
                :class="['member-item', { 'is-self': m.user_id === userId }]"
              >
                <div :class="['status-bubble', m.status === 'focusing' ? 'bubble-focus' : 'bubble-away']">
                  <span class="bubble-avatar">{{ String(m.user_id).slice(-2) }}</span>
                </div>
                <div class="member-info">
                  <span class="member-name">
                    用户 #{{ m.user_id }}
                    <span v-if="m.user_id === userId" class="self-tag">我</span>
                    <span v-if="m.user_id === roomOwnerId" class="owner-tag">房主</span>
                  </span>
                  <span :class="['member-status', m.status]">
                    {{ m.status === 'focusing' ? '专注中' : '摸鱼中' }}
                  </span>
                </div>
                <button
                  v-if="isOwner && m.user_id !== userId"
                  class="btn-kick"
                  @click="handleKick(m.user_id)"
                  title="踢出房间"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </transition-group>
            <div v-if="members.length === 0" class="empty-state">
              <span class="empty-icon">🌙</span>
              <span>等待成员加入...</span>
            </div>
          </div>

          <!-- 房间内排行榜 -->
          <div class="leaderboard-section">
            <div class="panel-head">
              <h3>📊 今日专注排行</h3>
            </div>
            <div class="leaderboard-list">
              <div v-if="roomLeaderboard.length === 0" class="empty-state">
                <span class="empty-icon">📈</span>
                <span>暂无数据</span>
              </div>
              <div
                v-for="(item, index) in roomLeaderboard"
                :key="item.user_id"
                :class="['leaderboard-item', { 'is-self': item.user_id === userId }]"
              >
                <span class="rank">{{ index + 1 }}</span>
                <span class="nickname">{{ item.nickname || ('用户 #' + item.user_id) }}</span>
                <span class="minutes">{{ item.total_minutes }} 分钟</span>
                <button
                  v-if="item.user_id !== userId && !isFollowing(item.user_id)"
                  :class="['btn-follow', { 'is-hiding': animatingFollowIds.has(item.user_id) }]"
                  :disabled="animatingFollowIds.has(item.user_id)"
                  @click="handleFollow(item.user_id)"
                >
                  + 关注
                </button>
                <button
                  v-if="item.user_id !== userId && isFollowing(item.user_id)"
                  class="btn-follow is-following"
                  @click="handleUnfollow(item.user_id)"
                >
                  取关
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：聊天 -->
        <div class="panel panel-chat">
          <div class="panel-head">
            <h3>房间消息</h3>
          </div>
          <div class="chat-log" ref="chatLogRef">
            <div v-if="chatMessages.length === 0" class="empty-state">
              <span class="empty-icon">💬</span>
              <span>还没有消息，来说点什么吧</span>
            </div>
            <transition-group name="chat" tag="div" class="chat-inner">
              <div v-for="(msg, i) in chatMessages" :key="i" :class="['chat-msg', { 'msg-self': msg.user_id === userId }]">
                <span class="chat-user">#{{ msg.user_id }}</span>
                <span class="chat-text">{{ msg.message }}</span>
              </div>
            </transition-group>
          </div>
          <div class="chat-input-row">
            <input
              v-model="chatInput"
              placeholder="说点什么..."
              @keyup.enter="sendChat"
              class="chat-input"
            />
            <button @click="sendChat" class="btn-send" :disabled="!chatInput.trim()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 底部状态条 -->
      <div class="status-bar">
        <span :class="['status-dot', localStatus === 'focusing' ? 'dot-focus' : 'dot-away']"></span>
        <span class="status-label">{{ statusText }}</span>
      </div>
    </div>

    <!-- Toast 消息 -->
    <Teleport to="body">
      <transition-group name="toast" tag="div" class="toast-container">
        <div
          v-for="msg in toasts"
          :key="msg.id"
          :class="['toast-item', msg.type]"
        >
          <span v-if="msg.type === 'success'" class="toast-icon">✓</span>
          <span v-else class="toast-icon">✕</span>
          <span class="toast-text">{{ msg.text }}</span>
        </div>
      </transition-group>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { wsUrl, api } from "../utils/api.js";

const props = defineProps({
  roomId: { type: Number, required: true },
  userId: { type: Number, required: true },
  inviteCode: { type: String, default: "" },
});
const emit = defineEmits(["leave"]);

const localStatus = ref("focusing");
const copied = ref(false);
const showOverlay = ref(false);
const focusSeconds = ref(0);
const members = ref([]);
const chatMessages = ref([]);
const chatInput = ref("");
const chatLogRef = ref(null);
const ws = ref(null);
const roomInfo = ref(null);
const roomOwnerId = ref(null);
const roomLeaderboard = ref([]);
const followingIds = ref(new Set()); // 已关注的用户 ID 集合
const animatingFollowIds = ref(new Set());
const toasts = ref([]);
let toastId = 0;

// 数据采集相关
let awayCount = 0;
let awayStartTime = null;
let totalAwaySeconds = 0;
let sessionStartTime = Date.now();
let currentHourFocus = 0;
let currentHourStart = null;
let hourlyReportTimer = null;

let graceTimer = null;
let heartbeatTimer = null;
let focusTimer = null;

const isOwner = computed(() => roomOwnerId.value === props.userId);

const statusText = computed(() => {
  if (localStatus.value === "focusing") return "专注中";
  if (localStatus.value === "overlay") return "摸鱼中（待确认）";
  return "摸鱼中";
});

const formattedTime = computed(() => {
  const s = focusSeconds.value;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
});

async function fetchRoomInfo() {
  try {
    const data = await api(`/rooms/${props.roomId}`);
    roomInfo.value = data;
    roomOwnerId.value = data.owner_id;
  } catch {}
}

function connectWS() {
  const url = wsUrl(`/rooms/${props.roomId}/ws?user_id=${props.userId}`);
  ws.value = new WebSocket(url);
  ws.value.onopen = () => {
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, 10000);
  };
  ws.value.onmessage = (event) => {
    try { handleMessage(JSON.parse(event.data)); } catch {}
  };
  ws.value.onclose = (event) => {
    clearInterval(heartbeatTimer);
    if (event.code !== 1000) setTimeout(connectWS, 3000);
  };
}

function handleMessage(msg) {
  switch (msg.type) {
    case "room_state":
      members.value = msg.members || [];
      break;
    case "user_join":
      members.value = members.value.filter((m) => m.user_id !== msg.user_id);
      members.value.push({ user_id: msg.user_id, status: msg.status || "focusing" });
      break;
    case "user_leave":
      members.value = members.value.filter((m) => m.user_id !== msg.user_id);
      break;
    case "user_status":
      members.value = members.value.map((m) =>
        m.user_id === msg.user_id ? { ...m, status: msg.status } : m
      );
      break;
    case "chat":
      chatMessages.value.push({ user_id: msg.user_id, message: msg.message });
      scrollChat();
      break;
    case "room_deleted":
      alert("房间已被房主删除");
      emit("leave");
      break;
    case "kicked":
      alert("你被房主移出了房间");
      emit("leave");
      break;
  }
}

function send(data) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify(data));
  }
}

function sendHeartbeat() { send({ type: "heartbeat", ts: Date.now() }); }
function sendStatus(status) { send({ type: "status_change", status }); }

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  send({ type: "chat", message: text });
  chatInput.value = "";
}

function scrollChat() {
  nextTick(() => {
    if (chatLogRef.value) chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight;
  });
}

function onVisibilityChange() {
  if (document.hidden) {
    awayCount++;
    awayStartTime = Date.now();
    clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      localStatus.value = "away";
      sendStatus("away");
    }, 10000);
  } else {
    clearTimeout(graceTimer);
    if (awayStartTime) {
      totalAwaySeconds += (Date.now() - awayStartTime) / 1000;
      awayStartTime = null;
    }
    if (localStatus.value === "away") {
      showOverlay.value = true;
      localStatus.value = "overlay";
    }
  }
}

function confirmReturn() {
  showOverlay.value = false;
  localStatus.value = "focusing";
  sendStatus("focusing");
}

function startFocusTimer() {
  focusTimer = setInterval(() => {
    if (localStatus.value === "focusing") {
      focusSeconds.value++;
      currentHourFocus++;
    }
  }, 1000);
}

function reportTime() {
  if (focusSeconds.value > 0) {
    api("/focus/report", {
      method: "POST",
      body: JSON.stringify({
        room_id: props.roomId,
        total_focus_seconds: focusSeconds.value,
      }),
    }).catch(() => {});
    focusSeconds.value = 0;
  }
}

function reportHourlyFocus() {
  if (currentHourFocus > 0 && currentHourStart) {
    api("/focus/hourly", {
      method: "POST",
      body: JSON.stringify({
        room_id: props.roomId,
        hour_start: currentHourStart.toISOString(),
        duration_seconds: currentHourFocus,
      }),
    }).catch(() => {});
    currentHourFocus = 0;
  }
}

function reportSession() {
  const totalSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
  api("/focus/session", {
    method: "POST",
    body: JSON.stringify({
      room_id: props.roomId,
      total_seconds: totalSeconds,
      away_seconds: Math.floor(totalAwaySeconds),
      away_count: awayCount,
    }),
  }).catch(() => {});
}

function scheduleHourlyReport() {
  const now = new Date();
  currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);

  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const msUntilNextHour = nextHour - now;

  setTimeout(() => {
    reportHourlyFocus();
    currentHourStart = new Date();
    currentHourStart.setMinutes(0, 0, 0);
    hourlyReportTimer = setInterval(() => {
      reportHourlyFocus();
      currentHourStart = new Date();
      currentHourStart.setMinutes(0, 0, 0);
    }, 3600000);
  }, msUntilNextHour);
}

async function fetchRoomLeaderboard() {
  try {
    const data = await api(`/rooms/${props.roomId}/leaderboard`);
    roomLeaderboard.value = data.items || [];
  } catch {}
}

async function fetchFollowing() {
  try {
    const data = await api("/follow/following");
    followingIds.value = new Set((data.users || []).map(u => u.user_id));
  } catch {}
}

async function handleFollow(targetUserId) {
  try {
    await api(`/follow/${targetUserId}`, { method: "POST" });
    animatingFollowIds.value.add(targetUserId);
    showToast("已关注", "success");
    setTimeout(() => {
      followingIds.value.add(targetUserId);
      animatingFollowIds.value.delete(targetUserId);
    }, 400);
  } catch (e) {
    showToast(e.data?.detail || "关注失败", "error");
  }
}

async function handleUnfollow(targetUserId) {
  try {
    await api(`/follow/${targetUserId}`, { method: "DELETE" });
    followingIds.value.delete(targetUserId);
    showToast("已取消关注", "success");
  } catch (e) {
    showToast(e.data?.detail || "取消关注失败", "error");
  }
}

function showToast(text, type = "success") {
  const id = ++toastId;
  toasts.value.push({ id, text, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 2500);
}

function isFollowing(userId) {
  return followingIds.value.has(userId);
}

function handleLeave() {
  reportTime();
  reportHourlyFocus();
  reportSession();
  setTimeout(() => emit("leave"), 150);
}

async function handleDeleteRoom() {
  if (!confirm("确定要删除这个自习室吗？所有成员将被移出。")) return;
  try {
    await api(`/rooms/${props.roomId}`, { method: "DELETE" });
  } catch {}
  emit("leave");
}

async function handleKick(targetUserId) {
  if (!confirm(`确定要踢出用户 #${targetUserId} 吗？`)) return;
  try {
    await api(`/rooms/${props.roomId}/kick/${targetUserId}`, { method: "POST" });
  } catch (e) {
    alert(e.data?.detail || "操作失败");
  }
}

async function copyInviteCode() {
  try {
    await navigator.clipboard.writeText(props.inviteCode);
  } catch {
    const input = document.createElement("input");
    input.value = props.inviteCode;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function onBeforeUnload() {
  if (focusSeconds.value > 0) {
    const token = localStorage.getItem("token");
    const blob = new Blob(
      [JSON.stringify({ room_id: props.roomId, total_focus_seconds: focusSeconds.value })],
      { type: "application/json" }
    );
    navigator.sendBeacon(
      `http://localhost:8000/focus/report?token=${token}`,
      blob
    );
    focusSeconds.value = 0;
  }
  // 上报会话数据
  const totalSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
  const sessionBlob = new Blob(
    [JSON.stringify({
      room_id: props.roomId,
      total_seconds: totalSeconds,
      away_seconds: Math.floor(totalAwaySeconds),
      away_count: awayCount,
    })],
    { type: "application/json" }
  );
  const token = localStorage.getItem("token");
  navigator.sendBeacon(
    `http://localhost:8000/focus/session?token=${token}`,
    sessionBlob
  );
}

onMounted(() => {
  fetchRoomInfo();
  connectWS();
  startFocusTimer();
  scheduleHourlyReport();
  fetchRoomLeaderboard();
  fetchFollowing();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", onBeforeUnload);
});

onUnmounted(() => {
  clearTimeout(graceTimer);
  clearInterval(heartbeatTimer);
  clearInterval(focusTimer);
  clearInterval(hourlyReportTimer);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("beforeunload", onBeforeUnload);
  reportTime();
  reportHourlyFocus();
  reportSession();
  if (ws.value) {
    ws.value.onclose = null;
    ws.value.close();
  }
});
</script>

<style scoped>
.room { position: relative; }

/* ---- Overlay ---- */
.overlay-enter-active { animation: fadeIn 0.3s ease; }
.overlay-leave-active { animation: fadeIn 0.2s ease reverse; }

.overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(61, 53, 41, 0.88);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.overlay-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 48px 40px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.4s ease;
}
.overlay-icon { font-size: 56px; margin-bottom: 16px; }
.overlay-card h2 {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--text);
  margin-bottom: 12px;
}
.overlay-card p { color: var(--text-secondary); margin-bottom: 6px; line-height: 1.7; }
.overlay-hint { color: var(--away) !important; font-weight: 600; font-size: 15px; }
.overlay-btn {
  margin-top: 28px;
  padding: 14px 48px;
  background: var(--focus);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.overlay-btn:hover { background: #5a8a5f; box-shadow: var(--focus-glow); }
.overlay-btn:active { transform: scale(0.97); }

/* ---- Room Main ---- */
.room-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
}

/* ---- Toolbar ---- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-xs);
  z-index: 10;
}
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 10px; min-width: 140px; }
.toolbar-right { justify-content: flex-end; }
.toolbar-center { flex: 1; display: flex; justify-content: center; }

.btn-back {
  width: 34px; height: 34px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-back:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }

.room-name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.focus-timer {
  display: flex;
  align-items: center;
  gap: 10px;
}
.timer-ring {
  width: 10px; height: 10px;
  border-radius: 50%;
  transition: all 0.5s;
}
.ring-active {
  background: var(--focus);
  animation: breathe 2s ease-in-out infinite;
}
.ring-idle {
  background: var(--away);
  opacity: 0.6;
}
.timer-value {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

.btn-invite {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--surface);
  border: 1.5px dashed var(--accent);
  border-radius: var(--radius-xs);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.btn-invite:hover { background: var(--accent-light); }
.invite-code-text { font-family: var(--font-mono); letter-spacing: 2px; }

.btn-delete {
  width: 34px; height: 34px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-delete:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }

.copied-badge {
  background: var(--focus);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
  animation: slideUp 0.2s ease;
}

/* ---- Content ---- */
.content {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: hidden;
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  margin: 16px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--border-light);
  overflow: hidden;
}
.panel-members { flex: 0 0 280px; margin-right: 0; }
.panel-chat { flex: 1; margin-left: 0; }
@media (max-width: 640px) {
  .content { flex-direction: column; }
  .panel-members { flex: 0 0 auto; max-height: 200px; margin-bottom: 0; }
  .panel-chat { margin-top: 0; }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}
.panel-head h3 {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.badge {
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
}

/* ---- Member List ---- */
.member-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
  position: relative;
}
.member-item:hover { background: var(--bg); }
.member-item.is-self { background: var(--accent-light); }
.member-enter-active { animation: fadeIn 0.25s ease; }
.member-leave-active { animation: fadeIn 0.2s ease reverse; }

.status-bubble {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.5s;
}
.bubble-focus {
  background: var(--focus-soft);
  box-shadow: 0 0 0 3px rgba(106, 155, 111, 0.15);
}
.bubble-away {
  background: var(--away-soft);
  box-shadow: 0 0 0 3px rgba(212, 149, 107, 0.15);
}
.bubble-avatar {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  opacity: 0.7;
}

.member-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.member-name { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.self-tag {
  font-size: 10px;
  color: var(--accent);
  background: var(--accent-light);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.owner-tag {
  font-size: 10px;
  color: var(--away);
  background: var(--away-soft);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.member-status {
  font-size: 12px;
  font-weight: 500;
}
.member-status.focusing { color: var(--focus); }
.member-status.away { color: var(--away); }

.btn-kick {
  width: 26px; height: 26px;
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
.member-item:hover .btn-kick { opacity: 1; }
.btn-kick:hover { background: var(--danger-soft); color: var(--danger); }

/* ---- Leaderboard ---- */
.leaderboard-section {
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}
.leaderboard-list {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-xs);
  font-size: 13px;
}
.leaderboard-item.is-self { background: var(--accent-light); }
.leaderboard-item .rank {
  width: 20px;
  text-align: center;
  font-weight: 700;
  color: var(--accent);
}
.leaderboard-item .nickname {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.leaderboard-item .minutes {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--focus);
}

.leaderboard-item .btn-follow {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid var(--focus);
  color: var(--focus);
  background: transparent;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.leaderboard-item .btn-follow:hover {
  background: var(--focus);
  color: white;
}
.leaderboard-item .btn-follow.is-following {
  border-color: var(--border);
  color: var(--text-muted);
}
.leaderboard-item .btn-follow.is-following:hover {
  border-color: #e57373;
  color: #e57373;
  background: rgba(229, 115, 115, 0.1);
}
.leaderboard-item .btn-follow.is-hiding {
  opacity: 0;
  transform: scale(0.5);
  pointer-events: none;
}

/* ---- Toast ---- */
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}
.toast-item.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}
.toast-item.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}
.toast-icon {
  font-weight: 700;
  font-size: 16px;
}
.toast-enter-active {
  animation: toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-leave-active {
  animation: toastOut 0.25s ease forwards;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateY(-16px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-8px) scale(0.9); }
}

/* ---- Chat ---- */
.chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.chat-inner { display: flex; flex-direction: column; gap: 4px; margin-top: auto; }
.chat-enter-active { animation: fadeIn 0.2s ease; }

.chat-msg {
  padding: 7px 12px;
  border-radius: var(--radius-xs);
  font-size: 14px;
  line-height: 1.6;
  max-width: 80%;
  align-self: flex-start;
  background: var(--bg);
  animation: fadeIn 0.2s ease;
}
.msg-self {
  align-self: flex-end;
  background: var(--accent-light);
}
.chat-user {
  font-weight: 700;
  color: var(--accent);
  margin-right: 6px;
  font-size: 12px;
}
.msg-self .chat-user { color: var(--text-secondary); }
.chat-text { color: var(--text); }

.chat-input-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg);
}
.chat-input {
  flex: 1;
  border: 1.5px solid var(--border) !important;
  border-radius: 24px !important;
  padding: 9px 18px !important;
  background: var(--surface) !important;
  font-size: 14px !important;
}
.chat-input:focus { border-color: var(--accent) !important; }
.btn-send {
  width: 40px; height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-send:hover { background: var(--accent-hover); transform: scale(1.05); }
.btn-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.btn-send:active:not(:disabled) { transform: scale(0.95); }

/* ---- Empty State ---- */
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
.empty-icon { font-size: 32px; opacity: 0.5; }

/* ---- Status Bar ---- */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: var(--surface);
  border-top: 1px solid var(--border-light);
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; transition: all 0.5s; }
.dot-focus {
  background: var(--focus);
  box-shadow: 0 0 6px rgba(106, 155, 111, 0.5);
  animation: breathe 2s ease-in-out infinite;
}
.dot-away {
  background: var(--away);
  box-shadow: 0 0 6px rgba(212, 149, 107, 0.4);
}
.status-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
</style>
