import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsSeverityChartProps {
  alerts: LlmAlert[];
}

const severityOrder = ['critical', 'high', 'medium', 'low'] as const;
const severityLabels: Record<string, string> = {
  critical: 'Críticas',
  high: 'Altas',
  medium: 'Medias',
  low: 'Bajas',
};

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#facc15',
  low: '#3b82f6',
};

export function AlertsSeverityChart({ alerts }: AlertsSeverityChartProps) {
  const counts = severityOrder.map((severity) =>
    alerts.filter((a) => a.severity === severity).length
  );

  return (
    <Card title="Alertas por severidad" subtitle="Distribución de alertas recientes">
      <ReactECharts
        style={{ height: 260 }}
        option={{
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: severityOrder.map((s) => severityLabels[s]),
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
              data: counts.map((value, idx) => ({
                value,
                itemStyle: { color: severityColors[severityOrder[idx]] },
              })),
              barWidth: 32,
              borderRadius: [6, 6, 0, 0],
            },
          ],
        }}
      />
    </Card>
  );
}
