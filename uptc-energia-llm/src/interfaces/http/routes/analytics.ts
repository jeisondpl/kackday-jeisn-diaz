import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/AnalyticsController.js';

export async function analyticsRoutes(
  fastify: FastifyInstance,
  controller: AnalyticsController
) {
  // GET /llm/analytics/anomalies
  fastify.get(
    '/llm/analytics/anomalies',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Detect anomalies in recent energy readings',
        querystring: {
          type: 'object',
          properties: {
            sede_id: { type: 'string' },
            metric: { type: 'string', default: 'energiaTotal' },
            hours: { type: 'number', default: 24 },
            threshold: { type: 'number', default: 3.0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              anomalies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'string', format: 'date-time' },
                    sedeId: { type: 'string' },
                    sector: { type: 'string' },
                    metric: { type: 'string' },
                    value: { type: 'number' },
                    mean: { type: 'number' },
                    stdDev: { type: 'number' },
                    zScore: { type: 'number' },
                    severity: { type: 'string' },
                  },
                },
              },
              totalReadings: { type: 'number' },
              anomaliesCount: { type: 'number' },
              threshold: { type: 'number' },
              timeRange: {
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date-time' },
                  to: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    (req, reply) => controller.getAnomalies(req as any, reply)
  );

  // GET /llm/analytics/forecast
  fastify.get(
    '/llm/analytics/forecast',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Forecast energy consumption for next hours',
        querystring: {
          type: 'object',
          properties: {
            sede_id: { type: 'string' },
            metric: { type: 'string', default: 'energiaTotal' },
            hours: { type: 'number', default: 24 },
            lookback_days: { type: 'number', default: 30 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              sedeId: { type: 'string' },
              metric: { type: 'string' },
              forecast: { type: 'array' },
              historicalData: { type: 'object' },
              method: { type: 'string' },
              generatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    (req, reply) => controller.getForecast(req as any, reply)
  );

  // GET /llm/analytics/summary
  fastify.get(
    '/llm/analytics/summary',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Analytics summary with KPIs, anomalies and forecast',
        querystring: {
          type: 'object',
          properties: {
            sede_id: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.getSummary(req as any, reply)
  );

  // GET /llm/analytics/baseline
  fastify.get(
    '/llm/analytics/baseline',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Baseline model by hour and weekday',
        querystring: {
          type: 'object',
          properties: {
            sede_id: { type: 'string' },
            metric: { type: 'string', default: 'energiaTotal' },
            days: { type: 'number', default: 30 },
          },
        },
      },
    },
    (req, reply) => controller.getBaseline(req as any, reply)
  );

  // POST /llm/analytics/baseline/recalculate
  fastify.post(
    '/llm/analytics/baseline/recalculate',
    {
      schema: {
        tags: ['analytics'],
        summary: 'Recalculate baselines and persist them',
        body: {
          type: 'object',
          properties: {
            sede_id: { type: 'string' },
            metric: { type: 'string', default: 'energiaTotal' },
            lookback_days: { type: 'number', default: 30 },
          },
        },
      },
    },
    (req, reply) => controller.recalculateBaseline(req as any, reply)
  );
}
