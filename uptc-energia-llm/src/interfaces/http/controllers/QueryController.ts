import { FastifyRequest, FastifyReply } from 'fastify';
import { QueryNaturalLanguage, QueryRequest } from '../../../features/analytics/application/QueryNaturalLanguage.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export class QueryController {
  constructor(
    private readonly queryNaturalLanguage: QueryNaturalLanguage,
    private readonly logger: LoggerPort
  ) {}

  async query(
    request: FastifyRequest<{
      Body: {
        question: string;
        sede_id?: string;
        from?: string;
        to?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { question, sede_id, from, to } = request.body;

      if (!question || question.trim().length === 0) {
        return reply.status(400).send({
          error: 'Question is required',
        });
      }

      const queryRequest: QueryRequest = {
        question: question.trim(),
        sedeId: sede_id,
        dateRange:
          from && to
            ? {
                from: new Date(from),
                to: new Date(to),
              }
            : undefined,
      };

      const response = await this.queryNaturalLanguage.execute(queryRequest);

      return reply.send(response);
    } catch (error) {
      this.logger.error('Failed to process query', error as Error);
      return reply.status(500).send({
        error: 'Failed to process query',
        message: (error as Error).message,
      });
    }
  }
}
