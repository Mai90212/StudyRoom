import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";

export function useStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.stats(),
  });
}

export function useHeatmap(days = 180) {
  return useQuery({
    queryKey: ["dashboard", "heatmap", days],
    queryFn: () => dashboardApi.heatmap(days),
  });
}

export function useDistribution(days = 7) {
  return useQuery({
    queryKey: ["dashboard", "distribution", days],
    queryFn: () => dashboardApi.distribution(days),
  });
}

export function useScore() {
  return useQuery({
    queryKey: ["dashboard", "score"],
    queryFn: () => dashboardApi.score(),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ["dashboard", "streak"],
    queryFn: () => dashboardApi.streak(),
  });
}
