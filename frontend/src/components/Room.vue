<template>
  <div class="relative h-screen bg-background">
    <!-- 全屏摸鱼遮罩 -->
    <Transition
      enter-active-class="transition duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showOverlay"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0.295_0.018_60/0.88)] px-6 backdrop-blur-md"
      >
        <Card class="max-w-md w-full animate-in slide-in-from-bottom-4 duration-400">
          <CardHeader class="text-center">
            <div class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.955_0.024_55)] text-[oklch(0.710_0.110_55)]">
              <Hourglass class="h-7 w-7" />
            </div>
            <CardTitle class="font-serif text-xl">你刚才离开了页面</CardTitle>
            <CardDescription>
              系统已将你标记为"摸鱼中"并通知了房间内所有人
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-center text-sm font-semibold text-[oklch(0.710_0.110_55)]">
              点击下方按钮恢复专注状态
            </p>
          </CardContent>
          <CardFooter>
            <Button
              class="w-full bg-[oklch(0.624_0.090_145)] text-white hover:bg-[oklch(0.560_0.090_145)]"
              size="lg"
              @click="confirmReturn"
            >
              我回来了
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Transition>

    <!-- 房间主界面 -->
    <div class="flex h-full flex-col">
      <!-- 顶部 toolbar -->
      <header class="z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3 shadow-sm">
        <div class="flex min-w-[140px] items-center gap-2.5">
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="outline" size="icon" class="h-9 w-9" title="退出房间">
                <ArrowLeft class="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确定退出自习室？</AlertDialogTitle>
                <AlertDialogDescription>
                  退出后你的专注数据会被保存，下次再来继续。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction @click="handleLeave">退出</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <span class="font-serif text-base font-semibold text-foreground">
            {{ roomInfo?.name || "自习室 #" + roomId }}
          </span>
        </div>

        <!-- 中间：专注计时 -->
        <div class="flex flex-1 justify-center">
          <div class="flex items-center gap-2.5">
            <span
              :class="cn(
                'h-2.5 w-2.5 rounded-full transition-all duration-500',
                localStatus === 'focusing'
                  ? 'bg-[oklch(0.624_0.090_145)] animate-pulse'
                  : 'bg-[oklch(0.710_0.110_55)] opacity-60'
              )"
            ></span>
            <span class="font-mono text-2xl font-bold tracking-wider tabular-nums">
              {{ formattedTime }}
            </span>
          </div>
        </div>

        <!-- 右：邀请码 + 删除（房主） -->
        <div class="flex min-w-[140px] items-center justify-end gap-2.5">
          <AlertDialog v-if="isOwner">
            <AlertDialogTrigger as-child>
              <Button variant="outline" size="icon" class="h-9 w-9 hover:border-destructive hover:text-destructive" title="删除房间">
                <Trash2 class="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除这个自习室？</AlertDialogTitle>
                <AlertDialogDescription>
                  所有成员将被移出。此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  @click="handleDeleteRoom"
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div class="relative">
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 border-dashed border-primary text-primary hover:bg-secondary"
              @click="copyInviteCode"
            >
              <Copy class="h-3.5 w-3.5" />
              <span class="font-mono tracking-[0.15em]">{{ inviteCode }}</span>
            </Button>
            <Transition
              enter-active-class="transition duration-200"
              enter-from-class="opacity-0 -translate-y-1"
              leave-active-class="transition duration-200"
              leave-to-class="opacity-0"
            >
              <Badge
                v-if="copied"
                class="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[oklch(0.624_0.090_145)] text-white hover:bg-[oklch(0.624_0.090_145)]"
              >
                已复制
              </Badge>
            </Transition>
          </div>
        </div>
      </header>

      <!-- 主内容区 -->
      <div class="flex min-h-0 flex-1 gap-0 overflow-hidden">
        <!-- 左：成员列表 + 排行榜 -->
        <Card class="m-4 mr-0 flex w-[300px] shrink-0 flex-col overflow-hidden p-0">
          <div class="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 class="flex items-center gap-2 font-serif text-sm font-semibold">
              <Users class="h-4 w-4 text-primary" />
              在线成员
            </h3>
            <Badge variant="secondary">{{ members.length }}</Badge>
          </div>

          <ScrollArea class="flex-1">
            <div class="flex flex-col gap-1 p-3">
              <TransitionGroup
                enter-active-class="transition duration-250"
                enter-from-class="opacity-0 -translate-x-2"
                leave-active-class="transition duration-200 absolute"
                leave-to-class="opacity-0 translate-x-2"
              >
                <div
                  v-for="m in members"
                  :key="m.user_id"
                  :class="cn(
                    'group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60',
                    m.user_id === userId && 'bg-secondary'
                  )"
                >
                  <Avatar
                    :class="cn(
                      'h-9 w-9 ring-[3px]',
                      m.status === 'focusing'
                        ? 'bg-[oklch(0.945_0.030_145)] ring-[oklch(0.624_0.090_145/0.20)]'
                        : 'bg-[oklch(0.955_0.024_55)] ring-[oklch(0.710_0.110_55/0.20)]'
                    )"
                  >
                    <AvatarFallback class="bg-transparent text-xs font-bold text-foreground/70">
                      {{ avatarText(m) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="flex items-center gap-1.5 text-sm font-medium">
                      <span class="truncate">{{ displayName(m) }}</span>
                      <Badge v-if="m.user_id === userId" variant="default" class="h-4 px-1.5 text-[10px]">我</Badge>
                      <Badge
                        v-if="m.user_id === roomOwnerId"
                        class="h-4 bg-[oklch(0.955_0.024_55)] px-1.5 text-[10px] text-[oklch(0.710_0.110_55)] hover:bg-[oklch(0.955_0.024_55)]"
                      >
                        <Crown class="mr-0.5 h-2.5 w-2.5" />
                        房主
                      </Badge>
                    </span>
                    <span
                      :class="cn(
                        'text-xs font-medium',
                        m.status === 'focusing'
                          ? 'text-[oklch(0.624_0.090_145)]'
                          : 'text-[oklch(0.710_0.110_55)]'
                      )"
                    >
                      {{ m.status === "focusing" ? "专注中" : "摸鱼中" }}
                    </span>
                  </div>
                  <AlertDialog v-if="isOwner && m.user_id !== userId">
                    <AlertDialogTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        title="踢出"
                      >
                        <UserX class="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>踢出该成员？</AlertDialogTitle>
                        <AlertDialogDescription>
                          {{ displayName(m) }} 将立即被移出自习室。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          @click="performKick(m.user_id)"
                        >
                          确认踢出
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TransitionGroup>

              <div
                v-if="members.length === 0"
                class="flex flex-col items-center gap-2 px-5 py-10 text-muted-foreground"
              >
                <Moon class="h-7 w-7 opacity-40" />
                <span class="text-sm">等待成员加入...</span>
              </div>
            </div>
          </ScrollArea>

          <!-- 房间内排行榜 -->
          <div class="border-t border-border">
            <div class="flex items-center justify-between px-5 py-3">
              <h3 class="flex items-center gap-2 font-serif text-sm font-semibold">
                <Trophy class="h-4 w-4 text-primary" />
                今日专注排行
              </h3>
            </div>
            <div class="flex flex-col gap-1 px-3 pb-3">
              <div
                v-if="roomLeaderboard.length === 0"
                class="flex flex-col items-center gap-2 px-5 py-6 text-muted-foreground"
              >
                <TrendingUp class="h-6 w-6 opacity-40" />
                <span class="text-xs">暂无数据</span>
              </div>
              <div
                v-for="(item, index) in roomLeaderboard"
                :key="item.user_id"
                :class="cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                  item.user_id === userId && 'bg-secondary'
                )"
              >
                <span
                  :class="cn(
                    'w-5 text-center text-xs font-bold',
                    index === 0 && 'text-[oklch(0.710_0.110_55)]',
                    index === 1 && 'text-muted-foreground',
                    index === 2 && 'text-[oklch(0.598_0.106_25)]',
                    index >= 3 && 'text-primary'
                  )"
                >
                  {{ index + 1 }}
                </span>
                <span class="flex-1 truncate text-sm">
                  {{ item.nickname || "用户 #" + item.user_id }}
                </span>
                <span class="font-mono text-xs font-semibold text-[oklch(0.624_0.090_145)]">
                  {{ item.total_minutes }}m
                </span>
                <Button
                  v-if="item.user_id !== userId && !isFollowing(item.user_id)"
                  size="sm"
                  variant="outline"
                  :class="cn(
                    'h-6 rounded-full border-[oklch(0.624_0.090_145)] px-3 text-xs text-[oklch(0.624_0.090_145)] hover:bg-[oklch(0.624_0.090_145)] hover:text-white',
                    animatingFollowIds.has(item.user_id) && 'pointer-events-none scale-50 opacity-0'
                  )"
                  :disabled="animatingFollowIds.has(item.user_id)"
                  @click="handleFollow(item.user_id)"
                >
                  + 关注
                </Button>
                <Button
                  v-else-if="item.user_id !== userId && isFollowing(item.user_id)"
                  size="sm"
                  variant="outline"
                  class="h-6 rounded-full border-muted px-3 text-xs text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                  @click="handleUnfollow(item.user_id)"
                >
                  取关
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <!-- 右：聊天 -->
        <Card class="m-4 ml-3 flex flex-1 flex-col overflow-hidden p-0">
          <div class="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 class="flex items-center gap-2 font-serif text-sm font-semibold">
              <MessageCircle class="h-4 w-4 text-primary" />
              房间消息
            </h3>
          </div>
          <ScrollArea class="flex-1" ref="chatScrollRef">
            <div class="flex min-h-full flex-col p-4" ref="chatLogRef">
              <div
                v-if="chatMessages.length === 0"
                class="my-auto flex flex-col items-center gap-2 py-10 text-muted-foreground"
              >
                <MessageCircle class="h-7 w-7 opacity-40" />
                <span class="text-sm">还没有消息，来说点什么吧</span>
              </div>
              <TransitionGroup
                enter-active-class="transition duration-200"
                enter-from-class="opacity-0 translate-y-1"
                tag="div"
                class="mt-auto flex flex-col gap-1"
              >
                <div
                  v-for="(msg, i) in chatMessages"
                  :key="i"
                  :class="cn(
                    'max-w-[80%] rounded-lg px-3 py-1.5 text-sm leading-relaxed',
                    msg.user_id === userId
                      ? 'self-end bg-secondary text-foreground'
                      : 'self-start bg-muted text-foreground'
                  )"
                >
                  <span
                    :class="cn(
                      'mr-1.5 text-xs font-bold',
                      msg.user_id === userId ? 'text-muted-foreground' : 'text-primary'
                    )"
                  >
                    {{ displayNameById(msg.user_id) }}
                  </span>
                  <span>{{ msg.message }}</span>
                </div>
              </TransitionGroup>
            </div>
          </ScrollArea>
          <div class="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-3">
            <Input
              v-model="chatInput"
              placeholder="说点什么..."
              class="flex-1 rounded-full bg-card"
              @keyup.enter="sendChat"
            />
            <Button
              size="icon"
              class="h-10 w-10 rounded-full"
              :disabled="!chatInput.trim()"
              @click="sendChat"
            >
              <Send class="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <!-- 底部状态条 -->
      <footer class="flex items-center justify-center gap-2 border-t border-border bg-card py-2">
        <span
          :class="cn(
            'h-2 w-2 rounded-full transition-all duration-500',
            localStatus === 'focusing'
              ? 'bg-[oklch(0.624_0.090_145)] shadow-[0_0_6px_oklch(0.624_0.090_145/0.5)] animate-pulse'
              : 'bg-[oklch(0.710_0.110_55)] shadow-[0_0_6px_oklch(0.710_0.110_55/0.4)]'
          )"
        ></span>
        <span class="text-sm font-medium text-muted-foreground">{{ statusText }}</span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import {
  ArrowLeft,
  Trash2,
  Copy,
  Users,
  Crown,
  UserX,
  Moon,
  Trophy,
  TrendingUp,
  MessageCircle,
  Send,
  Hourglass,
} from "@lucide/vue";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";

import { wsUrl, api } from "@/utils/api.js";
import { cn } from "@/lib/utils.js";

const props = defineProps({
  roomId: { type: Number, required: true },
  userId: { type: Number, required: true },
  inviteCode: { type: String, default: "" },
});
const emit = defineEmits(["leave"]);

// ============================================================
// 响应式状态（与原 Room.vue 一致）
// ============================================================
const localStatus = ref("focusing");
const copied = ref(false);
const showOverlay = ref(false);
const focusSeconds = ref(0);
const members = ref([]);
const chatMessages = ref([]);
const chatInput = ref("");
const chatLogRef = ref(null);
const ws = ref(null);
const roomInfo = ref(null);
const roomOwnerId = ref(null);
const roomLeaderboard = ref([]);
const followingIds = ref(new Set());
const animatingFollowIds = ref(new Set());

// 非响应式数据采集 state（与原 Room.vue 一致）
let awayCount = 0;
let awayStartTime = null;
let totalAwaySeconds = 0;
let sessionStartTime = Date.now();
let currentHourFocus = 0;
let currentHourStart = null;
let hourlyReportTimer = null;
let graceTimer = null;
let heartbeatTimer = null;
let focusTimer = null;

// ============================================================
// Computed
// ============================================================
const isOwner = computed(() => roomOwnerId.value === props.userId);

const statusText = computed(() => {
  if (localStatus.value === "focusing") return "专注中";
  if (localStatus.value === "overlay") return "摸鱼中（待确认）";
  return "摸鱼中";
});

const formattedTime = computed(() => {
  const s = focusSeconds.value;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
});

// 优先从 leaderboard 数据里查 nickname；查不到 fallback 为 "用户 #N"
function displayNameById(uid) {
  const found = roomLeaderboard.value.find((it) => it.user_id === uid);
  return found?.nickname || `用户 #${uid}`;
}
function displayName(m) {
  return displayNameById(m.user_id);
}
function avatarText(m) {
  const name = displayNameById(m.user_id);
  // 中文取首字符；英文取大写首字
  return name.replace(/^用户\s*#/, "").charAt(0).toUpperCase() || String(m.user_id).slice(-2);
}

// ============================================================
// 房间信息
// ============================================================
async function fetchRoomInfo() {
  try {
    const data = await api(`/rooms/${props.roomId}`);
    roomInfo.value = data;
    roomOwnerId.value = data.owner_id;
  } catch {}
}

// ============================================================
// WebSocket（连接 + 心跳 + 重连 + 消息分发）
// ============================================================
function connectWS() {
  const url = wsUrl(`/rooms/${props.roomId}/ws?user_id=${props.userId}`);
  ws.value = new WebSocket(url);
  ws.value.onopen = () => {
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, 10000);
  };
  ws.value.onmessage = (event) => {
    try {
      handleMessage(JSON.parse(event.data));
    } catch {}
  };
  ws.value.onclose = (event) => {
    clearInterval(heartbeatTimer);
    if (event.code !== 1000) setTimeout(connectWS, 3000);
  };
}

function handleMessage(msg) {
  switch (msg.type) {
    case "room_state":
      members.value = msg.members || [];
      break;
    case "user_join":
      members.value = members.value.filter((m) => m.user_id !== msg.user_id);
      members.value.push({ user_id: msg.user_id, status: msg.status || "focusing" });
      break;
    case "user_leave":
      members.value = members.value.filter((m) => m.user_id !== msg.user_id);
      break;
    case "user_status":
      members.value = members.value.map((m) =>
        m.user_id === msg.user_id ? { ...m, status: msg.status } : m
      );
      break;
    case "chat":
      chatMessages.value.push({ user_id: msg.user_id, message: msg.message });
      scrollChat();
      break;
    case "room_deleted":
      toast.error("房间已被房主删除");
      setTimeout(() => emit("leave"), 1200);
      break;
    case "kicked":
      toast.error("你被房主移出了房间");
      setTimeout(() => emit("leave"), 1200);
      break;
  }
}

function send(data) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify(data));
  }
}

function sendHeartbeat() {
  send({ type: "heartbeat", ts: Date.now() });
}

function sendStatus(status) {
  send({ type: "status_change", status });
}

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  send({ type: "chat", message: text });
  chatInput.value = "";
}

function scrollChat() {
  nextTick(() => {
    if (chatLogRef.value) {
      // scrollArea inner — 使用 DOM 滚到底
      const scrollContainer = chatLogRef.value.closest("[data-radix-scroll-area-viewport],[data-reka-scroll-area-viewport]")
        || chatLogRef.value.parentElement;
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });
}

// ============================================================
// 切屏检测（10s 宽限）
// ============================================================
function onVisibilityChange() {
  if (document.hidden) {
    awayCount++;
    awayStartTime = Date.now();
    clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      localStatus.value = "away";
      sendStatus("away");
    }, 10000);
  } else {
    clearTimeout(graceTimer);
    if (awayStartTime) {
      totalAwaySeconds += (Date.now() - awayStartTime) / 1000;
      awayStartTime = null;
    }
    if (localStatus.value === "away") {
      showOverlay.value = true;
      localStatus.value = "overlay";
    }
  }
}

function confirmReturn() {
  showOverlay.value = false;
  localStatus.value = "focusing";
  sendStatus("focusing");
}

// ============================================================
// 专注计时（1s tick）
// ============================================================
function startFocusTimer() {
  focusTimer = setInterval(() => {
    if (localStatus.value === "focusing") {
      focusSeconds.value++;
      currentHourFocus++;
    }
  }, 1000);
}

// ============================================================
// 数据上报（focus / hourly / session）
// ============================================================
function reportTime() {
  if (focusSeconds.value > 0) {
    api("/focus/report", {
      method: "POST",
      body: JSON.stringify({
        room_id: props.roomId,
        total_focus_seconds: focusSeconds.value,
      }),
    }).catch(() => {});
    focusSeconds.value = 0;
  }
}

function reportHourlyFocus() {
  if (currentHourFocus > 0 && currentHourStart) {
    api("/focus/hourly", {
      method: "POST",
      body: JSON.stringify({
        room_id: props.roomId,
        hour_start: currentHourStart.toISOString(),
        duration_seconds: currentHourFocus,
      }),
    }).catch(() => {});
    currentHourFocus = 0;
  }
}

function reportSession() {
  const totalSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
  api("/focus/session", {
    method: "POST",
    body: JSON.stringify({
      room_id: props.roomId,
      total_seconds: totalSeconds,
      away_seconds: Math.floor(totalAwaySeconds),
      away_count: awayCount,
    }),
  }).catch(() => {});
}

function scheduleHourlyReport() {
  const now = new Date();
  currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);

  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const msUntilNextHour = nextHour - now;

  setTimeout(() => {
    reportHourlyFocus();
    currentHourStart = new Date();
    currentHourStart.setMinutes(0, 0, 0);
    hourlyReportTimer = setInterval(() => {
      reportHourlyFocus();
      currentHourStart = new Date();
      currentHourStart.setMinutes(0, 0, 0);
    }, 3600000);
  }, msUntilNextHour);
}

// ============================================================
// Leaderboard + Following
// ============================================================
async function fetchRoomLeaderboard() {
  try {
    const data = await api(`/rooms/${props.roomId}/leaderboard`);
    roomLeaderboard.value = data.items || [];
  } catch {}
}

async function fetchFollowing() {
  try {
    const data = await api("/follow/following");
    followingIds.value = new Set((data.users || []).map((u) => u.user_id));
  } catch {}
}

async function handleFollow(targetUserId) {
  try {
    await api(`/follow/${targetUserId}`, { method: "POST" });
    animatingFollowIds.value.add(targetUserId);
    toast.success("已关注");
    setTimeout(() => {
      followingIds.value.add(targetUserId);
      animatingFollowIds.value.delete(targetUserId);
    }, 400);
  } catch (e) {
    toast.error(e.data?.detail || "关注失败");
  }
}

async function handleUnfollow(targetUserId) {
  try {
    await api(`/follow/${targetUserId}`, { method: "DELETE" });
    followingIds.value.delete(targetUserId);
    toast.success("已取消关注");
  } catch (e) {
    toast.error(e.data?.detail || "取消关注失败");
  }
}

function isFollowing(userId) {
  return followingIds.value.has(userId);
}

// ============================================================
// 房间操作（退出/删除/踢人/复制邀请码）
// ============================================================
function handleLeave() {
  reportTime();
  reportHourlyFocus();
  reportSession();
  setTimeout(() => emit("leave"), 150);
}

async function handleDeleteRoom() {
  try {
    await api(`/rooms/${props.roomId}`, { method: "DELETE" });
  } catch (e) {
    toast.error(e.data?.detail || "删除失败");
    return;
  }
  emit("leave");
}

async function performKick(targetUserId) {
  try {
    await api(`/rooms/${props.roomId}/kick/${targetUserId}`, { method: "POST" });
    toast.success(`已踢出 ${displayNameById(targetUserId)}`);
  } catch (e) {
    toast.error(e.data?.detail || "操作失败");
  }
}

async function copyInviteCode() {
  try {
    await navigator.clipboard.writeText(props.inviteCode);
  } catch {
    // navigator.clipboard 在非 https 或权限缺失场景下失败 — 用 execCommand 兜底
    const input = document.createElement("input");
    input.value = props.inviteCode;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

// ============================================================
// 页面关闭前 sendBeacon 兜底上报（无阻塞）
// ============================================================
function onBeforeUnload() {
  const token = localStorage.getItem("token");
  if (focusSeconds.value > 0) {
    const blob = new Blob(
      [JSON.stringify({ room_id: props.roomId, total_focus_seconds: focusSeconds.value })],
      { type: "application/json" }
    );
    navigator.sendBeacon(`http://localhost:8000/focus/report?token=${token}`, blob);
    focusSeconds.value = 0;
  }
  const totalSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
  const sessionBlob = new Blob(
    [
      JSON.stringify({
        room_id: props.roomId,
        total_seconds: totalSeconds,
        away_seconds: Math.floor(totalAwaySeconds),
        away_count: awayCount,
      }),
    ],
    { type: "application/json" }
  );
  navigator.sendBeacon(`http://localhost:8000/focus/session?token=${token}`, sessionBlob);
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  fetchRoomInfo();
  connectWS();
  startFocusTimer();
  scheduleHourlyReport();
  fetchRoomLeaderboard();
  fetchFollowing();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", onBeforeUnload);
});

onUnmounted(() => {
  clearTimeout(graceTimer);
  clearInterval(heartbeatTimer);
  clearInterval(focusTimer);
  clearInterval(hourlyReportTimer);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("beforeunload", onBeforeUnload);
  reportTime();
  reportHourlyFocus();
  reportSession();
  if (ws.value) {
    ws.value.onclose = null;
    ws.value.close();
  }
});
</script>
