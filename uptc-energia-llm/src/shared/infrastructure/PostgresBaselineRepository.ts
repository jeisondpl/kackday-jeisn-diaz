import { Pool } from 'pg';
import {
  BaselineRepositoryPort,
  BaselineRecord,
} from '../application/ports/BaselineRepositoryPort.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PostgresBaselineRepository implements BaselineRepositoryPort {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly logger: LoggerPort
  ) {}

  async upsertBaseline(record: BaselineRecord): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO ${this.schema}.baselines
         (sede_id, sector, metric, granularity, time_key, baseline_value, std_dev, sample_count, last_calculated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (sede_id, sector, metric, granularity, time_key)
         DO UPDATE SET
           baseline_value = EXCLUDED.baseline_value,
           std_dev = EXCLUDED.std_dev,
           sample_count = EXCLUDED.sample_count,
           last_calculated = NOW()`,
        [
          record.sedeId,
          record.sector || null,
          record.metric,
          record.granularity,
          record.timeKey,
          record.baselineValue,
          record.stdDev ?? null,
          record.sampleCount ?? null,
        ]
      );
    } catch (error) {
      this.logger.error('Failed to upsert baseline', error as Error, record);
      throw error;
    }
  }

  async deleteBySede(sedeId?: string): Promise<void> {
    try {
      if (!sedeId) {
        await this.pool.query(`DELETE FROM ${this.schema}.baselines`);
        return;
      }

      await this.pool.query(
        `DELETE FROM ${this.schema}.baselines WHERE sede_id = $1`,
        [sedeId]
      );
    } catch (error) {
      this.logger.error('Failed to delete baselines', error as Error, { sedeId });
      throw error;
    }
  }
}
