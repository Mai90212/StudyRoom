import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Crown,
  Hourglass,
  MessageCircle,
  Moon,
  Send,
  Trash2,
  TrendingUp,
  Trophy,
  UserX,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuthStore } from "@/stores/authStore";
import { roomsApi } from "@/api/rooms";
import { focusApi } from "@/api/focus";
import { followApi } from "@/api/follow";
import { ApiError, buildWsUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  ClientMessage,
  LeaderboardItem,
  MemberStatus,
  ServerMessage,
  WsMemberState,
} from "@/types/api";

const SAGE = "oklch(0.580 0.085 135)";
const AMBER = "oklch(0.700 0.115 60)";

interface ChatMsg {
  user_id: number;
  message: string;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 0;
  const roomIdNum = Number(roomId);

  const [roomName, setRoomName] = useState("");
  const [roomOwnerId, setRoomOwnerId] = useState<number | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [members, setMembers] = useState<WsMemberState[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [localStatus, setLocalStatus] = useState<MemberStatus>("focusing");
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [animatingFollowIds, setAnimatingFollowIds] = useState<Set<number>>(
    new Set(),
  );

  const chatLogRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const awayCountRef = useRef(0);
  const awayStartRef = useRef<number | null>(null);
  const totalAwayRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const currentHourFocusRef = useRef(0);
  const currentHourStartRef = useRef<Date | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourlyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingFocusRef = useRef(0);
  const pendingHourlyRef = useRef(0);
  const sessionPendingRef = useRef(false);

  const isOwner = roomOwnerId === userId;

  const statusText = useMemo(() => {
    if (localStatus === "focusing") return "专注中";
    if (showOverlay) return "摸鱼中（待确认）";
    return "摸鱼中";
  }, [localStatus, showOverlay]);

  const formattedTime = useMemo(() => {
    const s = focusSeconds;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, [focusSeconds]);

  const displayNameById = useCallback(
    (uid: number) => {
      const m = members.find((x) => x.user_id === uid);
      if (m?.nickname) return m.nickname;
      const lb = leaderboard.find((it) => it.user_id === uid);
      return lb?.nickname || `用户 #${uid}`;
    },
    [members, leaderboard],
  );

  const avatarText = useCallback(
    (uid: number) => {
      const name = displayNameById(uid);
      return (
        name.replace(/^用户\s*#/, "").charAt(0).toUpperCase() ||
        String(uid).slice(-2)
      );
    },
    [displayNameById],
  );

  const sendWs = useCallback((data: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const scrollChat = useCallback(() => {
    requestAnimationFrame(() => {
      const el = chatLogRef.current;
      if (el) {
        const viewport = el.closest(
          "[data-radix-scroll-area-viewport]",
        ) as HTMLElement | null;
        const target = viewport || el.parentElement;
        if (target) target.scrollTop = target.scrollHeight;
      }
    });
  }, []);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "room_state":
          setMembers(msg.members || []);
          break;
        case "user_join":
          setMembers((prev) => {
            const filtered = prev.filter((m) => m.user_id !== msg.user_id);
            return [
              ...filtered,
              {
                user_id: msg.user_id,
                nickname: msg.nickname,
                status: msg.status || "focusing",
              },
            ];
          });
          break;
        case "user_leave":
          setMembers((prev) => prev.filter((m) => m.user_id !== msg.user_id));
          break;
        case "user_status":
          setMembers((prev) =>
            prev.map((m) =>
              m.user_id === msg.user_id ? { ...m, status: msg.status } : m,
            ),
          );
          break;
        case "chat":
          setChatMessages((prev) => [
            ...prev,
            { user_id: msg.user_id, message: msg.message },
          ]);
          scrollChat();
          break;
        case "room_deleted":
          toast.error("房间已被房主删除");
          setTimeout(() => navigate("/lobby"), 1200);
          break;
        case "kicked":
          toast.error("你被房主移出了房间");
          setTimeout(() => navigate("/lobby"), 1200);
          break;
      }
    },
    [navigate, scrollChat],
  );

  const connectWs = useCallback(() => {
    const url = buildWsUrl(`/rooms/${roomIdNum}/ws?user_id=${userId}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => {
      sendWs({ type: "heartbeat", ts: Date.now() });
      heartbeatTimerRef.current = setInterval(() => {
        sendWs({ type: "heartbeat", ts: Date.now() });
      }, 10000);
    };
    ws.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data) as ServerMessage);
      } catch {
        // ignore malformed
      }
    };
    ws.onclose = (event) => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (event.code !== 1000) {
        setTimeout(() => connectWs(), 3000);
      }
    };
  }, [roomIdNum, userId, sendWs, handleMessage]);

  const reportTime = useCallback(() => {
    setFocusSeconds((current) => {
      const reportSeconds = current - pendingFocusRef.current;
      if (reportSeconds <= 0) return current;
      pendingFocusRef.current += reportSeconds;
      focusApi
        .report({ room_id: roomIdNum, total_focus_seconds: reportSeconds })
        .then(() => Math.max(0, current - reportSeconds))
        .catch(() => {})
        .finally(() => {
          pendingFocusRef.current = Math.max(
            0,
            pendingFocusRef.current - reportSeconds,
          );
        });
      return current;
    });
  }, [roomIdNum]);

  const reportHourly = useCallback(() => {
    const reportSeconds = currentHourFocusRef.current - pendingHourlyRef.current;
    const hourStart = currentHourStartRef.current;
    if (reportSeconds <= 0 || !hourStart) return;
    pendingHourlyRef.current += reportSeconds;
    focusApi
      .hourly({
        room_id: roomIdNum,
        hour_start: hourStart.toISOString(),
        duration_seconds: reportSeconds,
      })
      .then(() => {
        currentHourFocusRef.current = Math.max(
          0,
          currentHourFocusRef.current - reportSeconds,
        );
      })
      .catch(() => {})
      .finally(() => {
        pendingHourlyRef.current = Math.max(
          0,
          pendingHourlyRef.current - reportSeconds,
        );
      });
  }, [roomIdNum]);

  const reportSession = useCallback(() => {
    if (sessionPendingRef.current) return;
    const reportedAt = Date.now();
    const totalSeconds = Math.floor((reportedAt - sessionStartRef.current) / 1000);
    const awaySeconds = Math.floor(totalAwayRef.current);
    const reportedAwayCount = awayCountRef.current;
    sessionPendingRef.current = true;
    focusApi
      .session({
        room_id: roomIdNum,
        total_seconds: totalSeconds,
        away_seconds: awaySeconds,
        away_count: reportedAwayCount,
      })
      .then(() => {
        sessionStartRef.current = reportedAt;
        totalAwayRef.current = Math.max(0, totalAwayRef.current - awaySeconds);
        awayCountRef.current = Math.max(
          0,
          awayCountRef.current - reportedAwayCount,
        );
      })
      .catch(() => {})
      .finally(() => {
        sessionPendingRef.current = false;
      });
  }, [roomIdNum]);

  const onVisibilityChange = useCallback(() => {
    if (document.hidden) {
      awayCountRef.current++;
      awayStartRef.current = Date.now();
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      graceTimerRef.current = setTimeout(() => {
        setLocalStatus("away");
        sendWs({ type: "status_change", status: "away" });
      }, 10000);
    } else {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      if (awayStartRef.current) {
        totalAwayRef.current += (Date.now() - awayStartRef.current) / 1000;
        awayStartRef.current = null;
      }
      setLocalStatus((prev) => {
        if (prev === "away") {
          setShowOverlay(true);
          return "focusing";
        }
        return prev;
      });
    }
  }, [sendWs]);

  const onBeforeUnload = useCallback(() => {
    const token = localStorage.getItem("sr_token");
    setFocusSeconds((current) => {
      if (current > 0) {
        const blob = new Blob(
          [
            JSON.stringify({
              room_id: roomIdNum,
              total_focus_seconds: current,
            }),
          ],
          { type: "application/json" },
        );
        navigator.sendBeacon(`/api/focus/report?token=${token}`, blob);
      }
      return current;
    });
    const totalSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const sessionBlob = new Blob(
      [
        JSON.stringify({
          room_id: roomIdNum,
          total_seconds: totalSeconds,
          away_seconds: Math.floor(totalAwayRef.current),
          away_count: awayCountRef.current,
        }),
      ],
      { type: "application/json" },
    );
    navigator.sendBeacon(`/api/focus/session?token=${token}`, sessionBlob);
  }, [roomIdNum]);

  const fetchFollowing = useCallback(async () => {
    try {
      const data = await followApi.following();
      setFollowingIds(new Set((data.users || []).map((u) => u.user_id)));
    } catch {
      // silent
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await roomsApi.leaderboard(roomIdNum);
      setLeaderboard(data.items || []);
    } catch {
      // silent
    }
  }, [roomIdNum]);

  useEffect(() => {
    roomsApi
      .detail(roomIdNum)
      .then((data) => {
        setRoomName(data.name);
        setRoomOwnerId(data.owner_id);
        setInviteCode(data.invite_code);
      })
      .catch(() => {});
    connectWs();
    fetchLeaderboard();
    fetchFollowing();
    focusTimerRef.current = setInterval(() => {
      setLocalStatus((prev) => {
        if (prev === "focusing") {
          setFocusSeconds((s) => s + 1);
          currentHourFocusRef.current++;
        }
        return prev;
      });
    }, 1000);
    const now = new Date();
    currentHourStartRef.current = new Date(now);
    currentHourStartRef.current.setMinutes(0, 0, 0);
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();
    const initialTimeout = setTimeout(() => {
      reportHourly();
      currentHourStartRef.current = new Date();
      currentHourStartRef.current.setMinutes(0, 0, 0);
      hourlyTimerRef.current = setInterval(() => {
        reportHourly();
        currentHourStartRef.current = new Date();
        currentHourStartRef.current.setMinutes(0, 0, 0);
      }, 3600000);
    }, msUntilNextHour);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    const lbInterval = setInterval(fetchLeaderboard, 60000);
    return () => {
      clearTimeout(initialTimeout);
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
      if (hourlyTimerRef.current) clearInterval(hourlyTimerRef.current);
      clearInterval(lbInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      reportTime();
      reportHourly();
      reportSession();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdNum]);

  function confirmReturn() {
    setShowOverlay(false);
    setLocalStatus("focusing");
    sendWs({ type: "status_change", status: "focusing" });
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    sendWs({ type: "chat", message: text });
    setChatInput("");
  }

  function handleLeave() {
    reportTime();
    reportHourly();
    reportSession();
    setTimeout(() => navigate("/lobby"), 150);
  }

  async function handleDeleteRoom() {
    try {
      await roomsApi.remove(roomIdNum);
      navigate("/lobby");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "删除失败");
    }
  }

  async function performKick(targetUserId: number) {
    setKickingUserId(null);
    try {
      await roomsApi.kick(roomIdNum, targetUserId);
      toast.success(`已踢出 ${displayNameById(targetUserId)}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "操作失败");
    }
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      const input = document.createElement("input");
      input.value = inviteCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFollow(targetUserId: number) {
    try {
      await followApi.follow(targetUserId);
      setAnimatingFollowIds((prev) => new Set(prev).add(targetUserId));
      toast.success("已关注");
      setTimeout(() => {
        setFollowingIds((prev) => new Set(prev).add(targetUserId));
        setAnimatingFollowIds((prev) => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      }, 400);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "关注失败");
    }
  }

  async function handleUnfollow(targetUserId: number) {
    try {
      await followApi.unfollow(targetUserId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
      toast.success("已取消关注");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "取消关注失败");
    }
  }

  return (
    <div className="relative h-screen bg-background">
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0.295_0.018_60/0.88)] px-6 backdrop-blur-md"
          >
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.955_0.030_60)] text-[oklch(0.700_0.115_60)]">
                  <Hourglass className="h-7 w-7" />
                </div>
                <CardTitle className="font-serif text-xl">
                  你刚才离开了页面
                </CardTitle>
                <CardDescription>
                  系统已将你标记为"摸鱼中"并通知了房间内所有人
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm font-semibold text-[oklch(0.700_0.115_60)]">
                  点击下方按钮恢复专注状态
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[oklch(0.580_0.085_135)] text-white hover:bg-[oklch(0.500_0.085_135)]"
                  size="lg"
                  onClick={confirmReturn}
                >
                  我回来了
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLeaveDialog(false)}
          >
            <Card className="w-[360px]">
              <CardHeader>
                <CardTitle>确定退出自习室？</CardTitle>
                <CardDescription>
                  退出后你的专注数据会被保存，下次再来继续。
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleLeave}>保存</Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteDialog(false)}
          >
            <Card className="w-[360px]">
              <CardHeader>
                <CardTitle>删除这个自习室？</CardTitle>
                <CardDescription>
                  所有成员将被移出。此操作不可撤销。
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  取消
                </Button>
                <Button variant="destructive" onClick={handleDeleteRoom}>
                  删除
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {kickingUserId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setKickingUserId(null)}
          >
            <Card className="w-[360px]">
              <CardHeader>
                <CardTitle>踢出该成员？</CardTitle>
                <CardDescription>
                  {displayNameById(kickingUserId)} 将立即被移出自习室。
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setKickingUserId(null)}>
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => performKick(kickingUserId)}
                >
                  确认踢出
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full flex-col">
        <header className="z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3 shadow-sm">
          <div className="flex min-w-[140px] items-center gap-2.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              title="退出房间"
              onClick={() => setShowLeaveDialog(true)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-serif text-base font-semibold text-foreground">
              {roomName || `自习室 #${roomIdNum}`}
            </span>
          </div>

          <div className="flex flex-1 justify-center">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-500",
                  localStatus === "focusing"
                    ? "bg-[oklch(0.580_0.085_135)] animate-pulse"
                    : "bg-[oklch(0.700_0.115_60)] opacity-60",
                )}
              />
              <span className="font-mono text-2xl font-bold tracking-wider tabular-nums">
                {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex min-w-[140px] items-center justify-end gap-2.5">
            {isOwner && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 hover:border-destructive hover:text-destructive"
                title="删除房间"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-dashed border-primary text-primary hover:bg-secondary"
                onClick={copyInviteCode}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="font-mono tracking-[0.15em]">{inviteCode}</span>
              </Button>
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2"
                  >
                    <Badge
                      className="bg-[oklch(0.580_0.085_135)] text-white hover:bg-[oklch(0.580_0.085_135)]"
                    >
                      已复制
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
          <Card className="m-4 mr-0 flex w-[300px] shrink-0 flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="flex items-center gap-2 font-serif text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                在线成员
              </h3>
              <Badge variant="secondary">{members.length}</Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 p-3" ref={chatLogRef}>
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60",
                      m.user_id === userId && "bg-secondary",
                    )}
                  >
                    <Avatar
                      className={cn(
                        "h-9 w-9 ring-[3px]",
                        m.status === "focusing"
                          ? "bg-[oklch(0.945_0.032_135)] ring-[oklch(0.580_0.085_135/0.20)]"
                          : "bg-[oklch(0.955_0.030_60)] ring-[oklch(0.700_0.115_60/0.20)]",
                      )}
                    >
                      <AvatarFallback className="bg-transparent text-xs font-bold text-foreground/70">
                        {avatarText(m.user_id)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">
                          {displayNameById(m.user_id)}
                        </span>
                        {m.user_id === userId && (
                          <Badge
                            variant="default"
                            className="h-4 px-1.5 text-[10px]"
                          >
                            我
                          </Badge>
                        )}
                        {m.user_id === roomOwnerId && (
                          <Badge className="h-4 bg-[oklch(0.955_0.030_60)] px-1.5 text-[10px] text-[oklch(0.700_0.115_60)] hover:bg-[oklch(0.955_0.030_60)]">
                            <Crown className="mr-0.5 h-2.5 w-2.5" />
                            房主
                          </Badge>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          m.status === "focusing"
                            ? "text-[oklch(0.580_0.085_135)]"
                            : "text-[oklch(0.700_0.115_60)]",
                        )}
                      >
                        {m.status === "focusing" ? "专注中" : "摸鱼中"}
                      </span>
                    </div>
                    {isOwner && m.user_id !== userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        title="踢出"
                        onClick={() => setKickingUserId(m.user_id)}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-5 py-10 text-muted-foreground">
                    <Moon className="h-7 w-7 opacity-40" />
                    <span className="text-sm">等待成员加入...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border">
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="flex items-center gap-2 font-serif text-sm font-semibold">
                  <Trophy className="h-4 w-4 text-primary" />
                  今日专注排行
                </h3>
              </div>
              <div className="flex flex-col gap-1 px-3 pb-3">
                {leaderboard.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-5 py-6 text-muted-foreground">
                    <TrendingUp className="h-6 w-6 opacity-40" />
                    <span className="text-xs">暂无数据</span>
                  </div>
                )}
                {leaderboard.map((item, index) => (
                  <div
                    key={item.user_id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                      item.user_id === userId && "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 text-center text-xs font-bold",
                        index === 0 && "text-[oklch(0.700_0.115_60)]",
                        index === 1 && "text-muted-foreground",
                        index === 2 && "text-[oklch(0.560_0.140_28)]",
                        index >= 3 && "text-primary",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate text-sm">
                      {item.nickname || `用户 #${item.user_id}`}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[oklch(0.580_0.085_135)]">
                      {item.total_minutes}m
                    </span>
                    {item.user_id !== userId &&
                      !followingIds.has(item.user_id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-6 rounded-full border-[oklch(0.580_0.085_135)] px-3 text-xs text-[oklch(0.580_0.085_135)] hover:bg-[oklch(0.580_0.085_135)] hover:text-white",
                            animatingFollowIds.has(item.user_id) &&
                              "pointer-events-none scale-50 opacity-0",
                          )}
                          disabled={animatingFollowIds.has(item.user_id)}
                          onClick={() => handleFollow(item.user_id)}
                        >
                          + 关注
                        </Button>
                      )}
                    {item.user_id !== userId &&
                      followingIds.has(item.user_id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 rounded-full border-muted px-3 text-xs text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleUnfollow(item.user_id)}
                        >
                          取关
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="m-4 ml-3 flex flex-1 flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="flex items-center gap-2 font-serif text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-primary" />
                房间消息
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex min-h-full flex-col p-4">
                {chatMessages.length === 0 && (
                  <div className="my-auto flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <MessageCircle className="h-7 w-7 opacity-40" />
                    <span className="text-sm">还没有消息，来说点什么吧</span>
                  </div>
                )}
                <div className="mt-auto flex flex-col gap-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-1.5 text-sm leading-relaxed",
                        msg.user_id === userId
                          ? "self-end bg-secondary text-foreground"
                          : "self-start bg-muted text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "mr-1.5 text-xs font-bold",
                          msg.user_id === userId
                            ? "text-muted-foreground"
                            : "text-primary",
                        )}
                      >
                        {displayNameById(msg.user_id)}
                      </span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="说点什么..."
                className="flex-1 rounded-full bg-card"
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-full"
                disabled={!chatInput.trim()}
                onClick={sendChat}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        <footer className="flex items-center justify-center gap-2 border-t border-border bg-card py-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-500",
              localStatus === "focusing"
                ? "animate-pulse shadow-[0_0_6px_oklch(0.580_0.085_135/0.5)]"
                : "shadow-[0_0_6px_oklch(0.700_0.115_60/0.4)]",
            )}
            style={{
              backgroundColor:
                localStatus === "focusing" ? SAGE : AMBER,
            }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {statusText}
          </span>
        </footer>
      </div>
    </div>
  );
}
