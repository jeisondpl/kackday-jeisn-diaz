export interface RecommendationSource {
  docId: number;
  title: string;
  chunkId?: number;
}

export interface Recommendation {
  id?: number;
  alertId?: number;
  summary: string;
  actions: string[];
  expectedSavings?: {
    type: string;
    value: string;
  };
  why: string[];
  sources: RecommendationSource[];
  confidence?: number;
  generatedAt?: string;
}
