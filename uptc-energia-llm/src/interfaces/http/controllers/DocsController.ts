import { FastifyReply, FastifyRequest } from 'fastify';
import { readFile } from 'fs/promises';
import { KnowledgeRepositoryPort } from '../../../shared/application/ports/KnowledgeRepositoryPort.js';
import { IndexDocument } from '../../../features/rag/application/IndexDocument.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export class DocsController {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepositoryPort,
    private readonly indexDocument: IndexDocument,
    private readonly logger: LoggerPort
  ) {}

  async listDocs(
    request: FastifyRequest<{
      Querystring: {
        sector?: string;
        tags?: string;
        q?: string;
        indexed?: boolean;
        limit?: number;
        offset?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tags = request.query.tags
        ? request.query.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;

      const docs = await this.knowledgeRepository.findAll({
        sector: request.query.sector,
        tags,
        searchText: request.query.q,
        indexed: request.query.indexed,
        limit: request.query.limit,
        offset: request.query.offset,
      });

      return reply.send({ docs });
    } catch (error) {
      this.logger.error('Failed to list documents', error as Error);
      return reply.status(500).send({
        error: 'Failed to list documents',
        message: (error as Error).message,
      });
    }
  }

  async createDoc(
    request: FastifyRequest<{
      Body: {
        title: string;
        content?: string;
        file_path?: string;
        sector?: string;
        tags?: string[];
        metadata?: Record<string, any>;
        index?: boolean;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { title, content, file_path, sector, tags, metadata, index } = request.body;

      if (!title || title.trim().length === 0) {
        return reply.status(400).send({ error: 'title is required' });
      }

      let resolvedContent = content?.trim();

      if (!resolvedContent && file_path) {
        resolvedContent = await readFile(file_path, 'utf-8');
      }

      if (!resolvedContent || resolvedContent.trim().length === 0) {
        return reply.status(400).send({
          error: 'content or file_path is required',
        });
      }

      const doc = await this.knowledgeRepository.create({
        title: title.trim(),
        content: resolvedContent,
        filePath: file_path,
        sector,
        tags,
        metadata,
      });

      const shouldIndex = index !== false;
      if (shouldIndex) {
        await this.indexDocument.execute(doc.id);
      }

      return reply.status(201).send({
        doc,
        indexed: shouldIndex,
      });
    } catch (error) {
      this.logger.error('Failed to create document', error as Error);
      return reply.status(500).send({
        error: 'Failed to create document',
        message: (error as Error).message,
      });
    }
  }

  async reindexDoc(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const docId = parseInt(request.params.id, 10);
      if (isNaN(docId)) {
        return reply.status(400).send({ error: 'Invalid document ID' });
      }

      const result = await this.indexDocument.execute(docId);

      return reply.send({
        docId,
        ...result,
      });
    } catch (error) {
      this.logger.error('Failed to reindex document', error as Error);
      return reply.status(500).send({
        error: 'Failed to reindex document',
        message: (error as Error).message,
      });
    }
  }
}
