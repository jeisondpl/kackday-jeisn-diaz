import { create } from 'zustand';
import type { LoadingState } from '@core/shared/types/api.types.ts';
import { handleApiError } from '@core/shared/utils/errorHandler.ts';
import type { AnalyticsSummary } from '../../domain/entities/AnalyticsSummary.ts';
import type { AnomalyResponse } from '../../domain/entities/Anomaly.ts';
import type { ForecastResponse } from '../../domain/entities/Forecast.ts';
import type { LlmAlert, AlertExplanation } from '../../domain/entities/Alert.ts';
import type { Recommendation } from '../../domain/entities/Recommendation.ts';
import type { KnowledgeDoc } from '../../domain/entities/KnowledgeDoc.ts';
import type { AlertsFilters, AnalyticsFilters, DocsFilters } from '../../domain/interfaces/IInteligenciaRepository.ts';
import { inteligenciaRepository } from '../../infrastructure/HttpInteligenciaRepository.ts';

interface InteligenciaFilters {
  sede_id: string;
  sector: string;
  metric: string;
  hours: number;
  lookback_days: number;
  threshold: number;
}

interface InteligenciaState {
  filters: InteligenciaFilters;

  summary: AnalyticsSummary | null;
  summaryStatus: LoadingState;
  summaryError: string | null;

  anomalies: AnomalyResponse | null;
  anomaliesStatus: LoadingState;
  anomaliesError: string | null;

  forecast: ForecastResponse | null;
  forecastStatus: LoadingState;
  forecastError: string | null;

  alerts: LlmAlert[];
  alertsStatus: LoadingState;
  alertsError: string | null;

  explanation: AlertExplanation | null;
  explanationStatus: LoadingState;
  explanationError: string | null;

  recommendation: Recommendation | null;
  recommendationStatus: LoadingState;
  recommendationError: string | null;

  docs: KnowledgeDoc[];
  docsStatus: LoadingState;
  docsError: string | null;

  query: {
    question: string;
    answer: string;
    data?: unknown;
    sources: string[];
    timestamp: string;
  } | null;
  queryStatus: LoadingState;
  queryError: string | null;

  // actions
  setFilters: (filters: Partial<InteligenciaFilters>) => void;
  fetchSummary: (filters?: { sede_id?: string }) => Promise<void>;
  fetchAnomalies: (filters?: AnalyticsFilters) => Promise<void>;
  fetchForecast: (filters?: AnalyticsFilters) => Promise<void>;
  fetchAlerts: (filters?: AlertsFilters) => Promise<void>;
  fetchExplanation: (alertId: number) => Promise<void>;
  generateRecommendation: (alertId: number) => Promise<void>;
  recalcBaseline: (filters?: { sede_id?: string; metric?: string; lookback_days?: number }) => Promise<void>;
  listDocs: (filters?: DocsFilters) => Promise<void>;
  createDoc: (payload: {
    title: string;
    content?: string;
    file_path?: string;
    sector?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    index?: boolean;
  }) => Promise<void>;
  askQuestion: (payload: { question: string; sede_id?: string; from?: string; to?: string }) => Promise<void>;
  fetchAll: () => Promise<void>;
}

const initialFilters: InteligenciaFilters = {
  sede_id: '',
  sector: '',
  metric: 'energiaTotal',
  hours: 24,
  lookback_days: 30,
  threshold: 3,
};

export const useInteligenciaStore = create<InteligenciaState>((set, get) => ({
  filters: initialFilters,

  summary: null,
  summaryStatus: 'idle',
  summaryError: null,

  anomalies: null,
  anomaliesStatus: 'idle',
  anomaliesError: null,

  forecast: null,
  forecastStatus: 'idle',
  forecastError: null,

  alerts: [],
  alertsStatus: 'idle',
  alertsError: null,

  explanation: null,
  explanationStatus: 'idle',
  explanationError: null,

  recommendation: null,
  recommendationStatus: 'idle',
  recommendationError: null,

  docs: [],
  docsStatus: 'idle',
  docsError: null,

  query: null,
  queryStatus: 'idle',
  queryError: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  fetchSummary: async (filters) => {
    set({ summaryStatus: 'loading', summaryError: null });
    try {
      const current = get().filters;
      const summary = await inteligenciaRepository.getSummary({
        sede_id: filters?.sede_id ?? (current.sede_id || undefined),
      });
      set({ summary, summaryStatus: 'success' });
    } catch (error) {
      set({ summaryStatus: 'error', summaryError: handleApiError(error) });
    }
  },

  fetchAnomalies: async (filters) => {
    set({ anomaliesStatus: 'loading', anomaliesError: null });
    try {
      const current = get().filters;
      const payload: AnalyticsFilters = {
        sede_id: filters?.sede_id ?? (current.sede_id || undefined),
        metric: filters?.metric ?? current.metric,
        hours: filters?.hours ?? current.hours,
        threshold: filters?.threshold ?? current.threshold,
      };
      const anomalies = await inteligenciaRepository.getAnomalies(payload);
      set({ anomalies, anomaliesStatus: 'success' });
    } catch (error) {
      set({ anomaliesStatus: 'error', anomaliesError: handleApiError(error) });
    }
  },

  fetchForecast: async (filters) => {
    set({ forecastStatus: 'loading', forecastError: null });
    try {
      const current = get().filters;
      const payload: AnalyticsFilters = {
        sede_id: filters?.sede_id ?? (current.sede_id || undefined),
        metric: filters?.metric ?? current.metric,
        hours: filters?.hours ?? current.hours,
        lookback_days: filters?.lookback_days ?? current.lookback_days,
      };
      const forecast = await inteligenciaRepository.getForecast(payload);
      set({ forecast, forecastStatus: 'success' });
    } catch (error) {
      set({ forecastStatus: 'error', forecastError: handleApiError(error) });
    }
  },

  fetchAlerts: async (filters) => {
    set({ alertsStatus: 'loading', alertsError: null });
    try {
      const payload: AlertsFilters = {
        ...filters,
        sector: filters?.sector ?? (get().filters.sector || undefined),
        limit: filters?.limit ?? 20,
      };
      const response = await inteligenciaRepository.listAlerts(payload);
      set({ alerts: response.data, alertsStatus: 'success' });
    } catch (error) {
      set({ alertsStatus: 'error', alertsError: handleApiError(error) });
    }
  },

  fetchExplanation: async (alertId) => {
    set({ explanationStatus: 'loading', explanationError: null });
    try {
      const explanation = await inteligenciaRepository.getAlertExplanation(alertId);
      set({ explanation, explanationStatus: 'success' });
    } catch (error) {
      set({ explanationStatus: 'error', explanationError: handleApiError(error) });
    }
  },

  generateRecommendation: async (alertId) => {
    set({ recommendationStatus: 'loading', recommendationError: null });
    try {
      const recommendation = await inteligenciaRepository.generateRecommendation(alertId);
      set({ recommendation, recommendationStatus: 'success' });
    } catch (error) {
      set({ recommendationStatus: 'error', recommendationError: handleApiError(error) });
    }
  },

  recalcBaseline: async (filters) => {
    set({ anomaliesStatus: 'loading', anomaliesError: null });
    try {
      const result = await inteligenciaRepository.recalculateBaseline(filters);
      set({ anomaliesStatus: 'success' });
      return result;
    } catch (error) {
      set({ anomaliesStatus: 'error', anomaliesError: handleApiError(error) });
      return undefined;
    }
  },

  listDocs: async (filters) => {
    set({ docsStatus: 'loading', docsError: null });
    try {
      const response = await inteligenciaRepository.listDocs(filters);
      set({ docs: response.docs, docsStatus: 'success' });
    } catch (error) {
      set({ docsStatus: 'error', docsError: handleApiError(error) });
    }
  },

  createDoc: async (payload) => {
    set({ docsStatus: 'loading', docsError: null });
    try {
      await inteligenciaRepository.createDoc(payload);
      const docs = await inteligenciaRepository.listDocs();
      set({ docs: docs.docs, docsStatus: 'success' });
    } catch (error) {
      set({ docsStatus: 'error', docsError: handleApiError(error) });
    }
  },

  askQuestion: async (payload) => {
    set({ queryStatus: 'loading', queryError: null });
    try {
      const result = await inteligenciaRepository.query(payload);
      set({ query: result, queryStatus: 'success' });
    } catch (error) {
      set({ queryStatus: 'error', queryError: handleApiError(error) });
    }
  },

  fetchAll: async () => {
    const { fetchSummary, fetchAnomalies, fetchForecast, fetchAlerts } = get();
    await Promise.all([
      fetchSummary(),
      fetchAnomalies(),
      fetchForecast(),
      fetchAlerts({}),
    ]);
  },
}));

export const selectInteligenciaFilters = (state: InteligenciaState) => state.filters;
