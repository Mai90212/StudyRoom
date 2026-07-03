import { api } from "@/lib/api";
import type { LeaderboardResponse } from "@/types/api";

export const leaderboardApi = {
  list: (period: "weekly" | "monthly") =>
    api
      .get<LeaderboardResponse>(`/leaderboard/${period}`)
      .then((r) => r.data),
};
