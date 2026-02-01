export interface BaselineRecord {
  sedeId: string;
  sector?: string;
  metric: string;
  granularity: string;
  timeKey: string;
  baselineValue: number;
  stdDev?: number;
  sampleCount?: number;
}

export interface BaselineRepositoryPort {
  upsertBaseline(record: BaselineRecord): Promise<void>;
  deleteBySede(sedeId?: string): Promise<void>;
}
