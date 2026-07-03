import { BarChart3, CalendarDays, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatsResponse } from "@/types/api";

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const defaultStats: StatsResponse = {
  today_minutes: 0,
  week_minutes: 0,
  month_minutes: 0,
  today_goal: 120,
  today_progress: 0,
};

export default function StatsCards({ stats }: { stats?: StatsResponse }) {
  const s = stats || defaultStats;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-start gap-3.5 pt-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {formatMinutes(s.today_minutes)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              今日专注
            </span>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[oklch(0.580_0.085_135)] transition-all duration-500"
                style={{ width: `${Math.min(100, s.today_progress * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              目标 {s.today_goal} 分钟
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-start gap-3.5 pt-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {formatMinutes(s.week_minutes)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              本周专注
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-start gap-3.5 pt-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {formatMinutes(s.month_minutes)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              本月专注
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
