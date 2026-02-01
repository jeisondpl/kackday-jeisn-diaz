import { KnowledgeRepositoryPort } from '../../../shared/application/ports/KnowledgeRepositoryPort.js';
import { VectorStorePort } from '../../../shared/application/ports/VectorStorePort.js';
import { LLMPort } from '../../../shared/application/ports/LLMPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export class IndexDocument {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepositoryPort,
    private readonly vectorStore: VectorStorePort,
    private readonly llm: LLMPort,
    private readonly chunkingConfig: ChunkingConfig,
    private readonly logger: LoggerPort
  ) {}

  async execute(docId: number): Promise<{ chunksCreated: number }> {
    this.logger.info(`Starting document indexing for doc ${docId}`);

    try {
      // Get document
      const doc = await this.knowledgeRepository.findById(docId);
      if (!doc) {
        throw new Error(`Document ${docId} not found`);
      }

      // Delete existing chunks (re-index)
      await this.vectorStore.deleteByDocId(docId);

      // Split into chunks
      const chunks = this.chunkText(doc.content);

      if (chunks.length === 0) {
        this.logger.warn(`Document ${docId} has no content to index`);
        await this.knowledgeRepository.markAsIndexed(docId, 0);
        return { chunksCreated: 0 };
      }

      // Generate embeddings for each chunk
      const chunksWithEmbeddings = await Promise.all(
        chunks.map(async (chunkText, index) => {
          const embedding = await this.llm.embed(chunkText);

          return {
            docId: doc.id,
            chunkIndex: index,
            content: chunkText,
            embedding,
            metadata: {
              title: doc.title,
              sector: doc.sector,
              tags: doc.tags,
              chunkIndex: index,
              totalChunks: chunks.length,
            },
          };
        })
      );

      // Add chunks to vector store
      await this.vectorStore.addChunks(chunksWithEmbeddings);

      // Mark document as indexed
      await this.knowledgeRepository.markAsIndexed(docId, chunks.length);

      this.logger.info(`Document ${docId} indexed successfully`, {
        chunksCreated: chunks.length,
      });

      return { chunksCreated: chunks.length };
    } catch (error) {
      this.logger.error(`Failed to index document ${docId}`, error as Error);
      throw error;
    }
  }

  /**
   * Split text into chunks with overlap
   */
  private chunkText(text: string): string[] {
    const { chunkSize, chunkOverlap } = this.chunkingConfig;

    // Clean text
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanedText.length === 0) {
      return [];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < cleanedText.length) {
      // Get chunk
      const endIndex = Math.min(startIndex + chunkSize, cleanedText.length);
      let chunk = cleanedText.substring(startIndex, endIndex);

      // Try to break at sentence boundary
      if (endIndex < cleanedText.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > chunkSize / 2) {
          chunk = chunk.substring(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());

      // Move to next chunk with overlap
      startIndex += chunk.length - chunkOverlap;

      // Prevent infinite loop
      if (startIndex >= cleanedText.length || chunk.length === 0) {
        break;
      }
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }
}
