import { EnergyApiPort } from '../../../shared/application/ports/EnergyApiPort.js';
import { BaselineRepositoryPort } from '../../../shared/application/ports/BaselineRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { SensorReading } from '../../../shared/domain/SensorReading.js';

export interface RecalculateBaselineRequest {
  sedeId?: string;
  metric?: string;
  lookbackDays?: number;
}

export interface RecalculateBaselineResponse {
  sedeId?: string;
  metric: string;
  lookbackDays: number;
  baselinesSaved: number;
}

export class RecalculateBaselines {
  constructor(
    private readonly energyApi: EnergyApiPort,
    private readonly baselinesRepository: BaselineRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(
    request: RecalculateBaselineRequest = {}
  ): Promise<RecalculateBaselineResponse> {
    const metric = request.metric || 'energiaTotal';
    const lookbackDays = request.lookbackDays || 30;

    const to = new Date();
    const from = new Date(to.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

    this.logger.info('Recalculating baselines', {
      sedeId: request.sedeId || 'all',
      metric,
      lookbackDays,
    });

    const readings = await this.energyApi.getConsumos({
      sedeId: request.sedeId,
      from,
      to,
      limit: 10000,
      order: 'asc',
    });

    if (readings.length === 0) {
      return {
        sedeId: request.sedeId,
        metric,
        lookbackDays,
        baselinesSaved: 0,
      };
    }

    const groups = this.groupByHourWeekday(readings, metric);
    let baselinesSaved = 0;

    for (const [key, values] of groups.entries()) {
      if (values.length < 3) continue;

      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = this.calculateStdDev(values, mean);

      const { sedeId, sector, hour, dayOfWeek } = this.parseKey(key);
      const timeKey = `${dayOfWeek}_${hour}`;

      await this.baselinesRepository.upsertBaseline({
        sedeId,
        sector,
        metric,
        granularity: 'hour_weekday',
        timeKey,
        baselineValue: mean,
        stdDev,
        sampleCount: values.length,
      });

      baselinesSaved++;
    }

    return {
      sedeId: request.sedeId,
      metric,
      lookbackDays,
      baselinesSaved,
    };
  }

  private groupByHourWeekday(
    readings: SensorReading[],
    metric: string
  ): Map<string, number[]> {
    const groups = new Map<string, number[]>();

    for (const reading of readings) {
      const value = (reading.metrics as any)[metric];
      const hour = reading.temporalDimensions?.hora;
      const dayOfWeek = reading.temporalDimensions?.diaSemana;

      if (value === undefined || hour === undefined || dayOfWeek === undefined) {
        continue;
      }

      const key = `${reading.sedeId}|${reading.sector || ''}|${hour}|${dayOfWeek}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(value);
    }

    return groups;
  }

  private parseKey(key: string): {
    sedeId: string;
    sector?: string;
    hour: number;
    dayOfWeek: number;
  } {
    const [sedeId, sector, hour, dayOfWeek] = key.split('|');
    return {
      sedeId,
      sector: sector || undefined,
      hour: Number(hour),
      dayOfWeek: Number(dayOfWeek),
    };
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
