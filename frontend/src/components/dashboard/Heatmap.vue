<template>
  <div class="heatmap-card">
    <div class="card-header">
      <h3>学习热力图</h3>
      <span class="card-hint">最近 180 天</span>
    </div>
    <div class="heatmap-container" ref="heatmapRef"></div>
    <div class="heatmap-legend">
      <span class="legend-label">少</span>
      <div class="legend-box level-0"></div>
      <div class="legend-box level-1"></div>
      <div class="legend-box level-2"></div>
      <div class="legend-box level-3"></div>
      <div class="legend-box level-4"></div>
      <span class="legend-label">多</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import { CalendarComponent, VisualMapComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([HeatmapChart, CalendarComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const heatmapRef = ref(null);
let chart = null;

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

  // 构建数据映射
  const dataMap = {};
  props.data.forEach((item) => {
    dataMap[item.date] = item.minutes;
  });

  // 生成完整 180 天数据
  const chartData = [];
  const current = new Date(startDate);
  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    chartData.push([dateStr, dataMap[dateStr] || 0]);
    current.setDate(current.getDate() + 1);
  }

  const option = {
    tooltip: {
      formatter: function (params) {
        const date = params.data[0];
        const minutes = params.data[1];
        return `${date}<br/>专注 ${minutes} 分钟`;
      },
    },
    visualMap: {
      show: false,
      min: 0,
      max: 120,
      inRange: {
        color: ["#f0ebe0", "#b5d4b8", "#6a9b6f", "#4a7a50", "#2d5a30"],
      },
    },
    calendar: {
      range: [startDate.toISOString().split("T")[0], today.toISOString().split("T")[0]],
      cellSize: [14, 14],
      orient: "horizontal",
      splitLine: {
        show: false,
      },
      itemStyle: {
        borderWidth: 3,
        borderColor: "#faf7f2",
        borderRadius: 3,
      },
      yearLabel: {
        show: false,
      },
      monthLabel: {
        show: true,
        color: "#8c8274",
        fontSize: 11,
      },
      dayLabel: {
        show: true,
        color: "#8c8274",
        fontSize: 11,
        nameMap: ["日", "一", "二", "三", "四", "五", "六"],
      },
      left: 30,
      right: 10,
      top: 35,
      bottom: 10,
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: chartData,
      },
    ],
  };

  chart.setOption(option);
}

onMounted(() => {
  nextTick(() => {
    initChart();
  });

  window.addEventListener("resize", () => {
    chart?.resize();
  });
});

watch(() => props.data, updateChart, { deep: true });
</script>

<style scoped>
.heatmap-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--border-light);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-header h3 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.card-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.heatmap-container {
  width: 100%;
  height: 180px;
  margin-top: 8px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
}

.legend-label {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 4px;
}

.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.level-0 { background: #f0ebe0; }
.level-1 { background: #b5d4b8; }
.level-2 { background: #6a9b6f; }
.level-3 { background: #4a7a50; }
.level-4 { background: #2d5a30; }
</style>
