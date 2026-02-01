import { FastifyInstance } from 'fastify';
import { AlertsController } from '../controllers/AlertsController.js';

export async function alertsRoutes(fastify: FastifyInstance, controller: AlertsController) {
  // GET /llm/alerts - List alerts with filters
  fastify.get(
    '/llm/alerts',
    {
      schema: {
        tags: ['alerts'],
        summary: 'List alerts',
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['open', 'acknowledged', 'resolved'] },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            sede_id: { type: 'string' },
            sector: { type: 'string' },
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
            limit: { type: 'number', default: 100 },
            offset: { type: 'number', default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              pagination: {
                type: 'object',
                properties: {
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  count: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    (req, reply) => controller.listAlerts(req as any, reply)
  );

  // GET /llm/alerts/:id - Get single alert
  fastify.get(
    '/llm/alerts/:id',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Get alert by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.getAlert(req as any, reply)
  );

  // POST /llm/alerts/:id/ack - Acknowledge alert
  fastify.post(
    '/llm/alerts/:id/ack',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Acknowledge alert',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['acknowledged_by'],
          properties: {
            acknowledged_by: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.acknowledgeAlert(req as any, reply)
  );

  // GET /llm/alerts/:id/explanation - Get alert explanation
  fastify.get(
    '/llm/alerts/:id/explanation',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Get alert explanation',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.explainAlert(req as any, reply)
  );
}
