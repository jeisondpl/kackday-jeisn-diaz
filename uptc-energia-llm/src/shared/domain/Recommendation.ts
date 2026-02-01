/**
 * Recomendación generada por IA con fuentes RAG
 */
export interface RecommendationSource {
  docId: number;
  title: string;
  chunkId?: number;
}

export interface ExpectedSavings {
  type: 'heuristic' | 'calculated' | 'estimated';
  value: string; // e.g., "5-12%" or "100 kWh/day"
}

export interface Recommendation {
  readonly id: number;
  readonly alertId?: number;
  readonly summary: string;
  readonly actions: string[];
  readonly expectedSavings?: ExpectedSavings;
  readonly why: string[];
  readonly sources: RecommendationSource[];
  readonly confidence?: number; // 0-1
  readonly createdAt: Date;
}

export const createRecommendation = (
  data: Omit<Recommendation, 'createdAt'> & { createdAt?: Date }
): Recommendation => {
  return Object.freeze({
    ...data,
    createdAt: data.createdAt || new Date(),
  });
};
