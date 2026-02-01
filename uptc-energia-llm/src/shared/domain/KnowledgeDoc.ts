/**
 * Documento de la base de conocimiento para RAG
 */
export type ContentType = 'md' | 'txt' | 'pdf';

export interface KnowledgeDoc {
  readonly id: number;
  readonly title: string;
  readonly content: string;
  readonly filePath?: string;
  readonly sector?: string;
  readonly tags: string[];
  readonly metadata?: Record<string, unknown>;
  readonly indexed: boolean;
  readonly chunksCount?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DocChunk {
  readonly id: number;
  readonly docId: number;
  readonly chunkIndex: number;
  readonly text: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
}

export const createKnowledgeDoc = (
  data: Omit<KnowledgeDoc, 'createdAt' | 'updatedAt'> & {
    createdAt?: Date;
    updatedAt?: Date;
  }
): KnowledgeDoc => {
  const now = new Date();
  return Object.freeze({
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  });
};

export const createDocChunk = (
  data: Omit<DocChunk, 'createdAt'> & { createdAt?: Date }
): DocChunk => {
  return Object.freeze({
    ...data,
    createdAt: data.createdAt || new Date(),
  });
};
