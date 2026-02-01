export interface Anomaly {
  timestamp: string;
  sedeId: string;
  sector?: string;
  metric: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyResponse {
  anomalies: Anomaly[];
  totalReadings: number;
  anomaliesCount: number;
  threshold: number;
  timeRange: {
    from: string;
    to: string;
  };
}
