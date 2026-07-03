import { CheckCircle2, Flame, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StreakResponse } from "@/types/api";

const defaultStreak: StreakResponse = {
  current_streak: 0,
  longest_streak: 0,
  today_done: false,
};

export default function StreakBadge({ streak }: { streak?: StreakResponse }) {
  const s = streak || defaultStreak;
  return (
    <Card>
      <CardContent className="flex items-center gap-5 pt-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.955_0.030_60)] text-[oklch(0.700_0.115_60)]">
          <Flame className="h-7 w-7" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-4xl font-bold tabular-nums">
              {s.current_streak}
            </span>
            <span className="text-sm text-muted-foreground">天</span>
          </div>
          <span className="text-xs text-muted-foreground">当前连胜</span>
        </div>
        <Separator orientation="vertical" className="mx-1 h-12" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">最长连胜:</span>
            <span className="font-mono text-sm font-semibold">
              {s.longest_streak} 天
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">今日打卡:</span>
            {s.today_done ? (
              <span className="flex items-center gap-1 text-sm font-medium text-[oklch(0.580_0.085_135)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                已完成
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-medium text-[oklch(0.700_0.115_60)]">
                <Hourglass className="h-3.5 w-3.5" />
                进行中
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
