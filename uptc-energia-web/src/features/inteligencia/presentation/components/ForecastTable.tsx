import { Card } from '@shared/components/ui/Card.tsx';
import ReactECharts from 'echarts-for-react';
import type { ForecastResponse } from '../../domain/entities/Forecast.ts';

interface ForecastTableProps {
  forecast: ForecastResponse | null;
}

export function ForecastTable({ forecast }: ForecastTableProps) {
  if (!forecast) return null;

  return (
    <Card title="Predicción de consumo" subtitle={forecast.method}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="min-h-[260px]">
          <ReactECharts
            style={{ height: 260 }}
            option={{
              tooltip: {
                trigger: 'axis',
              },
              legend: {
                data: ['Predicción', 'Intervalo'],
                textStyle: { color: '#6b7280' },
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
                  name: 'Predicción',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  lineStyle: { color: '#2563eb' },
                  data: forecast.forecast.map((p) => [p.timestamp, p.predicted]),
                },
                {
                  name: 'Intervalo',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  lineStyle: { width: 0 },
                  areaStyle: { color: 'rgba(37, 99, 235, 0.15)' },
                  data: forecast.forecast.map((p) => [p.timestamp, p.confidence.upper]),
                },
                {
                  name: 'Intervalo',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  lineStyle: { width: 0 },
                  areaStyle: { color: 'rgba(37, 99, 235, 0.15)' },
                  data: forecast.forecast.map((p) => [p.timestamp, p.confidence.lower]),
                },
              ],
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="py-2">Hora</th>
                <th className="py-2">Predicción</th>
                <th className="py-2">Intervalo</th>
              </tr>
            </thead>
            <tbody>
              {forecast.forecast.slice(0, 8).map((point) => (
                <tr key={point.timestamp} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">{new Date(point.timestamp).toLocaleString()}</td>
                  <td className="py-2 font-semibold text-gray-900">{point.predicted.toFixed(2)}</td>
                  <td className="py-2 text-gray-600">
                    {point.confidence.lower.toFixed(2)} - {point.confidence.upper.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
