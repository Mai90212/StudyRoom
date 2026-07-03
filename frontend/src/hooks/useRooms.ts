import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomsApi } from "@/api/rooms";
import type { CreateRoomRequest, JoinRoomRequest } from "@/types/api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export function useMyRooms() {
  return useQuery({
    queryKey: ["rooms", "my"],
    queryFn: () => roomsApi.my(),
  });
}

export function useRoomDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["rooms", "detail", id],
    queryFn: () => roomsApi.detail(id!),
    enabled: !!id,
  });
}

export function useRoomMembers(id: number | undefined) {
  return useQuery({
    queryKey: ["rooms", "members", id],
    queryFn: () => roomsApi.members(id!),
    enabled: !!id,
  });
}

export function useRoomLeaderboard(id: number | undefined) {
  return useQuery({
    queryKey: ["rooms", "leaderboard", id],
    queryFn: () => roomsApi.leaderboard(id!),
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomRequest) => roomsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", "my"] });
      toast.success("房间已创建");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "创建失败"),
  });
}

export function useJoinRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: JoinRoomRequest) => roomsApi.join(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", "my"] });
      toast.success("已加入房间");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "加入失败"),
  });
}

export function useLeaveRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsApi.leave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", "my"] });
      toast.success("已退出房间");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "退出失败"),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => roomsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", "my"] });
      toast.success("房间已删除");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "删除失败"),
  });
}

export function useKickMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, userId }: { roomId: number; userId: number }) =>
      roomsApi.kick(roomId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", "my"] });
      toast.success("已踢出成员");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "踢出失败"),
  });
}
