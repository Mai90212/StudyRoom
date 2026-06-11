<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle class="flex items-center gap-2 font-serif text-base">
        <Activity class="h-4 w-4 text-primary" />
        学习热力图
      </CardTitle>
      <span class="text-xs text-muted-foreground">最近 180 天</span>
    </CardHeader>
    <CardContent>
      <div ref="heatmapRef" class="h-[180px] w-full"></div>
      <div class="mt-3 flex items-center justify-end gap-1">
        <span class="mr-1 text-xs text-muted-foreground">少</span>
        <div v-for="(c, i) in palette" :key="i" class="h-3 w-3 rounded-sm" :style="{ background: c }"></div>
        <span class="ml-1 text-xs text-muted-foreground">多</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import { CalendarComponent, VisualMapComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { Activity } from "@lucide/vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

echarts.use([HeatmapChart, CalendarComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  data: { type: Array, default: () => [] },
});

const heatmapRef = ref(null);
let chart = null;
let resizeHandler = null;

// Heatmap 5 级渐变：暖奶油 → 苔藓绿（hue 135），与 --focus token 一致
const palette = ["#f0ebe0", "#c4deb6", "#8aa97a", "#648652", "#3d592e"];

function initChart() {
  if (!heatmapRef.value) return;
  chart = echarts.init(heatmapRef.value);
  updateChart();
}

function updateChart() {
  if (!chart) return;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 179);

  const dataMap = {};
  props.data.forEach((item) => {
    dataMap[item.date] = item.minutes;
  });

  const chartData = [];
  const current = new Date(startDate);
  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    chartData.push([dateStr, dataMap[dateStr] || 0]);
    current.setDate(current.getDate() + 1);
  }

  chart.setOption({
    tooltip: {
      formatter: (params) => `${params.data[0]}<br/>专注 ${params.data[1]} 分钟`,
    },
    visualMap: {
      show: false,
      min: 0,
      max: 120,
      inRange: { color: palette },
    },
    calendar: {
      range: [startDate.toISOString().split("T")[0], today.toISOString().split("T")[0]],
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
  });
}

onMounted(() => {
  nextTick(initChart);
  resizeHandler = () => chart?.resize();
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  chart?.dispose();
  chart = null;
});

watch(() => props.data, updateChart, { deep: true });
</script>
