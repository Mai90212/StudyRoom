import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import StatsCards from "@/components/dashboard/StatsCards";
import Heatmap from "@/components/dashboard/Heatmap";
import DistributionChart from "@/components/dashboard/DistributionChart";
import ScoreGauge from "@/components/dashboard/ScoreGauge";
import StreakBadge from "@/components/dashboard/StreakBadge";
import FriendStatus from "@/components/dashboard/FriendStatus";
import Leaderboard from "@/components/dashboard/Leaderboard";

import {
  useDistribution,
  useHeatmap,
  useScore,
  useStats,
  useStreak,
} from "@/hooks/useDashboard";
import { useFollowing } from "@/hooks/useFollow";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";

type TabValue = "stats" | "friends" | "leaderboard";
const tabOrder: TabValue[] = ["stats", "friends", "leaderboard"];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>("stats");
  const [showSettings, setShowSettings] = useState(false);
  const [lbPeriod, setLbPeriod] = useState<"weekly" | "monthly">("weekly");

  const statsQ = useStats();
  const heatmapQ = useHeatmap(180);
  const distributionQ = useDistribution(7);
  const scoreQ = useScore();
  const streakQ = useStreak();
  const followingQ = useFollowing();
  const leaderboardQ = useLeaderboard(lbPeriod);
  const settingsQ = useSettings();
  const updateSettings = useUpdateSettings();

  const [dailyGoal, setDailyGoal] = useState(120);
  const [streakGoal, setStreakGoal] = useState(30);

  const indicatorStyle = {
    width: `${100 / tabOrder.length}%`,
    transform: `translateX(${tabOrder.indexOf(activeTab) * 100}%)`,
  };

  function openSettings() {
    if (settingsQ.data) {
      setDailyGoal(settingsQ.data.daily_goal_minutes);
      setStreakGoal(settingsQ.data.streak_goal_minutes);
    }
    setShowSettings(true);
  }

  async function saveSettings() {
    try {
      await updateSettings.mutateAsync({
        daily_goal_minutes: dailyGoal,
        streak_goal_minutes: streakGoal,
      });
      setShowSettings(false);
      statsQ.refetch();
      heatmapQ.refetch();
      scoreQ.refetch();
      streakQ.refetch();
    } catch {
      // toast handled in hook
    }
  }

  function refreshFollowing() {
    followingQ.refetch();
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="mx-auto max-w-4xl px-5">
        <header className="flex items-center justify-between py-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            title="返回大厅"
            onClick={() => navigate("/lobby")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            专注数据
          </h1>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="设置"
                onClick={openSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">专注设置</DialogTitle>
                <DialogDescription>
                  调整你的每日目标和连胜要求
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="daily-goal">每日目标（分钟）</Label>
                  <Input
                    id="daily-goal"
                    type="number"
                    min={1}
                    max={480}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="streak-goal">连胜最低要求（分钟）</Label>
                  <Input
                    id="streak-goal"
                    type="number"
                    min={1}
                    max={120}
                    value={streakGoal}
                    onChange={(e) => setStreakGoal(Number(e.target.value))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  取消
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 relative">
            <div
              className="absolute left-0 inset-y-0 bg-background shadow-sm rounded-md transition-[width,transform] duration-300 ease-in-out pointer-events-none"
              style={indicatorStyle}
            />
            <TabsTrigger
              value="stats"
              className="relative z-10 data-[state=active]:text-foreground"
            >
              数据大盘
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="relative z-10 data-[state=active]:text-foreground"
            >
              好友状态
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="relative z-10 data-[state=active]:text-foreground"
            >
              排行榜
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="flex flex-col gap-5">
            <StatsCards stats={statsQ.data} />
            <Heatmap data={heatmapQ.data?.data || []} />
            <StreakBadge streak={streakQ.data} />
            <DistributionChart data={distributionQ.data?.hours || []} />
            <ScoreGauge score={scoreQ.data} />
          </TabsContent>

          <TabsContent value="friends">
            <FriendStatus
              users={followingQ.data?.users || []}
              onRefresh={refreshFollowing}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard
              items={leaderboardQ.data?.items || []}
              period={lbPeriod}
              onChangePeriod={setLbPeriod}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
