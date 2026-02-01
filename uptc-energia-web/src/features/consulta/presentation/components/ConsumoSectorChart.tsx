import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, Loading, ErrorMessage } from '@shared/components/ui/index.ts';
import { useConsumoSector } from '../hooks/useConsulta.ts';

export function ConsumoSectorChart() {
  const { data, isLoading, isError, error, refetch } = useConsumoSector();

  if (isLoading) {
    return (
      <Card title="Consumo por Sector" subtitle="Distribución del consumo energético">
        <Loading text="Cargando datos..." />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title="Consumo por Sector" subtitle="Distribución del consumo energético">
        <ErrorMessage message={error || 'Error al cargar datos'} onRetry={refetch} />
      </Card>
    );
  }

  // Aggregate data by sector
  const totals = data.reduce(
    (acc, d) => ({
      comedor: acc.comedor + d.energia_comedor_total_kwh,
      salones: acc.salones + d.energia_salones_total_kwh,
      laboratorios: acc.laboratorios + d.energia_laboratorios_total_kwh,
      auditorios: acc.auditorios + d.energia_auditorios_total_kwh,
      oficinas: acc.oficinas + d.energia_oficinas_total_kwh,
    }),
    { comedor: 0, salones: 0, laboratorios: 0, auditorios: 0, oficinas: 0 }
  );

  const pieData = [
    { value: totals.comedor, name: 'Comedor', itemStyle: { color: '#f59e0b' } },
    { value: totals.salones, name: 'Salones', itemStyle: { color: '#3b82f6' } },
    { value: totals.laboratorios, name: 'Laboratorios', itemStyle: { color: '#10b981' } },
    { value: totals.auditorios, name: 'Auditorios', itemStyle: { color: '#8b5cf6' } },
    { value: totals.oficinas, name: 'Oficinas', itemStyle: { color: '#ef4444' } },
  ];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} kWh ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: 'Consumo por Sector',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData,
      },
    ],
  };

  return (
    <Card title="Consumo por Sector" subtitle="Distribución porcentual del consumo energético">
      <ReactECharts
        option={option}
        style={{ height: '350px' }}
        opts={{ renderer: 'canvas' }}
      />
    </Card>
  );
}
