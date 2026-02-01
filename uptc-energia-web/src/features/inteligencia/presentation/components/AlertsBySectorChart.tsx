import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsBySectorChartProps {
  alerts: LlmAlert[];
}

export function AlertsBySectorChart({ alerts }: AlertsBySectorChartProps) {
  const counts = alerts.reduce<Record<string, number>>((acc, alert) => {
    const key = alert.sector || 'sin_sector';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts)
    .map(([sector, value]) => ({
      name: sector === 'sin_sector' ? 'Sin sector' : sector,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <Card title="Alertas por sector" subtitle="Distribución por sector">
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
              avoidLabelOverlap: true,
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
