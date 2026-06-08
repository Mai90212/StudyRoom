<template>
  <div class="score-card">
    <div class="card-header">
      <h3>Focus Score</h3>
      <span class="card-hint">今日评分</span>
    </div>
    <div class="gauge-container" ref="gaugeRef"></div>
    <div class="score-details">
      <div class="detail-item">
        <span class="detail-label">专注时长</span>
        <span class="detail-value">{{ score.focus_minutes }} 分钟</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">切屏次数</span>
        <span class="detail-value">{{ score.away_count }} 次</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([GaugeChart, CanvasRenderer]);

const props = defineProps({
  score: {
    type: Object,
    default: () => ({
      score: 0,
      duration_score: 0,
      stability_score: 0,
      away_count: 0,
      focus_minutes: 0,
    }),
  },
});

const gaugeRef = ref(null);
let chart = null;

function initChart() {
  if (!gaugeRef.value) return;

  chart = echarts.init(gaugeRef.value);
  updateChart();
}

function updateChart() {
  if (!chart) return;

  const scoreValue = props.score.score || 0;

  // 根据分数设置颜色
  let color = "#6a9b6f"; // 绿色
  if (scoreValue < 40) {
    color = "#d4956b"; // 橙色
  } else if (scoreValue < 70) {
    color = "#b5d4b8"; // 浅绿色
  }

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
        itemStyle: {
          color: color,
        },
        progress: {
          show: true,
          width: 16,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.4, "#d4956b"],
              [0.7, "#b5d4b8"],
              [1, "#6a9b6f"],
            ],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        title: {
          show: false,
        },
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
        data: [
          {
            value: scoreValue,
          },
        ],
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

watch(() => props.score, updateChart, { deep: true });
</script>

<style scoped>
.score-card {
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
  margin-bottom: 8px;
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

.gauge-container {
  width: 100%;
  height: 220px;
}

.score-details {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted);
}

.detail-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
</style>
