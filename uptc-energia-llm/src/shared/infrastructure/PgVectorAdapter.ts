import { Pool } from 'pg';
import {
  VectorStorePort,
  DocumentChunk,
  SimilaritySearchResult,
} from '../application/ports/VectorStorePort.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PgVectorAdapter implements VectorStorePort {
  private readonly pool: Pool;
  private readonly schema: string;
  private readonly logger: LoggerPort;

  constructor(pool: Pool, schema: string, logger: LoggerPort) {
    this.pool = pool;
    this.schema = schema;
    this.logger = logger;
  }

  async addChunks(chunks: Omit<DocumentChunk, 'id'>[]): Promise<number[]> {
    if (chunks.length === 0) {
      return [];
    }

    try {
      const ids: number[] = [];

      // Insert chunks one by one (can be optimized with batch insert)
      for (const chunk of chunks) {
        const result = await this.pool.query(
          `INSERT INTO ${this.schema}.doc_chunks (doc_id, chunk_index, content, embedding, metadata)
           VALUES ($1, $2, $3, $4::vector, $5)
           RETURNING id`,
          [
            chunk.docId,
            chunk.chunkIndex ?? 0,
            chunk.content,
            `[${chunk.embedding.join(',')}]`, // Format as pgvector array
            chunk.metadata ? JSON.stringify(chunk.metadata) : null,
          ]
        );

        ids.push(result.rows[0].id);
      }

      this.logger.info(`Added ${chunks.length} chunks to vector store`);

      return ids;
    } catch (error) {
      this.logger.error('Failed to add chunks to vector store', error as Error);
      throw error;
    }
  }

  async searchSimilar(
    embedding: number[],
    topK: number,
    minSimilarity = 0.7
  ): Promise<SimilaritySearchResult[]> {
    try {
      // Use cosine similarity: 1 - (embedding <=> query_embedding)
      // pgvector's <=> operator returns cosine distance (0 = identical, 2 = opposite)
      // We convert to similarity: 1 - (distance / 2)
      const result = await this.pool.query(
        `SELECT
           id,
           doc_id,
           chunk_index,
           content,
           embedding,
           metadata,
           1 - (embedding <=> $1::vector) / 2 AS similarity
         FROM ${this.schema}.doc_chunks
         WHERE 1 - (embedding <=> $1::vector) / 2 >= $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [`[${embedding.join(',')}]`, minSimilarity, topK]
      );

      return result.rows.map((row) => ({
        chunk: {
          id: row.id,
          docId: row.doc_id,
          chunkIndex: row.chunk_index,
          content: row.content,
          embedding: this.parseVector(row.embedding),
          metadata: row.metadata,
        },
        similarity: parseFloat(row.similarity),
      }));
    } catch (error) {
      this.logger.error('Failed to search similar chunks', error as Error);
      throw error;
    }
  }

  async deleteByDocId(docId: number): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM ${this.schema}.doc_chunks WHERE doc_id = $1`,
        [docId]
      );

      this.logger.info(`Deleted chunks for document ${docId}`);
    } catch (error) {
      this.logger.error(`Failed to delete chunks for document ${docId}`, error as Error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check if pgvector extension is available
      const result = await this.pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM pg_extension WHERE extname = 'vector'
         ) AS has_vector`
      );

      return result.rows[0].has_vector;
    } catch (error) {
      this.logger.error('Vector store health check failed', error as Error);
      return false;
    }
  }

  /**
   * Parse pgvector string format to number array
   * Example: "[0.1,0.2,0.3]" -> [0.1, 0.2, 0.3]
   */
  private parseVector(vectorString: string): number[] {
    // Remove brackets and split by comma
    const cleaned = vectorString.replace(/[\[\]]/g, '');
    return cleaned.split(',').map((v) => parseFloat(v.trim()));
  }
}
