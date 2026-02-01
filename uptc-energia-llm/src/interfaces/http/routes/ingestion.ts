import { FastifyInstance } from 'fastify';
import { IngestionController } from '../controllers/IngestionController.js';

export async function ingestionRoutes(fastify: FastifyInstance, controller: IngestionController) {
  // POST /llm/ingestion/run - Trigger manual ingestion
  fastify.post(
    '/llm/ingestion/run',
    {
      schema: {
        tags: ['ingestion'],
        summary: 'Run manual data ingestion',
        body: {
          type: 'object',
          properties: {
            sede_id: { type: 'string', description: 'Filter by sede (optional)' },
            hours_back: { type: 'number', description: 'Hours to look back (default: 24)' },
            evaluate_rules: { type: 'boolean', description: 'Evaluate rules after ingestion (default: true)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              ingestion: {
                type: 'object',
                properties: {
                  readingsCount: { type: 'number' },
                  sedes: { type: 'array', items: { type: 'string' } },
                  timeRange: { type: 'object' },
                },
              },
              evaluation: {
                type: ['object', 'null'],
                properties: {
                  triggeredAlerts: { type: 'array' },
                  rulesEvaluated: { type: 'number' },
                  readingsProcessed: { type: 'number' },
                },
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    (req, reply) => controller.runIngestion(req as any, reply)
  );

  // GET /llm/ingestion/status - Get ingestion status
  fastify.get(
    '/llm/ingestion/status',
    {
      schema: {
        tags: ['ingestion'],
        summary: 'Get ingestion status',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              lastRun: { type: ['string', 'null'], format: 'date-time' },
              nextScheduledRun: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    (req, reply) => controller.getIngestionStatus(req as any, reply)
  );
}
