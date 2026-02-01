/**
 * Puerto para interactuar con un vector store (pgvector, Chroma, etc.)
 */
export interface DocumentChunk {
  id: number;
  docId: number;
  chunkIndex?: number;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface SimilaritySearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

export interface VectorStorePort {
  /**
   * Añadir chunks con embeddings
   */
  addChunks(chunks: Omit<DocumentChunk, 'id'>[]): Promise<number[]>;

  /**
   * Buscar chunks similares por embedding
   */
  searchSimilar(embedding: number[], topK: number, minSimilarity?: number): Promise<SimilaritySearchResult[]>;

  /**
   * Eliminar chunks de un documento
   */
  deleteByDocId(docId: number): Promise<void>;

  /**
   * Verificar si el store está disponible
   */
  healthCheck(): Promise<boolean>;
}
