import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsByStatusChartProps {
  alerts: LlmAlert[];
}

const statusLabels: Record<string, string> = {
  open: 'Abiertas',
  acknowledged: 'Reconocidas',
  resolved: 'Resueltas',
};

const statusColors: Record<string, string> = {
  open: '#f97316',
  acknowledged: '#38bdf8',
  resolved: '#22c55e',
};

export function AlertsByStatusChart({ alerts }: AlertsByStatusChartProps) {
  const counts = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.status] = (acc[alert.status] || 0) + 1;
    return acc;
  }, {});

  const statuses = Object.keys(statusLabels);
  const data = statuses.map((status) => ({
    name: statusLabels[status],
    value: counts[status] || 0,
    itemStyle: { color: statusColors[status] },
  }));

  return (
    <Card title="Alertas por estado" subtitle="Estado operativo de alertas">
      <ReactECharts
        style={{ height: 260 }}
        option={{
          tooltip: { trigger: 'item' },
          legend: {
            bottom: 0,
            textStyle: { color: '#6b7280' },
          },
          series: [
            {
              type: 'pie',
              radius: ['45%', '70%'],
              label: { show: false },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 12,
                  fontWeight: 'bold',
                },
              },
              data,
            },
          ],
        }}
      />
    </Card>
  );
}
