import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/api/leaderboard";

export function useLeaderboard(period: "weekly" | "monthly") {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => leaderboardApi.list(period),
  });
}
