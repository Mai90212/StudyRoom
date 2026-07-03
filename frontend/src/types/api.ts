// ─── Auth ───
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}
export interface VerifyRequest {
  email: string;
  code: string;
}
export interface AuthResponse {
  access_token: string;
  user_id: number;
  email: string;
  nickname: string;
}
export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  is_verified: boolean;
}

// ─── Rooms ───
export interface Room {
  id: number;
  name: string;
  invite_code: string;
  max_members: number;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  member_count: number;
}
export interface MyRoom extends Room {
  online_count: number;
  is_owner: boolean;
}
export interface CreateRoomRequest {
  name: string;
  max_members: number;
}
export interface JoinRoomRequest {
  invite_code: string;
}
export interface RoomMember {
  user_id: number;
  status: "focusing" | "away" | "offline";
  joined_at: string;
  nickname?: string;
}

// ─── Focus ───
export interface FocusReportRequest {
  room_id: number;
  total_focus_seconds: number;
}
export interface FocusSessionReportRequest {
  room_id: number | null;
  total_seconds: number;
  away_seconds: number;
  away_count: number;
}
export interface FocusHourlyReportRequest {
  room_id: number;
  hour_start: string;
  duration_seconds: number;
}
export interface FocusDailyRecord {
  room_id: number;
  minutes: number;
}
export interface FocusDailyItem {
  date: string;
  total_minutes: number;
  records: FocusDailyRecord[];
}
export interface FocusSummary {
  today_minutes: number;
  week_minutes: number;
  daily: FocusDailyItem[];
}

// ─── Dashboard ───
export interface StatsResponse {
  today_minutes: number;
  week_minutes: number;
  month_minutes: number;
  today_goal: number;
  today_progress: number;
}
export interface HeatmapItem {
  date: string;
  minutes: number;
  level: number;
}
export interface HeatmapResponse {
  data: HeatmapItem[];
}
export interface HourlyDistributionItem {
  hour: number;
  avg_minutes: number;
}
export interface DistributionResponse {
  hours: HourlyDistributionItem[];
}
export interface ScoreResponse {
  score: number;
  duration_score: number;
  stability_score: number;
  away_count: number;
  focus_minutes: number;
}
export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  today_done: boolean;
}

// ─── Follow ───
export interface FollowUserItem {
  user_id: number;
  nickname: string;
  is_online: boolean;
  followed_at: string | null;
}
export interface FollowListResponse {
  users: FollowUserItem[];
}

// ─── Leaderboard ───
export interface LeaderboardItem {
  user_id: number;
  nickname: string;
  total_minutes: number;
  rank: number;
}
export interface LeaderboardResponse {
  items: LeaderboardItem[];
  period: "weekly" | "monthly";
}

// ─── Settings ───
export interface SettingsResponse {
  daily_goal_minutes: number;
  streak_goal_minutes: number;
}
export interface SettingsUpdateRequest {
  daily_goal_minutes?: number;
  streak_goal_minutes?: number;
}

// ─── WebSocket ───
export type MemberStatus = "focusing" | "away" | "offline";
export interface WsMemberState {
  user_id: number;
  status: MemberStatus;
  nickname?: string;
}
export type ServerMessage =
  | { type: "room_state"; members: WsMemberState[] }
  | { type: "user_join"; user_id: number; status: MemberStatus; nickname?: string }
  | { type: "user_leave"; user_id: number; reason: string }
  | { type: "user_status"; user_id: number; status: MemberStatus }
  | { type: "chat"; user_id: number; message: string; nickname?: string }
  | { type: "room_deleted" }
  | { type: "kicked" }
  | { type: "leaderboard_update"; items: LeaderboardItem[] };
export type ClientMessage =
  | { type: "heartbeat"; ts: number }
  | { type: "status_change"; status: MemberStatus }
  | { type: "chat"; message: string }
  | { type: "report_time"; action: "report_time"; total_focus_seconds: number };
