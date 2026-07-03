import { api } from "@/lib/api";
import type { FollowListResponse } from "@/types/api";

export const followApi = {
  follow: (userId: number) =>
    api.post<{ detail: string }>(`/follow/${userId}`).then((r) => r.data),

  unfollow: (userId: number) =>
    api.delete<{ detail: string }>(`/follow/${userId}`).then((r) => r.data),

  following: () =>
    api.get<FollowListResponse>("/follow/following").then((r) => r.data),

  followers: () =>
    api.get<FollowListResponse>("/follow/followers").then((r) => r.data),
};
