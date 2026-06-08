<template>
  <div class="lobby-page">
    <header class="lobby-header">
      <div class="brand">
        <span class="brand-icon">📚</span>
        <h1>在线自习室</h1>
      </div>
      <div class="header-right">
        <div class="user-menu">
          <button class="user-tag" @click="showUserMenu = !showUserMenu">
            {{ user?.nickname || '用户' }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <transition name="menu-fade">
            <div v-if="showUserMenu" class="menu-dropdown" @click="showUserMenu = false">
              <button class="menu-item" @click="goToDashboard">
                <span class="menu-icon">📊</span>
                <span>专注数据</span>
              </button>
              <div class="menu-divider"></div>
              <button class="menu-item menu-item-danger" @click="handleLogout">
                <span class="menu-icon">🚪</span>
                <span>退出登录</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- 我的房间 -->
    <section v-if="myRooms.length > 0" class="my-rooms-section">
      <h2 class="section-title">我的自习室</h2>
      <div class="my-rooms-grid">
        <div
          v-for="room in myRooms"
          :key="room.id"
          class="room-card"
          :class="{ 'is-owner': room.is_owner }"
          @click="enterRoom(room)"
        >
          <div class="room-card-top">
            <span class="room-role">{{ room.is_owner ? '房主' : '成员' }}</span>
            <span :class="['room-online', room.online_count > 0 ? 'has-online' : '']">
              <span class="online-dot"></span>
              {{ room.online_count }} 人在线
            </span>
          </div>
          <h3 class="room-card-name">{{ room.name }}</h3>
          <div class="room-card-meta">
            <span class="room-code">{{ room.invite_code }}</span>
            <span>{{ room.member_count }}/{{ room.max_members }} 人</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 创建/加入 -->
    <div class="lobby-grid">
      <div class="card" style="animation-delay: 0s">
        <div class="card-icon">✨</div>
        <h2>创建房间</h2>
        <p class="card-desc">创建一个新的自习室，邀请朋友们一起学习</p>
        <div class="field">
          <label>房间名称</label>
          <input v-model="createName" placeholder="给房间取个名字" @keyup.enter="handleCreate" />
        </div>
        <div class="field">
          <label>人数上限</label>
          <div class="stepper">
            <button type="button" class="step-btn" @click="createMax = Math.max(2, createMax - 1)">−</button>
            <span class="step-val">{{ createMax }}</span>
            <button type="button" class="step-btn" @click="createMax = Math.min(20, createMax + 1)">+</button>
          </div>
        </div>
        <button class="btn-accent" @click="handleCreate" :disabled="creating">
          <span v-if="creating" class="spinner"></span>
          <span v-else>创建房间</span>
        </button>
      </div>

      <div class="card" style="animation-delay: 0.1s">
        <div class="card-icon">🔑</div>
        <h2>加入房间</h2>
        <p class="card-desc">输入邀请码，加入朋友的自习室</p>
        <div class="field">
          <label>邀请码</label>
          <input
            v-model="joinCode"
            placeholder="输入 6 位邀请码"
            maxlength="6"
            class="code-input"
            @keyup.enter="handleJoin"
            @input="joinCode"
          />
        </div>
        <button class="btn-accent" @click="handleJoin" :disabled="joinCode.length < 6 || joining">
          <span v-if="joining" class="spinner"></span>
          <span v-else>加入房间</span>
        </button>
      </div>
    </div>

    <p v-if="errorMsg" class="error-float">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { api, clearToken } from "../utils/api.js";

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
const createName = ref("深夜自习室");
const createMax = ref(10);
const joinCode = ref("");
const showUserMenu = ref(false);
const errorMsg = ref("");
const creating = ref(false);
const joining = ref(false);
const myRooms = ref([]);

async function fetchMyRooms() {
  try {
    myRooms.value = await api("/rooms/my");
  } catch (e) {
    // 如果是 401 错误，api.js 会自动跳转到登录页
    // 其他错误静默处理
  }
}

function enterRoom(room) {
  router.push({ name: "room", query: { roomId: room.id, inviteCode: room.invite_code } });
}

async function handleCreate() {
  errorMsg.value = "";
  creating.value = true;
  try {
    const data = await api("/rooms", {
      method: "POST",
      body: JSON.stringify({ name: createName.value, max_members: +createMax.value }),
    });
    router.push({ name: "room", query: { roomId: data.id, inviteCode: data.invite_code } });
  } catch (e) {
    errorMsg.value = e.data?.detail || e.message;
    setTimeout(() => { errorMsg.value = ""; }, 4000);
  } finally {
    creating.value = false;
  }
}

async function handleJoin() {
  errorMsg.value = "";
  joining.value = true;
  try {
    const data = await api("/rooms/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: joinCode.value }),
    });
    router.push({ name: "room", query: { roomId: data.id, inviteCode: data.invite_code } });
  } catch (e) {
    errorMsg.value = e.data?.detail || e.message;
    setTimeout(() => { errorMsg.value = ""; }, 4000);
  } finally {
    joining.value = false;
  }
}

function handleLogout() {
  clearToken();
  router.push("/");
}

function goToDashboard() {
  router.push("/dashboard");
}

onMounted(fetchMyRooms);
</script>

<style scoped>
.lobby-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 20px;
  min-height: 100vh;
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
  animation: fadeIn 0.4s ease;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { font-size: 32px; }
.brand h1 {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--accent);
  font-weight: 700;
}
.header-right { display: flex; align-items: center; gap: 12px; }
.user-menu { position: relative; }
.user-tag {
  padding: 6px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.user-tag:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--surface);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  min-width: 160px;
  z-index: 100;
  overflow: hidden;
}
.menu-fade-enter-active { animation: fadeIn 0.2s ease; }
.menu-fade-leave-active { animation: fadeIn 0.15s ease reverse; }
.menu-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;
}
.menu-item:hover { background: var(--bg); }
.menu-item-danger { color: var(--danger); }
.menu-item-danger:hover { background: var(--danger-soft); }
.menu-icon { font-size: 16px; }
.menu-divider {
  height: 1px;
  background: var(--border-light);
}

/* ---- My Rooms ---- */
.my-rooms-section {
  margin-bottom: 32px;
  animation: slideUp 0.4s ease;
}
.section-title {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--text);
  margin-bottom: 14px;
  font-weight: 700;
}
.my-rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.room-card {
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
}
.room-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.room-card.is-owner { border-left: 3px solid var(--accent); }
.room-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.room-role {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--accent-light);
  color: var(--accent);
}
.is-owner .room-role {
  background: var(--accent);
  color: #fff;
}
.room-online {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
.room-online.has-online { color: var(--focus); }
.online-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}
.has-online .online-dot { background: var(--focus); }
.room-card-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.room-card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}
.room-code {
  font-family: var(--font-mono);
  letter-spacing: 1px;
  color: var(--text-secondary);
}

/* ---- Create/Join Cards ---- */
.lobby-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 600px) { .lobby-grid { grid-template-columns: 1fr; } }

.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 32px 28px;
  animation: slideUp 0.4s ease both;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: box-shadow 0.3s;
  border: 1px solid var(--border-light);
}
.card:hover { box-shadow: var(--shadow-md); }
.card-icon { font-size: 36px; }
.card h2 {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text);
  font-weight: 700;
}
.card-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.field { display: flex; flex-direction: column; gap: 5px; }
.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-left: 2px;
}

.code-input {
  letter-spacing: 4px;
  font-family: var(--font-mono);
  font-size: 20px !important;
  font-weight: 600;
  text-align: center;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  width: fit-content;
}
.step-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg);
  color: var(--text);
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-btn:hover { background: var(--surface-hover); }
.step-val {
  width: 48px;
  text-align: center;
  font-weight: 700;
  font-size: 18px;
  color: var(--accent);
  background: var(--surface);
  line-height: 40px;
}

.btn-accent {
  width: 100%;
  padding: 11px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-accent:hover { background: var(--accent-hover); }
.btn-accent:active { transform: scale(0.98); }
.btn-accent:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-float {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--danger);
  color: #fff;
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
  z-index: 100;
}
</style>
