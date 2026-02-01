import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { AnomalyResponse } from '../../domain/entities/Anomaly.ts';

interface AnomaliesListProps {
  anomalies: AnomalyResponse | null;
}

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export function AnomaliesList({ anomalies }: AnomaliesListProps) {
  if (!anomalies) return null;

  return (
    <Card title="Anomalías recientes" subtitle={`Detectadas: ${anomalies.anomaliesCount}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="min-h-[240px]">
          <ReactECharts
            style={{ height: 240 }}
            option={{
              backgroundColor: 'transparent',
              tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                  const point = params?.[0];
                  if (!point) return '';
                  const data = point.data;
                  return `${new Date(data[0]).toLocaleString()}<br/>Valor: ${data[1].toFixed(2)}<br/>z-score: ${data[2].toFixed(2)}`;
                },
              },
              xAxis: {
                type: 'time',
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
                  name: 'Anomalías',
                  type: 'scatter',
                  symbolSize: 12,
                  itemStyle: {
                    color: '#ef4444',
                  },
                  data: anomalies.anomalies.map((a) => [a.timestamp, a.value, a.zScore]),
                },
              ],
            }}
          />
        </div>
        <div className="space-y-3">
          {anomalies.anomalies.slice(0, 6).map((a) => (
            <div key={`${a.timestamp}-${a.metric}`} className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{a.metric}</p>
                <p className="text-xs text-gray-500">{a.sedeId} {a.sector ? `· ${a.sector}` : ''}</p>
                <p className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{a.value.toFixed(2)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${severityColors[a.severity] || 'bg-gray-100 text-gray-700'}`}>
                  {a.severity}
                </span>
              </div>
            </div>
          ))}
          {anomalies.anomalies.length === 0 && (
            <p className="text-sm text-gray-500">No se detectaron anomalías en el rango.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
