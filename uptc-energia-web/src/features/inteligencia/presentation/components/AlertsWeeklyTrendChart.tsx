import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsWeeklyTrendChartProps {
  alerts: LlmAlert[];
}

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function AlertsWeeklyTrendChart({ alerts }: AlertsWeeklyTrendChartProps) {
  const counts = new Array(7).fill(0);

  alerts.forEach((alert) => {
    const date = new Date(alert.createdAt);
    const day = date.getDay();
    if (!Number.isNaN(day)) counts[day] += 1;
  });

  return (
    <Card title="Tendencia semanal de alertas" subtitle="Distribución por día">
      <ReactECharts
        style={{ height: 260 }}
        option={{
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: dayLabels,
            axisLabel: { color: '#6b7280' },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
          },
          series: [
            {
              type: 'line',
              smooth: true,
              showSymbol: true,
              symbolSize: 6,
              lineStyle: { color: '#10b981' },
              itemStyle: { color: '#10b981' },
              areaStyle: { color: 'rgba(16, 185, 129, 0.12)' },
              data: counts,
            },
          ],
        }}
      />
    </Card>
  );
}
