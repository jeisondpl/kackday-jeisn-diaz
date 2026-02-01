import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, Loading, ErrorMessage } from '@shared/components/ui/index.ts';
import { usePatronHorario } from '../hooks/useConsulta.ts';

export function PatronHorarioChart() {
  const { data, isLoading, isError, error, refetch } = usePatronHorario();

  if (isLoading) {
    return (
      <Card title="Patrón Horario" subtitle="Consumo promedio por hora del día">
        <Loading text="Cargando datos..." />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title="Patrón Horario" subtitle="Consumo promedio por hora del día">
        <ErrorMessage message={error || 'Error al cargar datos'} onRetry={refetch} />
      </Card>
    );
  }

  // Group by hour and weekend/weekday
  const weekdayData = data.filter((d) => !d.es_fin_semana);
  const weekendData = data.filter((d) => d.es_fin_semana);

  // Aggregate by hour
  const aggregateByHour = (items: typeof data) => {
    const hourMap = new Map<number, { energia: number; count: number }>();
    items.forEach((d) => {
      const existing = hourMap.get(d.hora) || { energia: 0, count: 0 };
      hourMap.set(d.hora, {
        energia: existing.energia + d.energia_promedio_kwh,
        count: existing.count + 1,
      });
    });
    return Array.from({ length: 24 }, (_, i) => {
      const item = hourMap.get(i);
      return item ? item.energia / item.count : 0;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const weekdayValues = aggregateByHour(weekdayData);
  const weekendValues = aggregateByHour(weekendData);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: unknown) => {
        const p = params as Array<{ seriesName: string; value: number; axisValue: string }>;
        let html = `<strong>${p[0]?.axisValue}</strong><br/>`;
        p.forEach((item) => {
          html += `${item.seriesName}: ${item.value.toFixed(2)} kWh<br/>`;
        });
        return html;
      },
    },
    legend: {
      data: ['Días Laborales', 'Fines de Semana'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Consumo Promedio (kWh)',
    },
    series: [
      {
        name: 'Días Laborales',
        type: 'bar',
        data: weekdayValues,
        itemStyle: { color: '#3b82f6' },
        barGap: '0%',
      },
      {
        name: 'Fines de Semana',
        type: 'bar',
        data: weekendValues,
        itemStyle: { color: '#f59e0b' },
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
    <Card title="Patrón Horario" subtitle="Comparación de consumo entre días laborales y fines de semana">
      <ReactECharts
        option={option}
        style={{ height: '350px' }}
        opts={{ renderer: 'canvas' }}
      />
    </Card>
  );
}
