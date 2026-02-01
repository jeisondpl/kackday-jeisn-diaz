export interface ForecastPoint {
  timestamp: string;
  hour: number;
  dayOfWeek: number;
  predicted: number;
  confidence: {
    lower: number;
    upper: number;
  };
  baseline: number;
  trend?: number;
}

export interface ForecastResponse {
  sedeId?: string;
  metric: string;
  forecast: ForecastPoint[];
  historicalData: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    dataPoints: number;
  };
  method: string;
  generatedAt: string;
}
