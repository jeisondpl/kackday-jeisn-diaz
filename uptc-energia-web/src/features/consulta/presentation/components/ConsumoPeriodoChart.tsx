import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, Loading, ErrorMessage } from '@shared/components/ui/index.ts';
import { useConsumoPeriodo } from '../hooks/useConsulta.ts';

export function ConsumoPeriodoChart() {
  const { data, isLoading, isError, error, refetch } = useConsumoPeriodo();

  if (isLoading) {
    return (
      <Card title="Consumo por Periodo Académico" subtitle="Análisis por semestre">
        <Loading text="Cargando datos..." />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title="Consumo por Periodo Académico" subtitle="Análisis por semestre">
        <ErrorMessage message={error || 'Error al cargar datos'} onRetry={refetch} />
      </Card>
    );
  }

  // Group by period
  const periodMap = new Map<string, { energia: number; co2: number; agua: number }>();
  data.forEach((d) => {
    const key = `${d.año}-${d.periodo_academico}`;
    const existing = periodMap.get(key) || { energia: 0, co2: 0, agua: 0 };
    periodMap.set(key, {
      energia: existing.energia + d.energia_total_kwh,
      co2: existing.co2 + d.co2_total_kg,
      agua: existing.agua + d.agua_total_litros,
    });
  });

  const periods = Array.from(periodMap.keys()).sort();
  const energiaData = periods.map((p) => periodMap.get(p)?.energia || 0);
  const co2Data = periods.map((p) => periodMap.get(p)?.co2 || 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['Energía Total (MWh)', 'CO2 Total (ton)'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: {
        rotate: 30,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Energía (MWh)',
        position: 'left',
      },
      {
        type: 'value',
        name: 'CO2 (ton)',
        position: 'right',
      },
    ],
    series: [
      {
        name: 'Energía Total (MWh)',
        type: 'bar',
        data: energiaData.map((v) => (v / 1000).toFixed(2)),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'CO2 Total (ton)',
        type: 'line',
        yAxisIndex: 1,
        data: co2Data.map((v) => (v / 1000).toFixed(2)),
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
  };

  return (
    <Card title="Consumo por Periodo Académico" subtitle="Evolución histórica por semestre">
      <ReactECharts
        option={option}
        style={{ height: '350px' }}
        opts={{ renderer: 'canvas' }}
      />
    </Card>
  );
}
