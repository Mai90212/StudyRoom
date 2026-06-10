<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle class="flex items-center gap-2 font-serif text-base">
        <LineChartIcon class="h-4 w-4 text-primary" />
        专注时间分布
      </CardTitle>
      <span class="text-xs text-muted-foreground">最近 7 天平均</span>
    </CardHeader>
    <CardContent>
      <div ref="chartRef" class="h-[250px] w-full"></div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart as LineChartIcon } from "@lucide/vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  data: { type: Array, default: () => [] },
});

const chartRef = ref(null);
let chart = null;
let resizeHandler = null;

// Sage-green focus token (OKLCH(0.624 0.090 145) ≈ #7aa07d)
const FOCUS = "#7aa07d";
const MUTED = "#928879";
const BORDER = "#e6e0d3";

function initChart() {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  updateChart();
}

function updateChart() {
  if (!chart) return;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dataMap = {};
  props.data.forEach((item) => {
    dataMap[item.hour] = item.avg_minutes;
  });
  const values = hours.map((h) => dataMap[h] || 0);

  chart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const hour = params[0].axisValue;
        const minutes = params[0].value;
        return `${hour}<br/>平均专注 ${minutes.toFixed(1)} 分钟`;
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
