import { StatCard } from '@shared/components/ui/StatCard.tsx';
import type { AnalyticsSummary } from '../../domain/entities/AnalyticsSummary.ts';

interface SummaryCardsProps {
  summary: AnalyticsSummary | null;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  const { kpis } = summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title="Sedes" value={kpis.totalSedes} color="blue" />
      <StatCard title="Consumo total" value={kpis.totalConsumo.toFixed(1)} subtitle="kWh" color="green" />
      <StatCard title="Promedio" value={kpis.avgConsumo.toFixed(1)} subtitle="kWh" color="purple" />
      <StatCard title="Alertas abiertas" value={kpis.openAlerts} color="yellow" />
      <StatCard title="Alertas críticas" value={kpis.criticalAlerts} color="red" />
      <StatCard title="Anomalías 24h" value={kpis.anomaliesLast24h} color="blue" />
    </div>
  );
}
