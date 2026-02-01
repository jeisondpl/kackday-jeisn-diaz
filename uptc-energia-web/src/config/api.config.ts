export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
} as const;

export const LLM_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_LLM_API_URL || 'http://localhost:3001',
  TIMEOUT: 120000,
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  SEDES: '/sedes',
  CONSUMOS: '/consumos',
  STATS: {
    DIARIO: '/stats/diario',
    SECTOR: '/stats/sector',
    HORARIO: '/stats/horario',
    PERIODO: '/stats/periodo',
    SUMMARY: '/stats/summary',
  },
} as const;

export const LLM_ENDPOINTS = {
  HEALTH: '/llm/health',
  ALERTS: '/llm/alerts',
  ALERT_EXPLANATION: (id: number) => `/llm/alerts/${id}/explanation`,
  ALERT_ACK: (id: number) => `/llm/alerts/${id}/ack`,
  RECOMMENDATION: (id: number) => `/llm/recommendations/alerts/${id}`,
  QUERY: '/llm/query',
  ANALYTICS: {
    SUMMARY: '/llm/analytics/summary',
    ANOMALIES: '/llm/analytics/anomalies',
    FORECAST: '/llm/analytics/forecast',
    BASELINE: '/llm/analytics/baseline',
    RECALCULATE_BASELINE: '/llm/analytics/baseline/recalculate',
  },
  DOCS: '/llm/docs',
} as const;
