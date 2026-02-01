import { FastifyRequest, FastifyReply } from 'fastify';
import { GenerateRecommendation, RecommendationRequest } from '../../../features/rag/application/GenerateRecommendation.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export class RecommendationsController {
  constructor(
    private readonly generateRecommendation: GenerateRecommendation,
    private readonly logger: LoggerPort
  ) {}

  async generateForAlert(
    request: FastifyRequest<{
      Params: { alertId: string };
      Body?: { context?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const alertId = parseInt(request.params.alertId, 10);

      if (isNaN(alertId)) {
        return reply.status(400).send({ error: 'Invalid alert ID' });
      }

      const recommendationRequest: RecommendationRequest = {
        alertId,
        context: request.body?.context,
      };

      const recommendation = await this.generateRecommendation.execute(recommendationRequest);

      return reply.send(recommendation);
    } catch (error) {
      this.logger.error('Failed to generate recommendation', error as Error);

      if ((error as Error).message.includes('not found')) {
        return reply.status(404).send({
          error: 'Alert not found',
          message: (error as Error).message,
        });
      }

      return reply.status(500).send({
        error: 'Failed to generate recommendation',
        message: (error as Error).message,
      });
    }
  }
}
