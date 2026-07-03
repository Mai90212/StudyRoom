import { Gauge } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreResponse } from "@/types/api";

const AMBER = "#d28c50";
const LIGHT_SAGE = "#c4deb6";
const SAGE = "#648652";

const defaultScore: ScoreResponse = {
  score: 0,
  duration_score: 0,
  stability_score: 0,
  away_count: 0,
  focus_minutes: 0,
};

export default function ScoreGauge({ score }: { score?: ScoreResponse }) {
  const s = score || defaultScore;
  const scoreValue = s.score || 0;

  let mainColor = SAGE;
  if (scoreValue < 40) mainColor = AMBER;
  else if (scoreValue < 70) mainColor = LIGHT_SAGE;

  const option = {
    series: [
      {
        type: "gauge",
        radius: "90%",
        startAngle: 200,
        endAngle: -20,
        center: ["50%", "55%"],
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: { color: mainColor },
        progress: { show: true, width: 16 },
        pointer: { show: false },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.4, AMBER],
              [0.7, LIGHT_SAGE],
              [1, SAGE],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          width: "60%",
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, "0%"],
          fontSize: 36,
          fontWeight: "bold",
          formatter: "{value}",
          color: "inherit",
        },
        data: [{ value: scoreValue }],
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <Gauge className="h-4 w-4 text-primary" />
          Focus Score
        </CardTitle>
        <span className="text-xs text-muted-foreground">今日评分</span>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: "220px", width: "100%" }} />
        <div className="mt-2 flex justify-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">专注时长</span>
            <span className="font-mono text-sm font-semibold">
              {s.focus_minutes} 分钟
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">切屏次数</span>
            <span className="font-mono text-sm font-semibold">
              {s.away_count} 次
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
