import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Application
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // UPTC Energy API
  energyApiBaseUrl: z.string().url().default('http://localhost:3000'),

  // Database
  databaseUrl: z.string().optional(),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    database: z.string().default('uptc_energia'),
    user: z.string().default('uptc_admin'),
    password: z.string().default('uptc_password'),
  }),

  // LLM
  llm: z.object({
    baseUrl: z.string().url().default('http://localhost:1234/v1'),
    apiKey: z.string().default('lm-studio'),
    model: z.string().default('local-model'),
    temperature: z.coerce.number().min(0).max(2).default(0.7),
    maxTokens: z.coerce.number().default(2000),
  }),

  // Embeddings
  embeddings: z.object({
    model: z.string().default('text-embedding-3-small'),
    dimensions: z.coerce.number().default(1536),
  }),

  // RAG
  rag: z.object({
    topK: z.coerce.number().default(5),
    chunkSize: z.coerce.number().default(1000),
    chunkOverlap: z.coerce.number().default(200),
    vectorStoreType: z.enum(['pgvector', 'chroma']).default('pgvector'),
  }),

  // Scheduling
  cron: z.object({
    ingest: z.string().default('*/15 * * * *'),
    eval: z.string().default('*/5 * * * *'),
    reindex: z.string().default('0 2 * * *'),
    recalibrate: z.string().default('0 3 * * *'),
  }),

  // Analytics
  analytics: z.object({
    baselineLookbackDays: z.coerce.number().default(30),
    anomalyThresholdSigma: z.coerce.number().default(2.5),
    forecastHorizonHours: z.coerce.number().default(24),
  }),

  // Alerts
  alerts: z.object({
    retentionDays: z.coerce.number().default(90),
    duplicateWindowHours: z.coerce.number().default(24),
  }),
});

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  logLevel: process.env.LOG_LEVEL,
  energyApiBaseUrl: process.env.ENERGY_API_BASE_URL,
  databaseUrl: process.env.DATABASE_URL,
  database: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
  llm: {
    baseUrl: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL,
    temperature: process.env.LLM_TEMPERATURE,
    maxTokens: process.env.LLM_MAX_TOKENS,
  },
  embeddings: {
    model: process.env.EMBEDDINGS_MODEL,
    dimensions: process.env.EMBEDDINGS_DIMENSIONS,
  },
  rag: {
    topK: process.env.RAG_TOP_K,
    chunkSize: process.env.RAG_CHUNK_SIZE,
    chunkOverlap: process.env.RAG_CHUNK_OVERLAP,
    vectorStoreType: process.env.VECTOR_STORE_TYPE,
  },
  cron: {
    ingest: process.env.CRON_INGEST,
    eval: process.env.CRON_EVAL,
    reindex: process.env.CRON_REINDEX,
    recalibrate: process.env.CRON_RECALIBRATE,
  },
  analytics: {
    baselineLookbackDays: process.env.BASELINE_LOOKBACK_DAYS,
    anomalyThresholdSigma: process.env.ANOMALY_THRESHOLD_SIGMA,
    forecastHorizonHours: process.env.FORECAST_HORIZON_HOURS,
  },
  alerts: {
    retentionDays: process.env.ALERT_RETENTION_DAYS,
    duplicateWindowHours: process.env.ALERT_DUPLICATE_WINDOW_HOURS,
  },
};

export const config = configSchema.parse(rawConfig);

export default config;
