import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsBySedeChartProps {
  alerts: LlmAlert[];
}

export function AlertsBySedeChart({ alerts }: AlertsBySedeChartProps) {
  const counts = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.sedeId] = (acc[alert.sedeId] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const labels = sorted.map(([sede]) => sede);
  const values = sorted.map(([, value]) => value);

  return (
    <Card title="Top sedes con alertas" subtitle="Alertas por sede (Top 6)">
      <ReactECharts
        style={{ height: 260 }}
        option={{
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: labels,
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
              type: 'bar',
              data: values,
              itemStyle: { color: '#6366f1' },
              barWidth: 28,
              borderRadius: [6, 6, 0, 0],
            },
          ],
        }}
      />
    </Card>
  );
}
