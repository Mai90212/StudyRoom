import { Activity } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeatmapItem } from "@/types/api";

const palette = ["#f0ebe0", "#c4deb6", "#8aa97a", "#648652", "#3d592e"];

export default function Heatmap({ data }: { data: HeatmapItem[] }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 179);

  const dataMap: Record<string, number> = {};
  data.forEach((item) => {
    dataMap[item.date] = item.minutes;
  });

  const chartData: [string, number][] = [];
  const current = new Date(startDate);
  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    chartData.push([dateStr, dataMap[dateStr] || 0]);
    current.setDate(current.getDate() + 1);
  }

  const option = {
    tooltip: {
      formatter: (params: { data: [string, number] }) =>
        `${params.data[0]}<br/>专注 ${params.data[1]} 分钟`,
    },
    visualMap: {
      show: false,
      min: 0,
      max: 120,
      inRange: { color: palette },
    },
    calendar: {
      range: [
        startDate.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
      ],
      cellSize: [14, 14],
      orient: "horizontal",
      splitLine: { show: false },
      itemStyle: { borderWidth: 3, borderColor: "#faf7f2", borderRadius: 3 },
      yearLabel: { show: false },
      monthLabel: { show: true, color: "#928879", fontSize: 11 },
      dayLabel: {
        show: true,
        color: "#928879",
        fontSize: 11,
        nameMap: ["日", "一", "二", "三", "四", "五", "六"],
      },
      left: 30,
      right: 10,
      top: 35,
      bottom: 10,
    },
    series: [{ type: "heatmap", coordinateSystem: "calendar", data: chartData }],
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <Activity className="h-4 w-4 text-primary" />
          学习热力图
        </CardTitle>
        <span className="text-xs text-muted-foreground">最近 180 天</span>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: "180px", width: "100%" }} />
        <div className="mt-3 flex items-center justify-end gap-1">
          <span className="mr-1 text-xs text-muted-foreground">少</span>
          {palette.map((c, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{ background: c }}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">多</span>
        </div>
      </CardContent>
    </Card>
  );
}
