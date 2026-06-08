<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">📚</div>
        <h1>在线自习室</h1>
        <p class="subtitle">和朋友们一起专注学习</p>
      </div>

      <div class="tabs">
        <button
          :class="['tab', { active: mode === 'login' }]"
          @click="switchMode('login')"
        >登录</button>
        <button
          :class="['tab', { active: mode === 'register' }]"
          @click="switchMode('register')"
        >注册</button>
        <div class="tab-indicator" :class="mode"></div>
      </div>

      <!-- 登录表单 -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="form" autocomplete="off">
        <div class="field">
          <label>邮箱</label>
          <input v-model="loginEmail" type="email" placeholder="请输入邮箱地址" required />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="loginPassword" type="password" placeholder="请输入密码" required />
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button type="submit" class="btn-accent" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>登录</span>
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="form" autocomplete="off">
        <div class="field">
          <label>昵称</label>
          <input v-model="regNickname" placeholder="给自己取个名字吧" required />
        </div>
        <div class="field">
          <label>邮箱</label>
          <input v-model="regEmail" type="email" placeholder="请输入邮箱地址" required />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="regPassword" type="password" placeholder="6 位以上密码" required minlength="6" />
        </div>
        <p v-if="regMsg" class="msg">{{ regMsg }}</p>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" class="btn-accent" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>{{ step === "verify" ? "重新发送验证码" : "注册" }}</span>
        </button>

        <!-- 验证码输入 -->
        <div v-if="step === 'verify'" class="verify-section">
          <div class="verify-divider"><span>输入邮箱验证码</span></div>
          <div class="verify-row">
            <input
              v-model="verifyCode"
              placeholder="000000"
              maxlength="6"
              class="code-input"
              @input="onCodeInput"
            />
            <button
              type="button"
              class="btn-accent verify-btn"
              @click="handleVerify"
              :disabled="verifyCode.length < 6 || loading"
            >验证</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, setToken, setStoredUser } from "../utils/api.js";

const router = useRouter();
const mode = ref("login");
const step = ref("register");
const errorMsg = ref("");
const regMsg = ref("");
const loading = ref(false);

const loginEmail = ref("");
const loginPassword = ref("");

const regNickname = ref("");
const regEmail = ref("");
const regPassword = ref("");
const verifyCode = ref("");

function switchMode(m) {
  mode.value = m;
  errorMsg.value = "";
  regMsg.value = "";
  step.value = "register";
}

function onCodeInput() {
  verifyCode.value = verifyCode.value.replace(/\D/g, "");
}

async function handleLogin() {
  errorMsg.value = "";
  loading.value = true;
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value }),
    });
    onAuthSuccess(data);
  } catch (e) {
    errorMsg.value = e.data?.detail || e.message;
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  errorMsg.value = "";
  regMsg.value = "";
  loading.value = true;
  try {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: regEmail.value,
        password: regPassword.value,
        nickname: regNickname.value,
      }),
    });
    regMsg.value = "验证码已发送到邮箱，请查收";
    step.value = "verify";
  } catch (e) {
    errorMsg.value = e.data?.detail || e.message;
  } finally {
    loading.value = false;
  }
}

async function handleVerify() {
  errorMsg.value = "";
  loading.value = true;
  try {
    const data = await api("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email: regEmail.value, code: verifyCode.value }),
    });
    onAuthSuccess(data);
  } catch (e) {
    errorMsg.value = e.data?.detail || e.message;
  } finally {
    loading.value = false;
  }
}

function onAuthSuccess(data) {
  setToken(data.access_token);
  setStoredUser({ id: data.user_id, email: data.email, nickname: data.nickname });
  router.push("/lobby");
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(91, 93, 156, 0.06) 0%, transparent 60%),
    var(--bg);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 40px 36px 36px;
  animation: slideUp 0.4s ease;
}

.login-header { text-align: center; margin-bottom: 28px; }
.logo {
  font-size: 52px;
  margin-bottom: 4px;
  filter: grayscale(0.1);
}
.login-header h1 {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
  letter-spacing: 1px;
}
.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 300;
}

/* Tabs */
.tabs {
  position: relative;
  display: flex;
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 4px;
  margin-bottom: 24px;
}
.tab {
  flex: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 7px;
  position: relative;
  z-index: 1;
  transition: color 0.25s;
}
.tab.active { color: var(--accent); font-weight: 600; }
.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: var(--surface);
  border-radius: 7px;
  box-shadow: var(--shadow-xs);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}
.tab-indicator.register { transform: translateX(100%); }

/* Form */
.form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-left: 2px;
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
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
}
.btn-accent:hover { background: var(--accent-hover); }
.btn-accent:active { transform: scale(0.98); }
.btn-accent:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.code-input {
  text-align: center;
  letter-spacing: 10px;
  font-size: 22px !important;
  font-family: var(--font-mono);
  font-weight: 600;
}
.verify-section { animation: fadeIn 0.3s ease; }
.verify-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0 2px;
}
.verify-divider::before,
.verify-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--border);
}
.verify-divider span {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
.verify-row {
  display: flex;
  gap: 8px;
}
.verify-btn { width: auto !important; padding: 11px 20px !important; white-space: nowrap; }

.error {
  font-size: 13px;
  color: var(--danger);
  text-align: center;
  background: var(--danger-soft);
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  animation: fadeIn 0.2s ease;
}
.msg {
  font-size: 13px;
  color: var(--focus);
  text-align: center;
  background: var(--focus-soft);
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  animation: fadeIn 0.2s ease;
}
</style>
