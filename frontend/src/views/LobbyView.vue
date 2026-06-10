<template>
  <div class="mx-auto min-h-screen max-w-5xl px-5 py-8">
    <!-- Header -->
    <header class="mb-9 flex animate-in fade-in items-center justify-between duration-500">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
          <BookOpenText class="h-5 w-5" />
        </div>
        <h1 class="font-serif text-2xl font-bold tracking-wide text-primary">在线自习室</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="gap-2">
            <Avatar class="h-5 w-5">
              <AvatarFallback class="text-[10px]">{{ avatarLetter }}</AvatarFallback>
            </Avatar>
            <span class="font-medium">{{ user?.nickname || "用户" }}</span>
            <ChevronDown class="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuLabel>{{ user?.email }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="goToDashboard">
            <BarChart3 class="mr-2 h-4 w-4" />
            <span>专注数据</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>

    <!-- 我的自习室 -->
    <section v-if="myRooms.length > 0" class="mb-8 animate-in slide-in-from-bottom-2 duration-500">
      <h2 class="mb-4 flex items-center gap-2 font-serif text-base font-bold text-foreground">
        <Bookmark class="h-4 w-4 text-primary" />
        我的自习室
      </h2>
      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
        <Card
          v-for="room in myRooms"
          :key="room.id"
          :class="cn(
            'cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
            room.is_owner && 'border-l-[3px] border-l-primary'
          )"
          @click="enterRoom(room)"
        >
          <div class="mb-2 flex items-center justify-between">
            <Badge :variant="room.is_owner ? 'default' : 'secondary'" class="px-2 py-0 text-[10px]">
              {{ room.is_owner ? "房主" : "成员" }}
            </Badge>
            <span
              :class="cn(
                'flex items-center gap-1 text-xs',
                room.online_count > 0 ? 'text-[oklch(0.624_0.090_145)]' : 'text-muted-foreground'
              )"
            >
              <span
                :class="cn(
                  'h-1.5 w-1.5 rounded-full',
                  room.online_count > 0 ? 'bg-[oklch(0.624_0.090_145)] animate-pulse' : 'bg-muted-foreground/50'
                )"
              ></span>
              {{ room.online_count }} 在线
            </span>
          </div>
          <h3 class="mb-2 truncate font-serif text-base font-bold">{{ room.name }}</h3>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span class="font-mono tracking-wider">{{ room.invite_code }}</span>
            <span>{{ room.member_count }}/{{ room.max_members }} 人</span>
          </div>
        </Card>
      </div>
    </section>

    <!-- Skeleton（加载态） -->
    <section v-else-if="loading" class="mb-8">
      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
        <Skeleton v-for="i in 3" :key="i" class="h-[120px] w-full" />
      </div>
    </section>

    <!-- 创建 / 加入 -->
    <div class="grid gap-6 md:grid-cols-2">
      <Card class="animate-in slide-in-from-bottom-4 duration-500" style="animation-delay: 0ms">
        <CardHeader>
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <Sparkles class="h-5 w-5" />
          </div>
          <CardTitle class="font-serif">创建房间</CardTitle>
          <CardDescription>创建一个新的自习室，邀请朋友们一起学习</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <Label for="create-name">房间名称</Label>
            <Input
              id="create-name"
              v-model="createName"
              placeholder="给房间取个名字"
              @keyup.enter="handleCreate"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="create-max">人数上限</Label>
            <div class="flex w-fit items-center overflow-hidden rounded-md border border-input">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-10 w-10 rounded-none"
                :disabled="createMax <= 2"
                @click="createMax = Math.max(2, createMax - 1)"
              >
                <Minus class="h-4 w-4" />
              </Button>
              <div class="flex h-10 w-14 items-center justify-center bg-card font-bold text-primary">
                {{ createMax }}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-10 w-10 rounded-none"
                :disabled="createMax >= 20"
                @click="createMax = Math.min(20, createMax + 1)"
              >
                <Plus class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full" :disabled="creating || !createName.trim()" @click="handleCreate">
            <Loader2 v-if="creating" class="h-4 w-4 animate-spin" />
            <span>{{ creating ? "创建中..." : "创建房间" }}</span>
          </Button>
        </CardFooter>
      </Card>

      <Card class="animate-in slide-in-from-bottom-4 duration-500" style="animation-delay: 100ms">
        <CardHeader>
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <KeyRound class="h-5 w-5" />
          </div>
          <CardTitle class="font-serif">加入房间</CardTitle>
          <CardDescription>输入邀请码，加入朋友的自习室</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-1.5">
            <Label for="join-code">邀请码</Label>
            <Input
              id="join-code"
              v-model="joinCode"
              placeholder="输入 6 位邀请码"
              maxlength="6"
              class="text-center font-mono text-xl font-semibold uppercase tracking-[0.4em]"
              @keyup.enter="handleJoin"
              @input="onCodeInput"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full" :disabled="joinCode.length < 6 || joining" @click="handleJoin">
            <Loader2 v-if="joining" class="h-4 w-4 animate-spin" />
            <span>{{ joining ? "加入中..." : "加入房间" }}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { BookOpenText, Bookmark, Sparkles, KeyRound, Minus, Plus, Loader2, ChevronDown, BarChart3, LogOut } from "@lucide/vue";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";

import { api, clearToken } from "@/utils/api.js";
import { cn } from "@/lib/utils.js";

const router = useRouter();

const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
const createName = ref("深夜自习室");
const createMax = ref(10);
const joinCode = ref("");
const creating = ref(false);
const joining = ref(false);
const loading = ref(true);
const myRooms = ref([]);

const avatarLetter = computed(() => {
  const n = user.value?.nickname || "U";
  return n.charAt(0).toUpperCase();
});

function onCodeInput() {
  joinCode.value = joinCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function fetchMyRooms() {
  try {
    myRooms.value = await api("/rooms/my");
  } catch {
    /* 401 → api.js 已处理；其他错误静默 */
  } finally {
    loading.value = false;
  }
}

function enterRoom(room) {
  router.push({ name: "room", query: { roomId: room.id, inviteCode: room.invite_code } });
}

async function handleCreate() {
  if (!createName.value.trim()) {
    toast.error("房间名称不能为空");
    return;
  }
  creating.value = true;
  try {
    const data = await api("/rooms", {
      method: "POST",
      body: JSON.stringify({ name: createName.value, max_members: +createMax.value }),
    });
    router.push({ name: "room", query: { roomId: data.id, inviteCode: data.invite_code } });
  } catch (e) {
    toast.error(e.data?.detail || e.message || "创建失败");
  } finally {
    creating.value = false;
  }
}

async function handleJoin() {
  joining.value = true;
  try {
    const data = await api("/rooms/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: joinCode.value }),
    });
    router.push({ name: "room", query: { roomId: data.id, inviteCode: data.invite_code } });
  } catch (e) {
    toast.error(e.data?.detail || e.message || "加入失败");
  } finally {
    joining.value = false;
  }
}

function handleLogout() {
  clearToken();
  router.push("/");
}

function goToDashboard() {
  router.push("/dashboard");
}

onMounted(fetchMyRooms);
</script>
