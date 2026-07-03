import { api } from "@/lib/api";
import type { SettingsResponse, SettingsUpdateRequest } from "@/types/api";

export const settingsApi = {
  get: () => api.get<SettingsResponse>("/settings").then((r) => r.data),

  update: (data: SettingsUpdateRequest) =>
    api.put<SettingsResponse>("/settings", data).then((r) => r.data),
};
