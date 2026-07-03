import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followApi } from "@/api/follow";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export function useFollowing() {
  return useQuery({
    queryKey: ["follow", "following"],
    queryFn: () => followApi.following(),
  });
}

export function useFollowers() {
  return useQuery({
    queryKey: ["follow", "followers"],
    queryFn: () => followApi.followers(),
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => followApi.follow(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("已关注");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "关注失败"),
  });
}

export function useUnfollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => followApi.unfollow(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("已取消关注");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "取消失败"),
  });
}
