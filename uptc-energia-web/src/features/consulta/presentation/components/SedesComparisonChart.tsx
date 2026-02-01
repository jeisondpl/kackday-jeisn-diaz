import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, Loading, ErrorMessage } from '@shared/components/ui/index.ts';
import { useSedes } from '../hooks/useConsulta.ts';

export function SedesComparisonChart() {
  const { sedes, isLoading, isError, error } = useSedes();

  if (isLoading) {
    return (
      <Card title="Comparación de Sedes" subtitle="Consumo total por campus">
        <Loading text="Cargando datos..." />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title="Comparación de Sedes" subtitle="Consumo total por campus">
        <ErrorMessage message={error || 'Error al cargar datos'} />
      </Card>
    );
  }

  const sedeNames = sedes.map((s) => s.sede);
  const energiaData = sedes.map((s) => (s.energia_total_historica_kwh / 1000).toFixed(2));
  const co2Data = sedes.map((s) => (s.co2_total_historico_kg / 1000).toFixed(2));

  const barOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['Energía Total (MWh)', 'CO2 Total (ton)'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: sedeNames,
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
        data: energiaData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'CO2 Total (ton)',
        type: 'bar',
        yAxisIndex: 1,
        data: co2Data,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#d97706' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
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
    <Card title="Comparación de Sedes" subtitle="Consumo acumulado por campus universitario">
      <ReactECharts
        option={barOption}
        style={{ height: '350px' }}
        opts={{ renderer: 'canvas' }}
      />
    </Card>
  );
}
