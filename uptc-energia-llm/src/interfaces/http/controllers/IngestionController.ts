import { FastifyRequest, FastifyReply } from 'fastify';
import { IngestRecentReadings, IngestRecentReadingsRequest } from '../../../features/ingestion/application/IngestRecentReadings.js';
import { EvaluateRules } from '../../../features/rules/application/EvaluateRules.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export class IngestionController {
  constructor(
    private readonly ingestRecentReadings: IngestRecentReadings,
    private readonly evaluateRules: EvaluateRules,
    private readonly logger: LoggerPort
  ) {}

  async runIngestion(
    request: FastifyRequest<{
      Body?: {
        sede_id?: string;
        hours_back?: number;
        evaluate_rules?: boolean;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const ingestRequest: IngestRecentReadingsRequest = {
        sedeId: request.body?.sede_id,
        hoursBack: request.body?.hours_back,
      };

      const shouldEvaluate = request.body?.evaluate_rules !== false;

      this.logger.info('Manual ingestion triggered', {
        sedeId: ingestRequest.sedeId || 'all',
        hoursBack: ingestRequest.hoursBack || 24,
        evaluateRules: shouldEvaluate,
      });

      // Run ingestion
      const ingestionResult = await this.ingestRecentReadings.execute(ingestRequest);

      let evaluationResult;

      // Optionally evaluate rules
      if (shouldEvaluate) {
        this.logger.info('Running rules evaluation after ingestion');

        const readings = await this.ingestRecentReadings.getReadingsForEvaluation(ingestRequest);

        evaluationResult = await this.evaluateRules.execute(readings, {
          sedeId: ingestRequest.sedeId,
        });
      }

      return reply.send({
        ingestion: ingestionResult,
        evaluation: evaluationResult || null,
        message: 'Ingestion completed successfully',
      });
    } catch (error) {
      this.logger.error('Ingestion failed', error as Error);
      return reply.status(500).send({
        error: 'Ingestion failed',
        message: (error as Error).message,
      });
    }
  }

  async getIngestionStatus(_request: FastifyRequest, reply: FastifyReply) {
    try {
      // For MVP, return basic status
      // In production, this could fetch from a job status table
      return reply.send({
        status: 'idle',
        lastRun: null,
        nextScheduledRun: 'Based on CRON schedule',
        message: 'Manual ingestion available via POST /llm/ingestion/run',
      });
    } catch (error) {
      this.logger.error('Failed to get ingestion status', error as Error);
      return reply.status(500).send({
        error: 'Failed to get ingestion status',
        message: (error as Error).message,
      });
    }
  }
}
