import { api } from "@/lib/api";
import type {
  FocusHourlyReportRequest,
  FocusReportRequest,
  FocusSessionReportRequest,
  FocusSummary,
} from "@/types/api";

export const focusApi = {
  report: (data: FocusReportRequest) =>
    api.post<{ detail: string }>("/focus/report", data).then((r) => r.data),

  summary: () => api.get<FocusSummary>("/focus/me").then((r) => r.data),

  session: (data: FocusSessionReportRequest) =>
    api.post<{ detail: string }>("/focus/session", data).then((r) => r.data),

  hourly: (data: FocusHourlyReportRequest) =>
    api.post<{ detail: string }>("/focus/hourly", data).then((r) => r.data),
};
