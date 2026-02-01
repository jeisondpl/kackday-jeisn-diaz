import { FastifyInstance } from 'fastify';
import { QueryController } from '../controllers/QueryController.js';

export async function queryRoutes(fastify: FastifyInstance, controller: QueryController) {
  // POST /llm/query - Natural language query
  fastify.post(
    '/llm/query',
    {
      schema: {
        tags: ['query'],
        summary: 'Ask a question in natural language about energy data',
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: {
              type: 'string',
              description: 'Question in natural language (Spanish)',
            },
            sede_id: {
              type: 'string',
              description: 'Filter by sede (optional)',
            },
            from: {
              type: 'string',
              format: 'date-time',
              description: 'Start date for analysis (optional)',
            },
            to: {
              type: 'string',
              format: 'date-time',
              description: 'End date for analysis (optional)',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              data: { type: 'object' },
              sources: {
                type: 'array',
                items: { type: 'string' },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    (req, reply) => controller.query(req as any, reply)
  );
}
