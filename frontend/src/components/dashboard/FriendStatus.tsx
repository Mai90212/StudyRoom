import { RefreshCw, Users, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { followApi } from "@/api/follow";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FollowUserItem } from "@/types/api";

function initial(name: string) {
  return (name || "U").charAt(0).toUpperCase();
}

export default function FriendStatus({
  users,
  onRefresh,
}: {
  users: FollowUserItem[];
  onRefresh: () => void;
}) {
  async function handleUnfollow(userId: number) {
    try {
      await followApi.unfollow(userId);
      toast.success("已取消关注");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "取消关注失败");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <Users className="h-4 w-4 text-primary" />
          好友状态
        </CardTitle>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="刷新"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-muted-foreground">
            <UsersRound className="h-8 w-8 opacity-40" />
            <span className="text-sm">还没有关注的好友</span>
            <span className="text-xs">在房间内关注其他用户</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div
                key={u.user_id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    u.is_online
                      ? "bg-[oklch(0.580_0.085_135)] shadow-[0_0_6px_oklch(0.580_0.085_135/0.5)] animate-pulse"
                      : "bg-muted-foreground/40",
                  )}
                />
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-xs text-primary">
                    {initial(u.nickname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {u.nickname || `用户 #${u.user_id}`}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      u.is_online
                        ? "text-[oklch(0.580_0.085_135)]"
                        : "text-muted-foreground",
                    )}
                  >
                    {u.is_online ? "在线" : "离线"}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      title="取消关注"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>取消关注？</AlertDialogTitle>
                      <AlertDialogDescription>
                        不再关注 {u.nickname || `用户 #${u.user_id}`}。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUnfollow(u.user_id)}
                      >
                        确认
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
