import { api } from "@/lib/api";
import type {
  DistributionResponse,
  HeatmapResponse,
  ScoreResponse,
  StatsResponse,
  StreakResponse,
} from "@/types/api";

export const dashboardApi = {
  stats: () => api.get<StatsResponse>("/dashboard/stats").then((r) => r.data),

  heatmap: (days = 180) =>
    api
      .get<HeatmapResponse>("/dashboard/heatmap", { params: { days } })
      .then((r) => r.data),

  distribution: (days = 7) =>
    api
      .get<DistributionResponse>("/dashboard/distribution", { params: { days } })
      .then((r) => r.data),

  score: () => api.get<ScoreResponse>("/dashboard/score").then((r) => r.data),

  streak: () => api.get<StreakResponse>("/dashboard/streak").then((r) => r.data),
};
