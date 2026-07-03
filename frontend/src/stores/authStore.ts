import { create } from "zustand";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  type StoredUser,
} from "@/lib/api";
import { authApi } from "@/api/auth";

interface AuthState {
  token: string | null;
  user: StoredUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: StoredUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: getStoredUser(),
  isAuthenticated: !!getToken(),
  setAuth: (token, user) => {
    setToken(token);
    setStoredUser(user);
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    clearAuth();
    set({ token: null, user: null, isAuthenticated: false });
  },
  refreshUser: async () => {
    try {
      const me = await authApi.me();
      const user: StoredUser = {
        id: me.id,
        email: me.email,
        nickname: me.nickname,
      };
      setStoredUser(user);
      set({ user });
    } catch {
      clearAuth();
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
