import { KnowledgeDoc } from '../../domain/KnowledgeDoc.js';

export interface CreateKnowledgeDocDTO {
  title: string;
  content: string;
  filePath?: string;
  sector?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateKnowledgeDocDTO {
  title?: string;
  content?: string;
  sector?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface KnowledgeDocFilters {
  sector?: string;
  tags?: string[];
  searchText?: string;
  indexed?: boolean;
  limit?: number;
  offset?: number;
}

export interface KnowledgeRepositoryPort {
  findById(id: number): Promise<KnowledgeDoc | null>;
  findAll(filters?: KnowledgeDocFilters): Promise<KnowledgeDoc[]>;
  create(data: CreateKnowledgeDocDTO): Promise<KnowledgeDoc>;
  update(id: number, data: UpdateKnowledgeDocDTO): Promise<KnowledgeDoc>;
  delete(id: number): Promise<void>;
  markAsIndexed(id: number, chunksCount: number): Promise<void>;
}
