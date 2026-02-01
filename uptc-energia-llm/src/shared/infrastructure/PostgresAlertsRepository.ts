import { Pool } from 'pg';
import {
  AlertsRepositoryPort,
  CreateAlertDTO,
  AlertFilters,
} from '../application/ports/AlertsRepositoryPort.js';
import { Alert, AlertStatus, createAlert } from '../domain/Alert.js';
import { Evidence } from '../domain/Evidence.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PostgresAlertsRepository implements AlertsRepositoryPort {
  private readonly pool: Pool;
  private readonly schema: string;
  private readonly logger: LoggerPort;

  constructor(pool: Pool, schema: string, logger: LoggerPort) {
    this.pool = pool;
    this.schema = schema;
    this.logger = logger;
  }

  async findById(id: number): Promise<Alert | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.alerts WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to find alert ${id}`, error as Error);
      throw error;
    }
  }

  async findAll(filters: AlertFilters): Promise<Alert[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
      }

      if (filters.severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(filters.severity);
      }

      if (filters.sedeId) {
        conditions.push(`sede_id = $${paramIndex++}`);
        params.push(filters.sedeId);
      }

      if (filters.sector) {
        conditions.push(`sector = $${paramIndex++}`);
        params.push(filters.sector);
      }

      if (filters.from) {
        conditions.push(`window_start >= $${paramIndex++}`);
        params.push(filters.from);
      }

      if (filters.to) {
        conditions.push(`window_end <= $${paramIndex++}`);
        params.push(filters.to);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;

      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.alerts
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        [...params, limit, offset]
      );

      return result.rows.map(this.mapAlertRow);
    } catch (error) {
      this.logger.error('Failed to find alerts', error as Error);
      throw error;
    }
  }

  async findByFingerprint(fingerprint: string): Promise<Alert | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.alerts WHERE fingerprint = $1`,
        [fingerprint]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to find alert by fingerprint`, error as Error);
      throw error;
    }
  }

  async create(data: CreateAlertDTO): Promise<Alert> {
    try {
      // Check if alert already exists (idempotency)
      const existing = await this.findByFingerprint(data.fingerprint);
      if (existing) {
        this.logger.info(`Alert already exists with fingerprint: ${data.fingerprint}`, {
          alertId: existing.id,
        });
        return existing;
      }

      const result = await this.pool.query(
        `INSERT INTO ${this.schema}.alerts
         (fingerprint, rule_id, sede_id, sector, metric, severity, status, message, window_start, window_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          data.fingerprint,
          data.ruleId || null,
          data.sedeId,
          data.sector || null,
          data.metric,
          data.severity,
          'open',
          data.message,
          data.windowStart,
          data.windowEnd,
        ]
      );

      this.logger.info(`Created alert: ${data.message}`, {
        alertId: result.rows[0].id,
        severity: data.severity,
      });

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create alert', error as Error);
      throw error;
    }
  }

  async acknowledge(id: number, acknowledgedBy: string): Promise<Alert> {
    try {
      const result = await this.pool.query(
        `UPDATE ${this.schema}.alerts
         SET status = $1, acknowledged_at = NOW(), acknowledged_by = $2
         WHERE id = $3
         RETURNING *`,
        ['acknowledged', acknowledgedBy, id]
      );

      if (result.rows.length === 0) {
        throw new Error(`Alert ${id} not found`);
      }

      this.logger.info(`Acknowledged alert ${id} by ${acknowledgedBy}`);

      return this.mapAlertRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to acknowledge alert ${id}`, error as Error);
      throw error;
    }
  }

  async addEvidence(
    alertId: number,
    evidence: Omit<Evidence, 'id' | 'alertId' | 'createdAt'>
  ): Promise<Evidence> {
    try {
      const result = await this.pool.query(
        `INSERT INTO ${this.schema}.alert_evidence
         (alert_id, values, baseline, delta, anomaly_score, forecast)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          alertId,
          JSON.stringify(evidence.values),
          JSON.stringify(evidence.baseline),
          JSON.stringify(evidence.delta),
          evidence.anomalyScore,
          evidence.forecast ? JSON.stringify(evidence.forecast) : null,
        ]
      );

      this.logger.info(`Added evidence to alert ${alertId}`);

      return this.mapEvidenceRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to add evidence to alert ${alertId}`, error as Error);
      throw error;
    }
  }

  async getEvidence(alertId: number): Promise<Evidence[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.alert_evidence WHERE alert_id = $1 ORDER BY created_at DESC`,
        [alertId]
      );

      return result.rows.map(this.mapEvidenceRow);
    } catch (error) {
      this.logger.error(`Failed to get evidence for alert ${alertId}`, error as Error);
      throw error;
    }
  }

  private mapAlertRow(row: any): Alert {
    return createAlert({
      id: row.id,
      fingerprint: row.fingerprint,
      ruleId: row.rule_id,
      sedeId: row.sede_id,
      sector: row.sector,
      metric: row.metric,
      severity: row.severity,
      status: row.status as AlertStatus,
      message: row.message,
      windowStart: new Date(row.window_start),
      windowEnd: new Date(row.window_end),
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by,
      createdAt: new Date(row.created_at),
    });
  }

  private mapEvidenceRow(row: any): Evidence {
    return {
      id: row.id,
      alertId: row.alert_id,
      values: row.values,
      baseline: row.baseline,
      delta: row.delta,
      anomalyScore: row.anomaly_score,
      forecast: row.forecast,
      createdAt: new Date(row.created_at),
    };
  }
}
