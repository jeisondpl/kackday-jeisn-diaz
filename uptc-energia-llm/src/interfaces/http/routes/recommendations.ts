import { FastifyInstance } from 'fastify';
import { RecommendationsController } from '../controllers/RecommendationsController.js';

export async function recommendationsRoutes(
  fastify: FastifyInstance,
  controller: RecommendationsController
) {
  // POST /llm/recommendations/alerts/:alertId - Generate recommendation for alert
  fastify.post(
    '/llm/recommendations/alerts/:alertId',
    {
      schema: {
        tags: ['recommendations'],
        summary: 'Generate AI recommendation for alert',
        params: {
          type: 'object',
          required: ['alertId'],
          properties: {
            alertId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            context: { type: 'string', description: 'Additional context for recommendation' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              alertId: { type: 'number' },
              summary: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              expectedSavings: { type: 'object' },
              why: { type: 'array', items: { type: 'string' } },
              sources: { type: 'array' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    (req, reply) => controller.generateForAlert(req as any, reply)
  );
}
