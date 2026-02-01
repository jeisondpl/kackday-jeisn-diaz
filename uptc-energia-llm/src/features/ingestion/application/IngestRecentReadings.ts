import { EnergyApiPort } from '../../../shared/application/ports/EnergyApiPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { SensorReading } from '../../../shared/domain/SensorReading.js';

export interface IngestRecentReadingsRequest {
  sedeId?: string;
  hoursBack?: number;
}

export interface IngestRecentReadingsResult {
  readingsCount: number;
  sedes: string[];
  timeRange: {
    from: Date;
    to: Date;
  };
}

export class IngestRecentReadings {
  constructor(
    private readonly energyApi: EnergyApiPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: IngestRecentReadingsRequest = {}): Promise<IngestRecentReadingsResult> {
    const hoursBack = request.hoursBack || 24;
    const to = new Date();
    const from = new Date(to.getTime() - hoursBack * 60 * 60 * 1000);

    this.logger.info('Starting ingestion of recent readings', {
      sedeId: request.sedeId || 'all',
      hoursBack,
      from: from.toISOString(),
      to: to.toISOString(),
    });

    try {
      // Fetch readings from Energy API
      const readings = await this.energyApi.getConsumos({
        sedeId: request.sedeId,
        from,
        to,
        limit: 10000, // Large limit for batch ingestion
        order: 'desc',
      });

      // Extract unique sedes
      const sedes = Array.from(new Set(readings.map((r) => r.sedeId)));

      this.logger.info('Ingestion completed successfully', {
        readingsCount: readings.length,
        sedes,
      });

      return {
        readingsCount: readings.length,
        sedes,
        timeRange: { from, to },
      };
    } catch (error) {
      this.logger.error('Ingestion failed', error as Error);
      throw new Error(`Failed to ingest recent readings: ${(error as Error).message}`);
    }
  }

  /**
   * Get recent readings for evaluation (returns the actual data)
   */
  async getReadingsForEvaluation(request: IngestRecentReadingsRequest = {}): Promise<SensorReading[]> {
    const hoursBack = request.hoursBack || 24;
    const to = new Date();
    const from = new Date(to.getTime() - hoursBack * 60 * 60 * 1000);

    try {
      const readings = await this.energyApi.getConsumos({
        sedeId: request.sedeId,
        from,
        to,
        limit: 10000,
        order: 'desc',
      });

      return readings;
    } catch (error) {
      this.logger.error('Failed to get readings for evaluation', error as Error);
      throw error;
    }
  }
}
