<template>
  <div class="distribution-card">
    <div class="card-header">
      <h3>专注时间分布</h3>
      <span class="card-hint">最近 7 天平均</span>
    </div>
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const chartRef = ref(null);
let chart = null;

function initChart() {
  if (!chartRef.value) return;

  chart = echarts.init(chartRef.value);
  updateChart();
}

function updateChart() {
  if (!chart) return;

  // 构建 0-23 小时数据
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dataMap = {};
  props.data.forEach((item) => {
    dataMap[item.hour] = item.avg_minutes;
  });
  const values = hours.map((h) => dataMap[h] || 0);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const hour = params[0].axisValue;
        const minutes = params[0].value;
        return `${hour}:00<br/>平均专注 ${minutes.toFixed(1)} 分钟`;
      },
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 40,
    },
    xAxis: {
      type: "category",
      data: hours.map((h) => `${h}:00`),
      axisLabel: {
        color: "#8c8274",
        fontSize: 11,
        interval: 2,
      },
      axisLine: {
        lineStyle: {
          color: "#e8e2d6",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "分钟",
      nameTextStyle: {
        color: "#8c8274",
        fontSize: 11,
      },
      axisLabel: {
        color: "#8c8274",
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: "#f0ebe0",
        },
      },
    },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: {
          color: "#6a9b6f",
        },
        lineStyle: {
          color: "#6a9b6f",
          width: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(106, 155, 111, 0.3)" },
              { offset: 1, color: "rgba(106, 155, 111, 0.05)" },
            ],
          },
        },
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
.distribution-card {
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

.chart-container {
  width: 100%;
  height: 250px;
}
</style>
