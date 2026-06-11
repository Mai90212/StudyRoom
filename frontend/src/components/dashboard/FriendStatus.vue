<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle class="flex items-center gap-2 font-serif text-base">
        <Users class="h-4 w-4 text-primary" />
        好友状态
      </CardTitle>
      <Button variant="outline" size="icon" class="h-8 w-8" title="刷新" @click="emit('refresh')">
        <RefreshCw class="h-3.5 w-3.5" />
      </Button>
    </CardHeader>
    <CardContent>
      <div
        v-if="users.length === 0"
        class="flex flex-col items-center gap-2 px-5 py-10 text-muted-foreground"
      >
        <UsersRound class="h-8 w-8 opacity-40" />
        <span class="text-sm">还没有关注的好友</span>
        <span class="text-xs">在房间内关注其他用户</span>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="u in users"
          :key="u.user_id"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
        >
          <span
            :class="cn(
              'h-2.5 w-2.5 shrink-0 rounded-full',
              u.is_online
                ? 'bg-[oklch(0.580_0.085_135)] shadow-[0_0_6px_oklch(0.580_0.085_135/0.5)] animate-pulse'
                : 'bg-muted-foreground/40'
            )"
          ></span>
          <Avatar class="h-8 w-8 shrink-0">
            <AvatarFallback class="bg-secondary text-xs text-primary">
              {{ initial(u.nickname) }}
            </AvatarFallback>
          </Avatar>
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium">
              {{ u.nickname || "用户 #" + u.user_id }}
            </span>
            <span
              :class="cn(
                'text-xs',
                u.is_online ? 'text-[oklch(0.580_0.085_135)]' : 'text-muted-foreground'
              )"
            >
              {{ u.is_online ? "在线" : "离线" }}
            </span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                title="取消关注"
              >
                <X class="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>取消关注？</AlertDialogTitle>
                <AlertDialogDescription>
                  不再关注 {{ u.nickname || "用户 #" + u.user_id }}。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction @click="handleUnfollow(u.user_id)">确认</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Users, UsersRound, RefreshCw, X } from "@lucide/vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { api } from "@/utils/api.js";
import { cn } from "@/lib/utils.js";

defineProps({
  users: { type: Array, default: () => [] },
});

const emit = defineEmits(["refresh"]);

function initial(name) {
  return (name || "U").charAt(0).toUpperCase();
}

async function handleUnfollow(userId) {
  try {
    await api(`/follow/${userId}`, { method: "DELETE" });
    toast.success("已取消关注");
    emit("refresh");
  } catch (e) {
    toast.error(e.data?.detail || "取消关注失败");
  }
}
</script>
