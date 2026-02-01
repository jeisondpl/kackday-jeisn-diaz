import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsByMetricChartProps {
  alerts: LlmAlert[];
}

export function AlertsByMetricChart({ alerts }: AlertsByMetricChartProps) {
  const counts = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.metric] = (acc[alert.metric] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const labels = sorted.map(([metric]) => metric);
  const values = sorted.map(([, value]) => value);

  return (
    <Card title="Top métricas afectadas" subtitle="Alertas por métrica">
      <ReactECharts
        style={{ height: 260 }}
        option={{
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#6b7280', rotate: 20 },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
          },
          series: [
            {
              type: 'bar',
              data: values,
              itemStyle: { color: '#14b8a6' },
              barWidth: 26,
              borderRadius: [6, 6, 0, 0],
            },
          ],
        }}
      />
    </Card>
  );
}
