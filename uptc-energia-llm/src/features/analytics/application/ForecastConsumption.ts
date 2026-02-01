import { EnergyApiPort } from '../../../shared/application/ports/EnergyApiPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { SensorReading } from '../../../shared/domain/SensorReading.js';

export interface ForecastRequest {
  sedeId?: string;
  metric?: string;
  hoursAhead?: number;
  lookbackDays?: number;
}

export interface ForecastDataPoint {
  timestamp: Date;
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
  forecast: ForecastDataPoint[];
  historicalData: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    dataPoints: number;
  };
  method: string;
  generatedAt: Date;
}

export class ForecastConsumption {
  constructor(
    private readonly energyApi: EnergyApiPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: ForecastRequest = {}): Promise<ForecastResponse> {
    const hoursAhead = request.hoursAhead || 24;
    const lookbackDays = request.lookbackDays || 30;
    const metric = request.metric || 'energiaTotal';

    this.logger.info('Starting consumption forecast', {
      sedeId: request.sedeId || 'all',
      metric,
      hoursAhead,
      lookbackDays,
    });

    try {
      // Fetch historical data
      const to = new Date();
      const from = new Date(to.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

      const readings = await this.energyApi.getConsumos({
        sedeId: request.sedeId,
        from,
        to,
        limit: 10000,
        order: 'asc',
      });

      if (readings.length === 0) {
        this.logger.warn('No historical data available for forecasting');
        return {
          sedeId: request.sedeId,
          metric,
          forecast: [],
          historicalData: {
            mean: 0,
            stdDev: 0,
            min: 0,
            max: 0,
            dataPoints: 0,
          },
          method: 'baseline_with_hourly_weekday_pattern',
          generatedAt: new Date(),
        };
      }

      // Build baseline model
      const baseline = this.buildBaselineModel(readings, metric);

      // Generate forecast
      const forecast = this.generateForecast(
        baseline,
        hoursAhead,
        to
      );

      // Calculate historical stats
      const values = readings
        .map((r) => this.extractMetricValue(r, metric))
        .filter((v): v is number => v !== undefined);

      const historicalData = {
        mean: values.reduce((sum, v) => sum + v, 0) / values.length,
        stdDev: this.calculateStdDev(values),
        min: Math.min(...values),
        max: Math.max(...values),
        dataPoints: values.length,
      };

      this.logger.info('Forecast generated successfully', {
        forecastPoints: forecast.length,
        historicalDataPoints: values.length,
      });

      return {
        sedeId: request.sedeId,
        metric,
        forecast,
        historicalData,
        method: 'baseline_with_hourly_weekday_pattern',
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Forecast generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Build baseline model using hourly and weekday patterns
   */
  private buildBaselineModel(
    readings: SensorReading[],
    metric: string
  ): Map<string, { mean: number; stdDev: number; count: number }> {
    // Group by hour and day of week
    const groups = new Map<string, number[]>();

    for (const reading of readings) {
      const value = this.extractMetricValue(reading, metric);
      if (value === undefined) continue;

      const hour = reading.temporalDimensions?.hora;
      const dayOfWeek = reading.temporalDimensions?.diaSemana;

      if (hour === undefined || dayOfWeek === undefined) continue;

      const key = `${hour}_${dayOfWeek}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(value);
    }

    // Calculate statistics for each group
    const baseline = new Map<string, { mean: number; stdDev: number; count: number }>();

    for (const [key, values] of groups.entries()) {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = this.calculateStdDev(values);

      baseline.set(key, { mean, stdDev, count: values.length });
    }

    return baseline;
  }

  /**
   * Generate forecast for next N hours
   */
  private generateForecast(
    baseline: Map<string, { mean: number; stdDev: number; count: number }>,
    hoursAhead: number,
    startTime: Date
  ): ForecastDataPoint[] {
    const forecast: ForecastDataPoint[] = [];

    for (let i = 1; i <= hoursAhead; i++) {
      const timestamp = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();

      const key = `${hour}_${dayOfWeek}`;
      const stats = baseline.get(key);

      let predicted: number;
      let lower: number;
      let upper: number;
      let baselineValue: number;

      if (stats && stats.count >= 3) {
        // Use baseline if we have enough data
        predicted = stats.mean;
        baselineValue = stats.mean;

        // Confidence interval: ±2 std deviations
        const margin = stats.stdDev * 2;
        lower = Math.max(0, predicted - margin);
        upper = predicted + margin;
      } else {
        // Fallback to overall average
        const allValues = Array.from(baseline.values());
        const globalMean =
          allValues.reduce((sum, s) => sum + s.mean, 0) / allValues.length;

        predicted = globalMean;
        baselineValue = globalMean;

        // Wide confidence interval when we lack data
        lower = Math.max(0, globalMean * 0.5);
        upper = globalMean * 1.5;
      }

      forecast.push({
        timestamp,
        hour,
        dayOfWeek,
        predicted,
        confidence: { lower, upper },
        baseline: baselineValue,
      });
    }

    return forecast;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  private extractMetricValue(reading: SensorReading, metric: string): number | undefined {
    const metrics = reading.metrics as any;
    return metrics[metric];
  }

  /**
   * Evaluate forecast accuracy using MAE and RMSE
   */
  async evaluateForecast(
    forecast: ForecastDataPoint[],
    actual: SensorReading[],
    metric: string
  ): Promise<{
    mae: number;
    rmse: number;
    mape: number;
  }> {
    const errors: number[] = [];
    const percentageErrors: number[] = [];

    for (const point of forecast) {
      // Find actual reading closest to forecast timestamp
      const actualReading = actual.find((r) =>
        Math.abs(r.timestamp.getTime() - point.timestamp.getTime()) < 30 * 60 * 1000 // Within 30 minutes
      );

      if (actualReading) {
        const actualValue = this.extractMetricValue(actualReading, metric);
        if (actualValue !== undefined) {
          const error = Math.abs(point.predicted - actualValue);
          errors.push(error);

          if (actualValue !== 0) {
            const percentageError = (error / actualValue) * 100;
            percentageErrors.push(percentageError);
          }
        }
      }
    }

    if (errors.length === 0) {
      return { mae: 0, rmse: 0, mape: 0 };
    }

    // Calculate metrics
    const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const rmse = Math.sqrt(
      errors.reduce((sum, e) => sum + e * e, 0) / errors.length
    );
    const mape =
      percentageErrors.length > 0
        ? percentageErrors.reduce((sum, e) => sum + e, 0) / percentageErrors.length
        : 0;

    return { mae, rmse, mape };
  }
}
