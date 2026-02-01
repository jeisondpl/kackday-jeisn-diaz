import { Pool } from 'pg';
import {
  KnowledgeRepositoryPort,
  CreateKnowledgeDocDTO,
  UpdateKnowledgeDocDTO,
  KnowledgeDocFilters,
} from '../application/ports/KnowledgeRepositoryPort.js';
import { KnowledgeDoc } from '../domain/KnowledgeDoc.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PostgresKnowledgeRepository implements KnowledgeRepositoryPort {
  private readonly pool: Pool;
  private readonly schema: string;
  private readonly logger: LoggerPort;

  constructor(pool: Pool, schema: string, logger: LoggerPort) {
    this.pool = pool;
    this.schema = schema;
    this.logger = logger;
  }

  async findById(id: number): Promise<KnowledgeDoc | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.knowledge_docs WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to find knowledge doc ${id}`, error as Error);
      throw error;
    }
  }

  async findAll(filters: KnowledgeDocFilters = {}): Promise<KnowledgeDoc[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.sector) {
        conditions.push(`sector = $${paramIndex++}`);
        params.push(filters.sector);
      }

      if (filters.tags && filters.tags.length > 0) {
        conditions.push(`tags && $${paramIndex++}`);
        params.push(filters.tags);
      }

      if (filters.searchText) {
        conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
        params.push(`%${filters.searchText}%`);
        paramIndex++;
      }

      if (filters.indexed !== undefined) {
        conditions.push(`indexed = $${paramIndex++}`);
        params.push(filters.indexed);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.knowledge_docs
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset]
      );

      return result.rows.map(this.mapRow);
    } catch (error) {
      this.logger.error('Failed to find knowledge docs', error as Error);
      throw error;
    }
  }

  async create(data: CreateKnowledgeDocDTO): Promise<KnowledgeDoc> {
    try {
      const result = await this.pool.query(
        `INSERT INTO ${this.schema}.knowledge_docs
         (title, content, file_path, sector, tags, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.title,
          data.content,
          data.filePath || null,
          data.sector || null,
          data.tags || [],
          data.metadata ? JSON.stringify(data.metadata) : null,
        ]
      );

      this.logger.info(`Created knowledge doc: ${data.title}`, {
        docId: result.rows[0].id,
      });

      return this.mapRow(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create knowledge doc', error as Error);
      throw error;
    }
  }

  async update(id: number, data: UpdateKnowledgeDocDTO): Promise<KnowledgeDoc> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(data.title);
      }

      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        params.push(data.content);
      }

      if (data.sector !== undefined) {
        updates.push(`sector = $${paramIndex++}`);
        params.push(data.sector);
      }

      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        params.push(data.tags);
      }

      if (data.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        params.push(JSON.stringify(data.metadata));
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        // Only updated_at changed
        return (await this.findById(id))!;
      }

      params.push(id);

      const result = await this.pool.query(
        `UPDATE ${this.schema}.knowledge_docs
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        throw new Error(`Knowledge doc ${id} not found`);
      }

      this.logger.info(`Updated knowledge doc ${id}`);

      return this.mapRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to update knowledge doc ${id}`, error as Error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.schema}.knowledge_docs WHERE id = $1`,
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error(`Knowledge doc ${id} not found`);
      }

      this.logger.info(`Deleted knowledge doc ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete knowledge doc ${id}`, error as Error);
      throw error;
    }
  }

  async markAsIndexed(id: number, chunksCount: number): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE ${this.schema}.knowledge_docs
         SET indexed = true, chunks_count = $1, indexed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [chunksCount, id]
      );

      this.logger.info(`Marked knowledge doc ${id} as indexed`, { chunksCount });
    } catch (error) {
      this.logger.error(`Failed to mark knowledge doc ${id} as indexed`, error as Error);
      throw error;
    }
  }

  private mapRow(row: any): KnowledgeDoc {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      filePath: row.file_path,
      sector: row.sector,
      tags: row.tags || [],
      metadata: row.metadata,
      indexed: row.indexed,
      chunksCount: row.chunks_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
