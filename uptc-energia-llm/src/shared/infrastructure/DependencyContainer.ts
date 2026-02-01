import { Pool } from 'pg';
import { appConfig } from '../config/index.js';
import { PinoLoggerAdapter } from './PinoLoggerAdapter.js';
import { PostgresPool } from './PostgresPool.js';
import { HttpEnergyApiAdapter } from './HttpEnergyApiAdapter.js';
import { PostgresRulesRepository } from './PostgresRulesRepository.js';
import { PostgresAlertsRepository } from './PostgresAlertsRepository.js';
import { PostgresKnowledgeRepository } from './PostgresKnowledgeRepository.js';
import { PostgresBaselineRepository } from './PostgresBaselineRepository.js';
import { OpenAILLMAdapter } from './OpenAILLMAdapter.js';
import { PgVectorAdapter } from './PgVectorAdapter.js';
import { SchedulerService } from './SchedulerService.js';

// Use cases
import { IngestRecentReadings } from '../../features/ingestion/application/IngestRecentReadings.js';
import { EvaluateRules } from '../../features/rules/application/EvaluateRules.js';
import { ExplainAlert } from '../../features/explainability/application/ExplainAlert.js';
import { GenerateRecommendation } from '../../features/rag/application/GenerateRecommendation.js';
import { IndexDocument } from '../../features/rag/application/IndexDocument.js';
import { DetectAnomalies } from '../../features/analytics/application/DetectAnomalies.js';
import { ForecastConsumption } from '../../features/analytics/application/ForecastConsumption.js';
import { RecalculateBaselines } from '../../features/analytics/application/RecalculateBaselines.js';
import { QueryNaturalLanguage } from '../../features/analytics/application/QueryNaturalLanguage.js';

// Controllers
import { AlertsController } from '../../interfaces/http/controllers/AlertsController.js';
import { RulesController } from '../../interfaces/http/controllers/RulesController.js';
import { RecommendationsController } from '../../interfaces/http/controllers/RecommendationsController.js';
import { IngestionController } from '../../interfaces/http/controllers/IngestionController.js';
import { AnalyticsController } from '../../interfaces/http/controllers/AnalyticsController.js';
import { DocsController } from '../../interfaces/http/controllers/DocsController.js';
import { QueryController } from '../../interfaces/http/controllers/QueryController.js';

export class DependencyContainer {
  // Infrastructure
  public readonly logger: PinoLoggerAdapter;
  public readonly postgresPool: PostgresPool;
  public readonly pool: Pool;
  public readonly scheduler: SchedulerService;

  // Adapters
  public readonly energyApi: HttpEnergyApiAdapter;
  public readonly rulesRepository: PostgresRulesRepository;
  public readonly alertsRepository: PostgresAlertsRepository;
  public readonly knowledgeRepository: PostgresKnowledgeRepository;
  public readonly baselineRepository: PostgresBaselineRepository;
  public readonly llm: OpenAILLMAdapter;
  public readonly vectorStore: PgVectorAdapter;

  // Use cases
  public readonly ingestRecentReadings: IngestRecentReadings;
  public readonly evaluateRules: EvaluateRules;
  public readonly explainAlert: ExplainAlert;
  public readonly generateRecommendation: GenerateRecommendation;
  public readonly indexDocument: IndexDocument;
  public readonly detectAnomalies: DetectAnomalies;
  public readonly forecastConsumption: ForecastConsumption;
  public readonly recalculateBaselines: RecalculateBaselines;
  public readonly queryNaturalLanguage: QueryNaturalLanguage;

  // Controllers
  public readonly alertsController: AlertsController;
  public readonly rulesController: RulesController;
  public readonly recommendationsController: RecommendationsController;
  public readonly ingestionController: IngestionController;
  public readonly analyticsController: AnalyticsController;
  public readonly docsController: DocsController;
  public readonly queryController: QueryController;

  constructor() {
    // Initialize logger first
    this.logger = new PinoLoggerAdapter({
      level: appConfig.logLevel,
      transport:
        appConfig.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });

    this.logger.info('Initializing dependency container', {
      environment: appConfig.nodeEnv,
    });

    // Initialize database pool
    this.postgresPool = new PostgresPool(
      appConfig.databaseUrl,
      appConfig.databaseSchema,
      {
        min: appConfig.databasePoolMin,
        max: appConfig.databasePoolMax,
      },
      this.logger
    );

    this.pool = this.postgresPool.getPool();

    // Initialize adapters
    this.energyApi = new HttpEnergyApiAdapter(
      appConfig.energyApiBaseUrl,
      appConfig.energyApiTimeout,
      this.logger
    );

    this.rulesRepository = new PostgresRulesRepository(
      this.pool,
      appConfig.databaseSchema,
      this.logger
    );

    this.alertsRepository = new PostgresAlertsRepository(
      this.pool,
      appConfig.databaseSchema,
      this.logger
    );

    this.knowledgeRepository = new PostgresKnowledgeRepository(
      this.pool,
      appConfig.databaseSchema,
      this.logger
    );

    this.baselineRepository = new PostgresBaselineRepository(
      this.pool,
      appConfig.databaseSchema,
      this.logger
    );

    this.llm = new OpenAILLMAdapter(
      appConfig.llmBaseUrl,
      appConfig.llmApiKey,
      appConfig.llmModel,
      appConfig.embeddingsModel,
      appConfig.llmTemperature,
      appConfig.llmMaxTokens,
      this.logger
    );

    this.vectorStore = new PgVectorAdapter(
      this.pool,
      appConfig.databaseSchema,
      this.logger
    );

    // Initialize use cases
    this.ingestRecentReadings = new IngestRecentReadings(this.energyApi, this.logger);

    this.evaluateRules = new EvaluateRules(
      this.rulesRepository,
      this.alertsRepository,
      this.logger
    );

    this.explainAlert = new ExplainAlert(
      this.alertsRepository,
      this.rulesRepository,
      this.logger
    );

    this.generateRecommendation = new GenerateRecommendation(
      this.alertsRepository,
      this.llm,
      this.vectorStore,
      this.knowledgeRepository,
      appConfig.ragTopK,
      this.logger
    );

    this.indexDocument = new IndexDocument(
      this.knowledgeRepository,
      this.vectorStore,
      this.llm,
      {
        chunkSize: appConfig.ragChunkSize,
        chunkOverlap: appConfig.ragChunkOverlap,
      },
      this.logger
    );

    this.detectAnomalies = new DetectAnomalies(
      this.energyApi,
      this.alertsRepository,
      this.logger
    );

    this.forecastConsumption = new ForecastConsumption(
      this.energyApi,
      this.logger
    );

    this.recalculateBaselines = new RecalculateBaselines(
      this.energyApi,
      this.baselineRepository,
      this.logger
    );

    // Initialize controllers
    this.alertsController = new AlertsController(
      this.alertsRepository,
      this.explainAlert,
      this.logger
    );

    this.rulesController = new RulesController(this.rulesRepository, this.logger);

    this.recommendationsController = new RecommendationsController(
      this.generateRecommendation,
      this.logger
    );

    this.ingestionController = new IngestionController(
      this.ingestRecentReadings,
      this.evaluateRules,
      this.logger
    );

    this.analyticsController = new AnalyticsController(
      this.detectAnomalies,
      this.forecastConsumption,
      this.recalculateBaselines,
      this.energyApi,
      this.alertsRepository,
      this.logger
    );

    this.docsController = new DocsController(
      this.knowledgeRepository,
      this.indexDocument,
      this.logger
    );

    this.queryNaturalLanguage = new QueryNaturalLanguage(
      this.energyApi,
      this.llm,
      this.logger
    );

    this.queryController = new QueryController(
      this.queryNaturalLanguage,
      this.logger
    );

    // Initialize scheduler
    this.scheduler = new SchedulerService(
      {
        cronIngest: appConfig.cronIngest,
        cronEval: appConfig.cronEval,
        cronReindex: appConfig.cronReindex,
        cronBaseline: appConfig.cronBaseline,
        enableRulesEngine: appConfig.enableRulesEngine,
      },
      this.ingestRecentReadings,
      this.evaluateRules,
      this.knowledgeRepository,
      this.indexDocument,
      this.recalculateBaselines,
      this.logger
    );

    this.logger.info('Dependency container initialized successfully');
  }

  async healthCheck(): Promise<{
    database: boolean;
    energyApi: boolean;
  }> {
    const [database, energyApiHealth] = await Promise.allSettled([
      this.postgresPool.healthCheck(),
      this.energyApi.healthCheck(),
    ]);

    return {
      database: database.status === 'fulfilled' && database.value,
      energyApi: energyApiHealth.status === 'fulfilled',
    };
  }

  async close(): Promise<void> {
    this.logger.info('Closing dependency container');
    this.scheduler.stop();
    await this.postgresPool.close();
    this.logger.info('Dependency container closed');
  }

  startScheduler(): void {
    this.scheduler.start();
  }

  getSchedulerStatus() {
    return this.scheduler.getStatus();
  }
}
