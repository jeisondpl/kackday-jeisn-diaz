import { FastifyInstance } from 'fastify';
import { RulesController } from '../controllers/RulesController.js';

export async function rulesRoutes(fastify: FastifyInstance, controller: RulesController) {
  // GET /llm/rules - List rules
  fastify.get(
    '/llm/rules',
    {
      schema: {
        tags: ['rules'],
        summary: 'List rules',
        querystring: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            sede_id: { type: 'string' },
            sector: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.listRules(req as any, reply)
  );

  // GET /llm/rules/:id - Get single rule
  fastify.get(
    '/llm/rules/:id',
    {
      schema: {
        tags: ['rules'],
        summary: 'Get rule by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.getRule(req as any, reply)
  );

  // POST /llm/rules - Create rule
  fastify.post(
    '/llm/rules',
    {
      schema: {
        tags: ['rules'],
        summary: 'Create rule',
        body: {
          type: 'object',
          required: ['name', 'dsl'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            dsl: { type: 'object' },
            enabled: { type: 'boolean' },
          },
        },
      },
    },
    (req, reply) => controller.createRule(req as any, reply)
  );

  // PUT /llm/rules/:id - Update rule
  fastify.put(
    '/llm/rules/:id',
    {
      schema: {
        tags: ['rules'],
        summary: 'Update rule',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            dsl: { type: 'object' },
            enabled: { type: 'boolean' },
          },
        },
      },
    },
    (req, reply) => controller.updateRule(req as any, reply)
  );

  // DELETE /llm/rules/:id - Delete rule
  fastify.delete(
    '/llm/rules/:id',
    {
      schema: {
        tags: ['rules'],
        summary: 'Delete rule',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          204: {
            type: 'null',
            description: 'Rule deleted successfully',
          },
        },
      },
    },
    (req, reply) => controller.deleteRule(req as any, reply)
  );
}
