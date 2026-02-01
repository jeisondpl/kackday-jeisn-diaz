export interface KnowledgeDoc {
  id: number;
  title: string;
  content: string;
  filePath?: string;
  sector?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  indexed: boolean;
  chunksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeDocRequest {
  title: string;
  content?: string;
  file_path?: string;
  sector?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  index?: boolean;
}
