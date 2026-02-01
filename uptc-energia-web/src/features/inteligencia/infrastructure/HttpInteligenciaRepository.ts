import { axiosLlmClient } from '@core/infrastructure/http/axiosLlmClient.ts';
import { LLM_ENDPOINTS } from '@config/api.config.ts';
import { ApiValidationError } from '@core/shared/utils/errorHandler.ts';
import type { IInteligenciaRepository, AlertsFilters, AnalyticsFilters, DocsFilters } from '../domain/interfaces/IInteligenciaRepository.ts';
import type { AnalyticsSummary } from '../domain/entities/AnalyticsSummary.ts';
import type { AnomalyResponse } from '../domain/entities/Anomaly.ts';
import type { ForecastResponse } from '../domain/entities/Forecast.ts';
import type { LlmAlert, AlertExplanation } from '../domain/entities/Alert.ts';
import type { Recommendation } from '../domain/entities/Recommendation.ts';
import type { CreateKnowledgeDocRequest, KnowledgeDoc } from '../domain/entities/KnowledgeDoc.ts';
import {
  AnalyticsSummarySchema,
  AnomalyResponseSchema,
  ForecastResponseSchema,
  AlertsListSchema,
  AlertExplanationSchema,
  RecommendationSchema,
  CreateDocResponseSchema,
  DocsListSchema,
  BaselineRecalculateSchema,
  AlertSchema,
  QueryResponseSchema,
} from '../application/dto/schemas.ts';

export class HttpInteligenciaRepository implements IInteligenciaRepository {
  async getSummary(filters?: { sede_id?: string }): Promise<AnalyticsSummary> {
    const response = await axiosLlmClient.get(LLM_ENDPOINTS.ANALYTICS.SUMMARY, {
      params: filters,
    });
    const result = AnalyticsSummarySchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de resumen LLM fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async getAnomalies(filters?: AnalyticsFilters): Promise<AnomalyResponse> {
    const response = await axiosLlmClient.get(LLM_ENDPOINTS.ANALYTICS.ANOMALIES, {
      params: filters,
    });
    const result = AnomalyResponseSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de anomalías fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async getForecast(filters?: AnalyticsFilters): Promise<ForecastResponse> {
    const response = await axiosLlmClient.get(LLM_ENDPOINTS.ANALYTICS.FORECAST, {
      params: filters,
    });
    const result = ForecastResponseSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de forecast fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async listAlerts(filters?: AlertsFilters): Promise<{ data: LlmAlert[]; pagination: { limit: number; offset: number; count: number } }> {
    const response = await axiosLlmClient.get(LLM_ENDPOINTS.ALERTS, { params: filters });
    const result = AlertsListSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de alertas fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async getAlertExplanation(alertId: number): Promise<AlertExplanation> {
    const response = await axiosLlmClient.get(LLM_ENDPOINTS.ALERT_EXPLANATION(alertId));
    const result = AlertExplanationSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de explicación fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async acknowledgeAlert(alertId: number, acknowledged_by: string): Promise<LlmAlert> {
    const response = await axiosLlmClient.post(LLM_ENDPOINTS.ALERT_ACK(alertId), {
      acknowledged_by,
    });
    const result = AlertSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de acknowledge fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async generateRecommendation(alertId: number): Promise<Recommendation> {
    const response = await axiosLlmClient.post(LLM_ENDPOINTS.RECOMMENDATION(alertId));
    const result = RecommendationSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de recomendación fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async recalculateBaseline(payload?: { sede_id?: string; metric?: string; lookback_days?: number }): Promise<{
    sedeId?: string;
    metric: string;
    lookbackDays: number;
    baselinesSaved: number;
  }> {
    const response = await axiosLlmClient.post(LLM_ENDPOINTS.ANALYTICS.RECALCULATE_BASELINE, payload || {});
    const result = BaselineRecalculateSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de recalibración fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async createDoc(payload: CreateKnowledgeDocRequest): Promise<{ doc: KnowledgeDoc; indexed: boolean }> {
    const response = await axiosLlmClient.post(LLM_ENDPOINTS.DOCS, payload);
    const result = CreateDocResponseSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de documento fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async listDocs(filters?: DocsFilters): Promise<{ docs: KnowledgeDoc[] }> {
    const response = await axiosLlmClient.get(LLM_ENDPOINTS.DOCS, { params: filters });
    const result = DocsListSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de listado de docs fallida: ${result.error.message}`);
    }
    return result.data;
  }

  async query(payload: { question: string; sede_id?: string; from?: string; to?: string }) {
    const response = await axiosLlmClient.post(LLM_ENDPOINTS.QUERY, payload);
    const result = QueryResponseSchema.safeParse(response.data);
    if (!result.success) {
      throw new ApiValidationError(`Validación de query fallida: ${result.error.message}`);
    }
    return result.data;
  }
}

export const inteligenciaRepository = new HttpInteligenciaRepository();
