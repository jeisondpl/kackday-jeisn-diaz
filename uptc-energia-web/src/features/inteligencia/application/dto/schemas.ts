import { z } from 'zod';

export const AlertSchema = z.object({
  id: z.number(),
  fingerprint: z.string(),
  ruleId: z.number().nullable().optional(),
  sedeId: z.string(),
  sector: z.string().optional().nullable(),
  metric: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'acknowledged', 'resolved']),
  message: z.string(),
  windowStart: z.string().optional().nullable(),
  windowEnd: z.string().optional().nullable(),
  createdAt: z.string(),
  acknowledgedAt: z.string().optional().nullable(),
  acknowledgedBy: z.string().optional().nullable(),
});

export const AlertEvidenceSchema = z.object({
  id: z.number().optional(),
  alertId: z.number().optional(),
  values: z.record(z.string(), z.unknown()).optional(),
  baseline: z.record(z.string(), z.unknown()).optional(),
  delta: z.record(z.string(), z.unknown()).optional(),
  anomalyScore: z.number().optional(),
  forecast: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
});

export const AlertExplanationSchema = z.object({
  alert: AlertSchema,
  rule: z
    .object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional().nullable(),
      type: z.string(),
    })
    .optional(),
  evidence: z.array(AlertEvidenceSchema),
  explanation: z.object({
    summary: z.string(),
    details: z.array(z.string()),
    metrics: z.record(z.string(), z.unknown()),
  }),
});

export const AlertsListSchema = z.object({
  data: z.array(AlertSchema),
  pagination: z.object({
    limit: z.number(),
    offset: z.number(),
    count: z.number(),
  }),
});

export const AnomalySchema = z.object({
  timestamp: z.string(),
  sedeId: z.string(),
  sector: z.string().optional().nullable(),
  metric: z.string(),
  value: z.number(),
  mean: z.number(),
  stdDev: z.number(),
  zScore: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export const AnomalyResponseSchema = z.object({
  anomalies: z.array(AnomalySchema),
  totalReadings: z.number(),
  anomaliesCount: z.number(),
  threshold: z.number(),
  timeRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

export const ForecastPointSchema = z.object({
  timestamp: z.string(),
  hour: z.number(),
  dayOfWeek: z.number(),
  predicted: z.number(),
  confidence: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  baseline: z.number(),
  trend: z.number().optional().nullable(),
});

const HistoricalDataSchema = z
  .object({
    mean: z.number().optional(),
    stdDev: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    dataPoints: z.number().optional(),
  })
  .transform((val) => ({
    mean: val.mean ?? 0,
    stdDev: val.stdDev ?? 0,
    min: val.min ?? 0,
    max: val.max ?? 0,
    dataPoints: val.dataPoints ?? 0,
  }));

export const ForecastResponseSchema = z.object({
  sedeId: z.string().optional().nullable(),
  metric: z.string(),
  forecast: z.array(ForecastPointSchema),
  historicalData: z.preprocess((val) => val ?? {}, HistoricalDataSchema),
  method: z.string(),
  generatedAt: z.string(),
});

export const AnalyticsSummarySchema = z.object({
  kpis: z.object({
    totalSedes: z.number(),
    totalConsumo: z.number(),
    avgConsumo: z.number(),
    openAlerts: z.number(),
    criticalAlerts: z.number(),
    anomaliesLast24h: z.number(),
  }),
  sedes: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      totalConsumo: z.number().optional().nullable(),
      promedioConsumo: z.number().optional().nullable(),
    })
  ),
  recentAlerts: z.array(
    z.object({
      id: z.number(),
      severity: z.string(),
      message: z.string(),
      sedeId: z.string(),
      sector: z.string().optional().nullable(),
      createdAt: z.string(),
    })
  ),
  anomalies: z.object({
    count: z.number(),
    threshold: z.number(),
    recent: z.array(AnomalySchema),
  }),
  forecast: z.object({
    next24Hours: z.array(ForecastPointSchema),
    method: z.string(),
    accuracy: z.preprocess((val) => val ?? {}, HistoricalDataSchema),
  }),
  summary: z.record(z.string(), z.unknown()),
  generatedAt: z.string(),
});

export const RecommendationSchema = z.object({
  id: z.number().optional(),
  alertId: z.number().optional(),
  summary: z.string(),
  actions: z.array(z.string()),
  expectedSavings: z
    .object({
      type: z.string(),
      value: z.string(),
    })
    .optional(),
  why: z.array(z.string()),
  sources: z.array(
    z.object({
      docId: z.number(),
      title: z.string(),
      chunkId: z.number().optional(),
    })
  ),
  confidence: z.number().optional(),
  generatedAt: z.string().optional(),
});

export const KnowledgeDocSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  filePath: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  indexed: z.boolean(),
  chunksCount: z.number().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DocsListSchema = z.object({
  docs: z.array(KnowledgeDocSchema),
});

export const CreateDocResponseSchema = z.object({
  doc: KnowledgeDocSchema,
  indexed: z.boolean(),
});

export const BaselineRecalculateSchema = z.object({
  sedeId: z.string().optional().nullable(),
  metric: z.string(),
  lookbackDays: z.number(),
  baselinesSaved: z.number(),
});

export const QueryResponseSchema = z.object({
  question: z.string(),
  answer: z.string(),
  data: z.unknown().optional(),
  sources: z.array(z.string()),
  timestamp: z.string(),
});
