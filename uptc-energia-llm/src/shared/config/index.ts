import { config } from 'dotenv';
import { z } from 'zod';

config();

const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),
  logLevel: z.string().default('info'),

  // UPTC Energy API
  energyApiBaseUrl: z.string().url().default('http://localhost:3000'),
  energyApiTimeout: z.coerce.number().default(30000),

  // Database
  databaseUrl: z.string().url(),
  databaseSchema: z.string().default('uptc_llm'),
  databasePoolMin: z.coerce.number().default(2),
  databasePoolMax: z.coerce.number().default(10),

  // LLM
  llmBaseUrl: z.string().url().default('http://localhost:1234/v1'),
  llmApiKey: z.string().default('lm-studio'),
  llmModel: z.string().default('local-model'),
  llmTemperature: z.coerce.number().default(0.2),
  llmMaxTokens: z.coerce.number().default(2048),

  // Embeddings
  embeddingsModel: z.string().default('nomic-embed-text'),
  embeddingsDimensions: z.coerce.number().default(768),

  // Vector Store
  vectorStoreType: z.enum(['pgvector', 'chroma']).default('pgvector'),
  chromaUrl: z.string().url().optional(),

  // RAG
  ragTopK: z.coerce.number().default(5),
  ragChunkSize: z.coerce.number().default(1000),
  ragChunkOverlap: z.coerce.number().default(200),
  ragMinSimilarity: z.coerce.number().default(0.7),

  // Scheduling
  cronIngest: z.string().default('*/15 * * * *'),
  cronEval: z.string().default('*/5 * * * *'),
  cronReindex: z.string().default('0 2 * * *'),
  cronBaseline: z.string().default('0 3 * * *'),

  // Rules Engine
  enableRulesEngine: z.coerce.boolean().default(true),
  enableAnomalyDetection: z.coerce.boolean().default(true),
  enableForecasting: z.coerce.boolean().default(true),

  // Alerts
  alertRetentionDays: z.coerce.number().default(90),
  alertDedupWindowMinutes: z.coerce.number().default(60),

  // Analytics
  baselineLookbackDays: z.coerce.number().default(30),
  anomalyZscoreThreshold: z.coerce.number().default(3.0),
  forecastHorizonHours: z.coerce.number().default(24),
});

const parseConfig = () => {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    energyApiBaseUrl: process.env.ENERGY_API_BASE_URL,
    energyApiTimeout: process.env.ENERGY_API_TIMEOUT,
    databaseUrl: process.env.DATABASE_URL,
    databaseSchema: process.env.DATABASE_SCHEMA,
    databasePoolMin: process.env.DATABASE_POOL_MIN,
    databasePoolMax: process.env.DATABASE_POOL_MAX,
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmApiKey: process.env.LLM_API_KEY,
    llmModel: process.env.LLM_MODEL,
    llmTemperature: process.env.LLM_TEMPERATURE,
    llmMaxTokens: process.env.LLM_MAX_TOKENS,
    embeddingsModel: process.env.EMBEDDINGS_MODEL,
    embeddingsDimensions: process.env.EMBEDDINGS_DIMENSIONS,
    vectorStoreType: process.env.VECTOR_STORE_TYPE,
    chromaUrl: process.env.CHROMA_URL,
    ragTopK: process.env.RAG_TOP_K,
    ragChunkSize: process.env.RAG_CHUNK_SIZE,
    ragChunkOverlap: process.env.RAG_CHUNK_OVERLAP,
    ragMinSimilarity: process.env.RAG_MIN_SIMILARITY,
    cronIngest: process.env.CRON_INGEST,
    cronEval: process.env.CRON_EVAL,
    cronReindex: process.env.CRON_REINDEX,
    cronBaseline: process.env.CRON_BASELINE,
    enableRulesEngine: process.env.ENABLE_RULES_ENGINE,
    enableAnomalyDetection: process.env.ENABLE_ANOMALY_DETECTION,
    enableForecasting: process.env.ENABLE_FORECASTING,
    alertRetentionDays: process.env.ALERT_RETENTION_DAYS,
    alertDedupWindowMinutes: process.env.ALERT_DEDUP_WINDOW_MINUTES,
    baselineLookbackDays: process.env.BASELINE_LOOKBACK_DAYS,
    anomalyZscoreThreshold: process.env.ANOMALY_ZSCORE_THRESHOLD,
    forecastHorizonHours: process.env.FORECAST_HORIZON_HOURS,
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('Configuration validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
};

export const appConfig = parseConfig();
export type AppConfig = z.infer<typeof configSchema>;
