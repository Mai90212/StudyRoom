import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart3,
  BookOpenText,
  Bookmark,
  ChevronDown,
  KeyRound,
  Loader2,
  LogOut,
  Minus,
  Plus,
  Sparkles,
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

import { useAuthStore } from "@/stores/authStore";
import {
  useCreateRoom,
  useJoinRoom,
  useMyRooms,
} from "@/hooks/useRooms";
import { cn } from "@/lib/utils";
import type { MyRoom } from "@/types/api";

export default function LobbyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: myRooms, isLoading } = useMyRooms();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [createName, setCreateName] = useState("深夜自习室");
  const [createMax, setCreateMax] = useState(10);
  const [joinCode, setJoinCode] = useState("");

  const avatarLetter = (user?.nickname || "U").charAt(0).toUpperCase();

  function onCodeInput(v: string) {
    setJoinCode(v.replace(/[^A-Za-z0-9]/g, ""));
  }

  function enterRoom(room: MyRoom) {
    navigate(`/room/${room.id}`);
  }

  async function handleCreate() {
    if (!createName.trim()) {
      toast.error("房间名称不能为空");
      return;
    }
    try {
      const data = await createRoom.mutateAsync({
        name: createName,
        max_members: createMax,
      });
      navigate(`/room/${data.id}`);
    } catch {
      // toast handled in hook
    }
  }

  async function handleJoin() {
    if (joinCode.length < 6) return;
    try {
      const data = await joinRoom.mutateAsync({ invite_code: joinCode });
      navigate(`/room/${data.id}`);
    } catch {
      // toast handled in hook
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-5 py-8">
      <header className="mb-9 flex animate-fade-in items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
            <BookOpenText className="h-5 w-5" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-primary">
            在线自习室
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {user?.nickname || "用户"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>{user?.nickname}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>专注数据</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {myRooms && myRooms.length > 0 && (
        <section className="mb-8 animate-slide-up">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-base font-bold text-foreground">
            <Bookmark className="h-4 w-4 text-primary" />
            我的自习室
          </h2>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {myRooms.map((room) => (
              <Card
                key={room.id}
                className={cn(
                  "cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  room.is_owner && "border-l-[3px] border-l-primary",
                )}
                onClick={() => enterRoom(room)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Badge
                    variant={room.is_owner ? "default" : "secondary"}
                    className="px-2 py-0 text-[10px]"
                  >
                    {room.is_owner ? "房主" : "成员"}
                  </Badge>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      room.online_count > 0
                        ? "text-[oklch(0.580_0.085_135)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        room.online_count > 0
                          ? "bg-[oklch(0.580_0.085_135)] animate-pulse"
                          : "bg-muted-foreground/50",
                      )}
                    />
                    {room.online_count} 在线
                  </span>
                </div>
                <h3 className="mb-2 truncate font-serif text-base font-bold">
                  {room.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono tracking-wider">
                    {room.invite_code}
                  </span>
                  <span>
                    {room.member_count}/{room.max_members} 人
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {isLoading && (
        <section className="mb-8">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="font-serif">创建房间</CardTitle>
            <CardDescription>
              创建一个新的自习室，邀请朋友们一起学习
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name">房间名称</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="给房间取个名字"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-max">人数上限</Label>
              <div className="flex w-fit items-center overflow-hidden rounded-md border border-input">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  disabled={createMax <= 2}
                  onClick={() => setCreateMax((m) => Math.max(2, m - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex h-10 w-14 items-center justify-center bg-card font-bold text-primary">
                  {createMax}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  disabled={createMax >= 20}
                  onClick={() => setCreateMax((m) => Math.min(20, m + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={createRoom.isPending || !createName.trim()}
              onClick={handleCreate}
            >
              {createRoom.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>{createRoom.isPending ? "创建中..." : "创建房间"}</span>
            </Button>
          </CardFooter>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="font-serif">加入房间</CardTitle>
            <CardDescription>输入邀请码，加入朋友的自习室</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="join-code">邀请码</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => onCodeInput(e.target.value)}
                placeholder="输入 6 位邀请码"
                maxLength={6}
                className="text-center font-mono text-xl font-semibold tracking-[0.4em]"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={joinCode.length < 6 || joinRoom.isPending}
              onClick={handleJoin}
            >
              {joinRoom.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>{joinRoom.isPending ? "加入中..." : "加入房间"}</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
