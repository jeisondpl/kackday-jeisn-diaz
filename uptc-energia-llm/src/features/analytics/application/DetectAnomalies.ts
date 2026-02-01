import { EnergyApiPort } from '../../../shared/application/ports/EnergyApiPort.js';
import { AlertsRepositoryPort, CreateAlertDTO } from '../../../shared/application/ports/AlertsRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { SensorReading } from '../../../shared/domain/SensorReading.js';
import { generateFingerprint } from '../../../shared/domain/Alert.js';

export interface AnomalyDetectionRequest {
  sedeId?: string;
  metric?: string;
  hoursBack?: number;
  zScoreThreshold?: number;
}

export interface AnomalyResult {
  timestamp: Date;
  sedeId: string;
  sector?: string;
  metric: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyDetectionResponse {
  anomalies: AnomalyResult[];
  totalReadings: number;
  anomaliesCount: number;
  threshold: number;
  timeRange: {
    from: Date;
    to: Date;
  };
}

export class DetectAnomalies {
  constructor(
    private readonly energyApi: EnergyApiPort,
    private readonly alertsRepository: AlertsRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: AnomalyDetectionRequest = {}): Promise<AnomalyDetectionResponse> {
    const hoursBack = request.hoursBack || 24;
    const zScoreThreshold = request.zScoreThreshold || 3.0;
    const metric = request.metric || 'energiaTotal';

    const to = new Date();
    const from = new Date(to.getTime() - hoursBack * 60 * 60 * 1000);

    this.logger.info('Starting anomaly detection', {
      sedeId: request.sedeId || 'all',
      metric,
      hoursBack,
      zScoreThreshold,
    });

    try {
      // Fetch recent readings
      const readings = await this.energyApi.getConsumos({
        sedeId: request.sedeId,
        from,
        to,
        limit: 10000,
        order: 'desc',
      });

      if (readings.length === 0) {
        this.logger.warn('No readings found for anomaly detection');
        return {
          anomalies: [],
          totalReadings: 0,
          anomaliesCount: 0,
          threshold: zScoreThreshold,
          timeRange: { from, to },
        };
      }

      // Detect anomalies
      const anomalies = this.detectAnomaliesInReadings(
        readings,
        metric,
        zScoreThreshold
      );

      this.logger.info('Anomaly detection completed', {
        totalReadings: readings.length,
        anomaliesCount: anomalies.length,
      });

      return {
        anomalies,
        totalReadings: readings.length,
        anomaliesCount: anomalies.length,
        threshold: zScoreThreshold,
        timeRange: { from, to },
      };
    } catch (error) {
      this.logger.error('Anomaly detection failed', error as Error);
      throw error;
    }
  }

  /**
   * Execute anomaly detection and create alerts automatically
   */
  async executeWithAlerts(request: AnomalyDetectionRequest = {}): Promise<{
    anomalies: AnomalyResult[];
    alertsCreated: number;
  }> {
    const result = await this.execute(request);

    // Create alerts for critical anomalies
    let alertsCreated = 0;

    for (const anomaly of result.anomalies) {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        try {
          await this.createAnomalyAlert(anomaly);
          alertsCreated++;
        } catch (error) {
          this.logger.warn('Failed to create alert for anomaly', {
            error: (error as Error).message,
            anomaly,
          });
        }
      }
    }

    this.logger.info('Anomaly alerts created', { alertsCreated });

    return {
      anomalies: result.anomalies,
      alertsCreated,
    };
  }

  private detectAnomaliesInReadings(
    readings: SensorReading[],
    metric: string,
    zScoreThreshold: number
  ): AnomalyResult[] {
    // Extract values for the specified metric
    const values = readings
      .map((r) => ({
        timestamp: r.timestamp,
        sedeId: r.sedeId,
        sector: r.sector,
        value: this.extractMetricValue(r, metric),
      }))
      .filter((v) => v.value !== undefined && v.value !== null) as Array<{
      timestamp: Date;
      sedeId: string;
      sector?: string;
      value: number;
    }>;

    if (values.length < 3) {
      // Not enough data for statistical analysis
      return [];
    }

    // Calculate mean and standard deviation
    const { mean, stdDev } = this.calculateStats(values.map((v) => v.value));

    if (stdDev === 0) {
      // No variation, cannot detect anomalies
      return [];
    }

    // Detect anomalies using z-score
    const anomalies: AnomalyResult[] = [];

    for (const item of values) {
      const zScore = Math.abs((item.value - mean) / stdDev);

      if (zScore >= zScoreThreshold) {
        anomalies.push({
          timestamp: item.timestamp,
          sedeId: item.sedeId,
          sector: item.sector,
          metric,
          value: item.value,
          mean,
          stdDev,
          zScore,
          severity: this.calculateSeverity(zScore, zScoreThreshold),
        });
      }
    }

    return anomalies;
  }

  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  private calculateSeverity(
    zScore: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore >= threshold * 2) return 'critical';
    if (zScore >= threshold * 1.5) return 'high';
    if (zScore >= threshold * 1.2) return 'medium';
    return 'low';
  }

  private extractMetricValue(reading: SensorReading, metric: string): number | undefined {
    const metrics = reading.metrics as any;
    return metrics[metric];
  }

  private async createAnomalyAlert(anomaly: AnomalyResult): Promise<void> {
    const windowStart = new Date(anomaly.timestamp.getTime() - 60 * 60 * 1000); // 1 hour before
    const windowEnd = new Date(anomaly.timestamp.getTime() + 60 * 60 * 1000); // 1 hour after

    const fingerprint = generateFingerprint(
      undefined, // No rule ID for anomaly alerts
      anomaly.sedeId,
      anomaly.sector,
      windowStart,
      windowEnd
    );

    // Check if alert already exists
    const existing = await this.alertsRepository.findByFingerprint(fingerprint);
    if (existing) {
      return; // Skip duplicate
    }

    const message = `Anomalía detectada en ${anomaly.metric}: ${anomaly.value.toFixed(2)} (z-score: ${anomaly.zScore.toFixed(2)}, desviación de ${((anomaly.zScore * anomaly.stdDev) / anomaly.mean * 100).toFixed(1)}%)`;

    const alertData: CreateAlertDTO = {
      fingerprint,
      sedeId: anomaly.sedeId,
      sector: anomaly.sector,
      metric: anomaly.metric,
      severity: anomaly.severity,
      message,
      windowStart,
      windowEnd,
    };

    const alert = await this.alertsRepository.create(alertData);

    // Add evidence
    await this.alertsRepository.addEvidence(alert.id, {
      values: { value: anomaly.value, timestamp: anomaly.timestamp.toISOString() },
      baseline: { mean: anomaly.mean, stdDev: anomaly.stdDev, method: 'zscore' },
      delta: {
        absolute: anomaly.value - anomaly.mean,
        percentage: ((anomaly.value - anomaly.mean) / anomaly.mean) * 100,
        zScore: anomaly.zScore,
      },
      anomalyScore: anomaly.zScore,
    });

    this.logger.info('Anomaly alert created', {
      alertId: alert.id,
      sedeId: anomaly.sedeId,
      zScore: anomaly.zScore,
    });
  }
}
