import { api } from "@/lib/api";
import type {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
  VerifyRequest,
} from "@/types/api";

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<{ detail: string }>("/auth/register", data).then((r) => r.data),

  verify: (data: VerifyRequest) =>
    api.post<AuthResponse>("/auth/verify", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  me: () => api.get<CurrentUser>("/auth/me").then((r) => r.data),
};
