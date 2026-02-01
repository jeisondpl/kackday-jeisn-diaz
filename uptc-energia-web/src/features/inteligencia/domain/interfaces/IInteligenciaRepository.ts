import type { LlmAlert, AlertExplanation } from '../entities/Alert.ts';
import type { AnomalyResponse } from '../entities/Anomaly.ts';
import type { ForecastResponse } from '../entities/Forecast.ts';
import type { AnalyticsSummary } from '../entities/AnalyticsSummary.ts';
import type { Recommendation } from '../entities/Recommendation.ts';
import type { CreateKnowledgeDocRequest, KnowledgeDoc } from '../entities/KnowledgeDoc.ts';

export interface AlertsFilters {
  status?: string;
  severity?: string;
  sede_id?: string;
  sector?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsFilters {
  sede_id?: string;
  metric?: string;
  hours?: number;
  lookback_days?: number;
  threshold?: number;
}

export interface DocsFilters {
  sector?: string;
  tags?: string;
  q?: string;
  indexed?: boolean;
  limit?: number;
  offset?: number;
}

export interface IInteligenciaRepository {
  getSummary(filters?: { sede_id?: string }): Promise<AnalyticsSummary>;
  getAnomalies(filters?: AnalyticsFilters): Promise<AnomalyResponse>;
  getForecast(filters?: AnalyticsFilters): Promise<ForecastResponse>;
  listAlerts(filters?: AlertsFilters): Promise<{ data: LlmAlert[]; pagination: { limit: number; offset: number; count: number } }>;
  getAlertExplanation(alertId: number): Promise<AlertExplanation>;
  acknowledgeAlert(alertId: number, acknowledged_by: string): Promise<LlmAlert>;
  generateRecommendation(alertId: number): Promise<Recommendation>;
  recalculateBaseline(payload?: { sede_id?: string; metric?: string; lookback_days?: number }): Promise<{
    sedeId?: string;
    metric: string;
    lookbackDays: number;
    baselinesSaved: number;
  }>;
  createDoc(payload: CreateKnowledgeDocRequest): Promise<{ doc: KnowledgeDoc; indexed: boolean }>;
  listDocs(filters?: DocsFilters): Promise<{ docs: KnowledgeDoc[] }>;
  query(payload: { question: string; sede_id?: string; from?: string; to?: string }): Promise<{
    question: string;
    answer: string;
    data?: unknown;
    sources: string[];
    timestamp: string;
  }>;
}
