import type { LlmAlert } from './Alert.ts';
import type { Anomaly } from './Anomaly.ts';
import type { ForecastPoint } from './Forecast.ts';

export interface AnalyticsKpis {
  totalSedes: number;
  totalConsumo: number;
  avgConsumo: number;
  openAlerts: number;
  criticalAlerts: number;
  anomaliesLast24h: number;
}

export interface AnalyticsSede {
  id: string;
  nombre: string;
  totalConsumo?: number;
  promedioConsumo?: number;
}

export interface AnalyticsSummary {
  kpis: AnalyticsKpis;
  sedes: AnalyticsSede[];
  recentAlerts: Array<{
    id: number;
    severity: string;
    message: string;
    sedeId: string;
    sector?: string;
    createdAt: string;
  }>;
  anomalies: {
    count: number;
    threshold: number;
    recent: Anomaly[];
  };
  forecast: {
    next24Hours: ForecastPoint[];
    method: string;
    accuracy: {
      mean: number;
      stdDev: number;
      min: number;
      max: number;
      dataPoints: number;
    };
  };
  summary: Record<string, unknown>;
  generatedAt: string;
  alerts?: LlmAlert[];
}
