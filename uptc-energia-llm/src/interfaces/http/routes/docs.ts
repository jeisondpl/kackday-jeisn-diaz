import { FastifyInstance } from 'fastify';
import { DocsController } from '../controllers/DocsController.js';

export async function docsRoutes(fastify: FastifyInstance, controller: DocsController) {
  // POST /llm/docs - create and optionally index a document
  fastify.post(
    '/llm/docs',
    {
      schema: {
        tags: ['docs'],
        summary: 'Create a knowledge document',
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            file_path: { type: 'string' },
            sector: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            metadata: { type: 'object' },
            index: { type: 'boolean', default: true },
          },
        },
      },
    },
    (req, reply) => controller.createDoc(req as any, reply)
  );

  // GET /llm/docs - list documents
  fastify.get(
    '/llm/docs',
    {
      schema: {
        tags: ['docs'],
        summary: 'List knowledge documents',
        querystring: {
          type: 'object',
          properties: {
            sector: { type: 'string' },
            tags: { type: 'string' },
            q: { type: 'string' },
            indexed: { type: 'boolean' },
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
        },
      },
    },
    (req, reply) => controller.listDocs(req as any, reply)
  );

  // POST /llm/docs/:id/reindex - reindex a document
  fastify.post(
    '/llm/docs/:id/reindex',
    {
      schema: {
        tags: ['docs'],
        summary: 'Reindex a knowledge document',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    (req, reply) => controller.reindexDoc(req as any, reply)
  );
}
