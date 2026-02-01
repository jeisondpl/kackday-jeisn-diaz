import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsTimeSeriesChartsProps {
  alerts: LlmAlert[];
}

function buildDailySeries(alerts: LlmAlert[], days = 14) {
  const today = new Date();
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets[key] = 0;
  }

  alerts.forEach((alert) => {
    const key = new Date(alert.createdAt).toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += 1;
  });

  const labels = Object.keys(buckets);
  const values = Object.values(buckets);
  return { labels, values };
}

function buildHourlySeries(alerts: LlmAlert[]) {
  const buckets = Array.from({ length: 24 }, () => 0);
  alerts.forEach((alert) => {
    const hour = new Date(alert.createdAt).getHours();
    if (!Number.isNaN(hour)) buckets[hour] += 1;
  });
  return buckets;
}

export function AlertsTimeSeriesCharts({ alerts }: AlertsTimeSeriesChartsProps) {
  const daily = buildDailySeries(alerts, 14);
  const hourly = buildHourlySeries(alerts);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Alertas por día (14 días)" subtitle="Serie temporal diaria">
        <ReactECharts
          style={{ height: 260 }}
          option={{
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: daily.labels,
              axisLabel: { color: '#6b7280', rotate: 35 },
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
                showSymbol: false,
                lineStyle: { color: '#f97316' },
                areaStyle: { color: 'rgba(249, 115, 22, 0.15)' },
                data: daily.values,
              },
            ],
          }}
        />
      </Card>
      <Card title="Alertas por hora" subtitle="Distribución horaria">
        <ReactECharts
          style={{ height: 260 }}
          option={{
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
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
                data: hourly,
                itemStyle: { color: '#8b5cf6' },
                barWidth: 20,
                borderRadius: [6, 6, 0, 0],
              },
            ],
          }}
        />
      </Card>
    </div>
  );
}
