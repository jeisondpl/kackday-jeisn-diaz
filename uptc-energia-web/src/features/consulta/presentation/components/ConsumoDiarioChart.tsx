import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, Loading, ErrorMessage } from '@shared/components/ui/index.ts';
import { useConsumoDiario } from '../hooks/useConsulta.ts';

export function ConsumoDiarioChart() {
  const { data, isLoading, isError, error, refetch } = useConsumoDiario();

  if (isLoading) {
    return (
      <Card title="Consumo Diario" subtitle="Evolución del consumo energético">
        <Loading text="Cargando datos..." />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title="Consumo Diario" subtitle="Evolución del consumo energético">
        <ErrorMessage message={error || 'Error al cargar datos'} onRetry={refetch} />
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) =>
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['Energía Total (kWh)', 'CO2 (kg)', 'Agua (kL)'],
      bottom: 0,
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
        restore: {},
        saveAsImage: {},
      },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
      },
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sortedData.map((d) => d.fecha.split('T')[0]),
    },
    yAxis: [
      {
        type: 'value',
        name: 'Energía (kWh)',
        position: 'left',
      },
      {
        type: 'value',
        name: 'CO2 (kg) / Agua (kL)',
        position: 'right',
      },
    ],
    series: [
      {
        name: 'Energía Total (kWh)',
        type: 'line',
        smooth: true,
        data: sortedData.map((d) => d.energia_total_suma_kwh),
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
      },
      {
        name: 'CO2 (kg)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: sortedData.map((d) => d.co2_total_kg),
        itemStyle: { color: '#ef4444' },
      },
      {
        name: 'Agua (kL)',
        type: 'bar',
        yAxisIndex: 1,
        data: sortedData.map((d) => (d.agua_total_litros / 1000).toFixed(2)),
        itemStyle: { color: '#06b6d4' },
        barWidth: '30%',
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
    <Card title="Consumo Diario" subtitle="Evolución del consumo energético con zoom interactivo">
      <ReactECharts
        option={option}
        style={{ height: '400px' }}
        opts={{ renderer: 'canvas' }}
      />
    </Card>
  );
}
