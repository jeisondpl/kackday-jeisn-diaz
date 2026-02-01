import cron from 'node-cron';
import { LoggerPort } from '../application/ports/LoggerPort.js';
import { IngestRecentReadings } from '../../features/ingestion/application/IngestRecentReadings.js';
import { EvaluateRules } from '../../features/rules/application/EvaluateRules.js';
import { IndexDocument } from '../../features/rag/application/IndexDocument.js';
import { RecalculateBaselines } from '../../features/analytics/application/RecalculateBaselines.js';
import { KnowledgeRepositoryPort } from '../application/ports/KnowledgeRepositoryPort.js';
import { SchedulerPort } from '../application/ports/SchedulerPort.js';

export interface SchedulerConfig {
  cronIngest: string;
  cronEval: string;
  cronReindex: string;
  cronBaseline: string;
  enableRulesEngine: boolean;
}

export class SchedulerService implements SchedulerPort {
  private jobs: cron.ScheduledTask[] = [];
  private isRunning = false;

  constructor(
    private readonly config: SchedulerConfig,
    private readonly ingestRecentReadings: IngestRecentReadings,
    private readonly evaluateRules: EvaluateRules,
    private readonly knowledgeRepository: KnowledgeRepositoryPort,
    private readonly indexDocument: IndexDocument,
    private readonly recalculateBaselines: RecalculateBaselines,
    private readonly logger: LoggerPort
  ) {}

  start(): void {
    if (this.isRunning) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.logger.info('Starting scheduler service', {
      cronIngest: this.config.cronIngest,
      cronEval: this.config.cronEval,
    });

    // Job 1: Ingesta automática
    const ingestJob = cron.schedule(
      this.config.cronIngest,
      async () => {
        await this.runIngestionJob();
      },
      {
        scheduled: true,
        timezone: 'America/Bogota',
      }
    );

    this.jobs.push(ingestJob);
    this.logger.info('Ingestion job scheduled', { cron: this.config.cronIngest });

    // Job 2: Evaluación de reglas
    if (this.config.enableRulesEngine) {
      const evalJob = cron.schedule(
        this.config.cronEval,
        async () => {
          await this.runEvaluationJob();
        },
        {
          scheduled: true,
          timezone: 'America/Bogota',
        }
      );

      this.jobs.push(evalJob);
      this.logger.info('Evaluation job scheduled', { cron: this.config.cronEval });
    }

    // Job 3: Reindex knowledge base documents
    const reindexJob = cron.schedule(
      this.config.cronReindex,
      async () => {
        await this.runReindexJob();
      },
      {
        scheduled: true,
        timezone: 'America/Bogota',
      }
    );

    this.jobs.push(reindexJob);
    this.logger.info('Reindex job scheduled', { cron: this.config.cronReindex });

    // Job 4: Baseline recalibration
    const baselineJob = cron.schedule(
      this.config.cronBaseline,
      async () => {
        await this.runBaselineJob();
      },
      {
        scheduled: true,
        timezone: 'America/Bogota',
      }
    );

    this.jobs.push(baselineJob);
    this.logger.info('Baseline recalibration job scheduled', { cron: this.config.cronBaseline });

    this.isRunning = true;
    this.logger.info(`Scheduler started with ${this.jobs.length} jobs`);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping scheduler service');

    for (const job of this.jobs) {
      job.stop();
    }

    this.jobs = [];
    this.isRunning = false;

    this.logger.info('Scheduler stopped');
  }

  private async runIngestionJob(): Promise<void> {
    const jobId = `ingest-${Date.now()}`;

    this.logger.info('Running scheduled ingestion job', { jobId });

    try {
      const result = await this.ingestRecentReadings.execute({
        hoursBack: 1, // Last hour for scheduled jobs
      });

      this.logger.info('Ingestion job completed', {
        jobId,
        readingsCount: result.readingsCount,
        sedes: result.sedes,
      });
    } catch (error) {
      this.logger.error('Ingestion job failed', error as Error, { jobId });
    }
  }

  private async runEvaluationJob(): Promise<void> {
    const jobId = `eval-${Date.now()}`;

    this.logger.info('Running scheduled evaluation job', { jobId });

    try {
      // Get recent readings
      const readings = await this.ingestRecentReadings.getReadingsForEvaluation({
        hoursBack: 1,
      });

      if (readings.length === 0) {
        this.logger.info('No readings to evaluate', { jobId });
        return;
      }

      // Evaluate rules
      const result = await this.evaluateRules.execute(readings);

      this.logger.info('Evaluation job completed', {
        jobId,
        rulesEvaluated: result.rulesEvaluated,
        alertsTriggered: result.triggeredAlerts.length,
        readingsProcessed: result.readingsProcessed,
      });
    } catch (error) {
      this.logger.error('Evaluation job failed', error as Error, { jobId });
    }
  }

  private async runReindexJob(): Promise<void> {
    const jobId = `reindex-${Date.now()}`;
    this.logger.info('Running scheduled reindex job', { jobId });

    try {
      const docs = await this.knowledgeRepository.findAll({
        indexed: false,
        limit: 200,
      });

      if (docs.length === 0) {
        this.logger.info('No documents pending reindex', { jobId });
        return;
      }

      for (const doc of docs) {
        await this.indexDocument.execute(doc.id);
      }

      this.logger.info('Reindex job completed', {
        jobId,
        docsIndexed: docs.length,
      });
    } catch (error) {
      this.logger.error('Reindex job failed', error as Error, { jobId });
    }
  }

  private async runBaselineJob(): Promise<void> {
    const jobId = `baseline-${Date.now()}`;
    this.logger.info('Running scheduled baseline recalibration job', { jobId });

    try {
      const result = await this.recalculateBaselines.execute();
      this.logger.info('Baseline recalibration completed', {
        jobId,
        baselinesSaved: result.baselinesSaved,
      });
    } catch (error) {
      this.logger.error('Baseline recalibration failed', error as Error, { jobId });
    }
  }

  getStatus(): {
    isRunning: boolean;
    jobsCount: number;
    config: SchedulerConfig;
  } {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      config: this.config,
    };
  }
}
