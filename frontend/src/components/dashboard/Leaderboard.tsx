import { Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { LeaderboardItem } from "@/types/api";
import { useAuthStore } from "@/stores/authStore";

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function rankClass(index: number) {
  if (index === 0) return "bg-[oklch(0.700_0.115_60)] text-white";
  if (index === 1) return "bg-muted text-muted-foreground";
  if (index === 2) return "bg-[oklch(0.560_0.140_28/0.8)] text-white";
  return "bg-muted text-muted-foreground";
}

export default function Leaderboard({
  items,
  period,
  onChangePeriod,
}: {
  items: LeaderboardItem[];
  period: "weekly" | "monthly";
  onChangePeriod: (p: "weekly" | "monthly") => void;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <Trophy className="h-4 w-4 text-primary" />
          专注排行榜
        </CardTitle>
        <Tabs
          value={period}
          onValueChange={(v) => onChangePeriod(v as "weekly" | "monthly")}
        >
          <TabsList className="h-8 relative">
            <div
              className="absolute inset-y-0 left-0 bg-background shadow-sm rounded-md transition-[transform] duration-300 ease-in-out pointer-events-none"
              style={{
                width: "50%",
                transform:
                  period === "weekly"
                    ? "translateX(0%)"
                    : "translateX(100%)",
              }}
            />
            <TabsTrigger
              value="weekly"
              className="text-xs relative z-10 data-[state=active]:text-foreground"
            >
              周榜
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="text-xs relative z-10 data-[state=active]:text-foreground"
            >
              月榜
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-muted-foreground">
            <Trophy className="h-8 w-8 opacity-40" />
            <span className="text-sm">暂无排行数据</span>
            <span className="text-xs">关注好友后可以看到排行</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div
                key={item.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40",
                  item.user_id === currentUserId && "bg-secondary",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    rankClass(index),
                  )}
                >
                  {index + 1}
                </div>
                <span className="flex-1 truncate text-sm font-medium">
                  {item.nickname || `用户 #${item.user_id}`}
                </span>
                <span className="font-mono text-sm font-semibold text-[oklch(0.580_0.085_135)]">
                  {formatMinutes(item.total_minutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
