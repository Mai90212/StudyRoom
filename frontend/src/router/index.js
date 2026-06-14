import { createRouter, createWebHistory } from "vue-router";
import { getToken, clearToken } from "../utils/api.js";
import LoginView from "../views/LoginView.vue";
import LobbyView from "../views/LobbyView.vue";
import RoomView from "../views/RoomView.vue";
import DashboardView from "../views/DashboardView.vue";

const routes = [
  { path: "/", name: "login", component: LoginView },
  { path: "/login", redirect: "/" },
  { path: "/lobby", name: "lobby", component: LobbyView, meta: { requiresAuth: true } },
  { path: "/room", name: "room", component: RoomView, meta: { requiresAuth: true } },
  { path: "/dashboard", name: "dashboard", component: DashboardView, meta: { requiresAuth: true } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = getToken();
    if (!token) {
      next({ name: "login" });
      return;
    }
    // 验证 token 是否有效
    try {
      const resp = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        clearToken();
        next({ name: "login" });
        return;
      }
    } catch {
      // 网络错误时也放行，让页面自己处理
    }
  }
  next();
});

export default router;
