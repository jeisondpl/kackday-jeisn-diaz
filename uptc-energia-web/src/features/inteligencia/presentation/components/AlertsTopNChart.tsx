import { useMemo, useState } from 'react';
import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

type Dimension = 'sede' | 'sector' | 'metric';

interface AlertsTopNChartProps {
  alerts: LlmAlert[];
}

const dimensionLabels: Record<Dimension, string> = {
  sede: 'Sede',
  sector: 'Sector',
  metric: 'Métrica',
};

export function AlertsTopNChart({ alerts }: AlertsTopNChartProps) {
  const [dimension, setDimension] = useState<Dimension>('sede');
  const [topN, setTopN] = useState(6);

  const { labels, values } = useMemo(() => {
    const counts = alerts.reduce<Record<string, number>>((acc, alert) => {
      let key = '';
      if (dimension === 'sede') key = alert.sedeId;
      if (dimension === 'sector') key = alert.sector || 'Sin sector';
      if (dimension === 'metric') key = alert.metric;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(1, topN));

    return {
      labels: sorted.map(([label]) => label),
      values: sorted.map(([, value]) => value),
    };
  }, [alerts, dimension, topN]);

  return (
    <Card title={`Top ${topN} por ${dimensionLabels[dimension]}`} subtitle="Filtra dimensión y tamaño">
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value as Dimension)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="sede">Sede</option>
          <option value="sector">Sector</option>
          <option value="metric">Métrica</option>
        </select>
        <input
          type="number"
          min={3}
          max={12}
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
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
              itemStyle: { color: '#0ea5e9' },
              barWidth: 28,
              borderRadius: [6, 6, 0, 0],
            },
          ],
        }}
      />
    </Card>
  );
}
