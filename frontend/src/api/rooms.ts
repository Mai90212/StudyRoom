import { api } from "@/lib/api";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  LeaderboardResponse,
  MyRoom,
  Room,
  RoomMember,
} from "@/types/api";

export const roomsApi = {
  my: () => api.get<MyRoom[]>("/rooms/my").then((r) => r.data),

  detail: (id: number) =>
    api.get<Room>(`/rooms/${id}`).then((r) => r.data),

  create: (data: CreateRoomRequest) =>
    api.post<Room>("/rooms", data).then((r) => r.data),

  join: (data: JoinRoomRequest) =>
    api.post<Room>("/rooms/join", data).then((r) => r.data),

  leave: (id: number) =>
    api.post<{ detail: string }>(`/rooms/${id}/leave`).then((r) => r.data),

  remove: (id: number) =>
    api.delete<{ detail: string }>(`/rooms/${id}`).then((r) => r.data),

  kick: (roomId: number, userId: number) =>
    api
      .post<{ detail: string }>(`/rooms/${roomId}/kick/${userId}`)
      .then((r) => r.data),

  members: (id: number) =>
    api.get<RoomMember[]>(`/rooms/${id}/members`).then((r) => r.data),

  leaderboard: (id: number) =>
    api.get<LeaderboardResponse>(`/rooms/${id}/leaderboard`).then((r) => r.data),
};
