import { LineChart as LineChartIcon } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HourlyDistributionItem } from "@/types/api";

const FOCUS = "#648652";
const MUTED = "#928879";
const BORDER = "#e6e0d3";

export default function DistributionChart({
  data,
}: {
  data: HourlyDistributionItem[];
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dataMap: Record<number, number> = {};
  data.forEach((item) => {
    dataMap[item.hour] = item.avg_minutes;
  });
  const values = hours.map((h) => dataMap[h] || 0);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: { axisValue: string; value: number }[]) => {
        const p = params[0];
        return `${p.axisValue}<br/>平均专注 ${p.value.toFixed(1)} 分钟`;
      },
    },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category",
      data: hours.map((h) => `${h}:00`),
      axisLabel: { color: MUTED, fontSize: 11, interval: 2 },
      axisLine: { lineStyle: { color: BORDER } },
    },
    yAxis: {
      type: "value",
      name: "分钟",
      nameTextStyle: { color: MUTED, fontSize: 11 },
      axisLabel: { color: MUTED, fontSize: 11 },
      splitLine: { lineStyle: { color: "#f0ebe0" } },
    },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: { color: FOCUS },
        lineStyle: { color: FOCUS, width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(122, 160, 125, 0.30)" },
              { offset: 1, color: "rgba(122, 160, 125, 0.05)" },
            ],
          },
        },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-base">
          <LineChartIcon className="h-4 w-4 text-primary" />
          专注时间分布
        </CardTitle>
        <span className="text-xs text-muted-foreground">最近 7 天平均</span>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: "250px", width: "100%" }} />
      </CardContent>
    </Card>
  );
}
