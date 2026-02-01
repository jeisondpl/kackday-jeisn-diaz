/**
 * PostgreSQL Alerts Repository
 * Implements AlertsRepositoryPort
 */

import { AlertsRepositoryPort } from '../../domain/ports.js';
import { Alert, Evidence } from '../../domain/entities.js';
import { query, getClient } from '../database.js';

export class PostgresAlertsRepository extends AlertsRepositoryPort {
  constructor(logger = console) {
    super();
    this.logger = logger;
  }

  _mapAlertRow(row) {
    return new Alert({
      id: row.id,
      ruleId: row.rule_id,
      status: row.status,
      severity: row.severity,
      message: row.message,
      fingerprint: row.fingerprint,
      scope: row.scope,
      windowStart: row.window_start,
      windowEnd: row.window_end,
      evidenceId: row.evidence_id,
      createdAt: row.created_at,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
    });
  }

  _mapEvidenceRow(row) {
    return new Evidence({
      id: row.id,
      alertId: row.alert_id,
      values: row.values,
      baseline: row.baseline,
      delta: row.delta,
      anomalyScore: row.anomaly_score,
      forecast: row.forecast,
      metadata: row.metadata,
    });
  }

  async findAll(filters = {}) {
    const { status, severity, sedeId, sector, from, to, limit = 100, offset = 0 } = filters;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(severity);
    }

    if (sedeId) {
      conditions.push(`scope->>'sede_id' = $${paramIndex++}`);
      params.push(sedeId);
    }

    if (sector) {
      conditions.push(`scope->>'sector' = $${paramIndex++}`);
      params.push(sector);
    }

    if (from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT id, rule_id, status, severity, message, fingerprint, scope,
             window_start, window_end, evidence_id, created_at, acknowledged_at, resolved_at
      FROM uptc_llm.alerts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows.map((row) => this._mapAlertRow(row));
  }

  async findById(id) {
    const result = await query(
      `SELECT id, rule_id, status, severity, message, fingerprint, scope,
              window_start, window_end, evidence_id, created_at, acknowledged_at, resolved_at
       FROM uptc_llm.alerts
       WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this._mapAlertRow(result.rows[0]) : null;
  }

  async findByFingerprint(fingerprint) {
    const result = await query(
      `SELECT id, rule_id, status, severity, message, fingerprint, scope,
              window_start, window_end, evidence_id, created_at, acknowledged_at, resolved_at
       FROM uptc_llm.alerts
       WHERE fingerprint = $1`,
      [fingerprint]
    );
    return result.rows.length > 0 ? this._mapAlertRow(result.rows[0]) : null;
  }

  async save(alert) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if alert with same fingerprint exists (idempotency)
      const existing = await client.query(
        `SELECT id FROM uptc_llm.alerts WHERE fingerprint = $1`,
        [alert.fingerprint]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        this.logger.debug({ fingerprint: alert.fingerprint }, 'Alert already exists (idempotent)');
        return this.findById(existing.rows[0].id);
      }

      // Insert alert
      const alertResult = await client.query(
        `INSERT INTO uptc_llm.alerts
         (rule_id, status, severity, message, fingerprint, scope, window_start, window_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, created_at`,
        [
          alert.ruleId,
          alert.status,
          alert.severity,
          alert.message,
          alert.fingerprint,
          alert.scope,
          alert.windowStart,
          alert.windowEnd,
        ]
      );

      alert.id = alertResult.rows[0].id;
      alert.createdAt = alertResult.rows[0].created_at;

      await client.query('COMMIT');
      this.logger.info({ alertId: alert.id, fingerprint: alert.fingerprint }, 'Alert saved');
      return alert;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id, alert) {
    const result = await query(
      `UPDATE uptc_llm.alerts
       SET status = $1, acknowledged_at = $2, resolved_at = $3
       WHERE id = $4
       RETURNING id`,
      [alert.status, alert.acknowledgedAt, alert.resolvedAt, id]
    );

    if (result.rowCount === 0) {
      throw new Error(`Alert ${id} not found`);
    }

    this.logger.info({ alertId: id, status: alert.status }, 'Alert updated');
    return alert;
  }

  async saveEvidence(evidence) {
    const result = await query(
      `INSERT INTO uptc_llm.alert_evidence
       (alert_id, values, baseline, delta, anomaly_score, forecast, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        evidence.alertId,
        evidence.values,
        evidence.baseline,
        evidence.delta,
        evidence.anomalyScore,
        evidence.forecast,
        evidence.metadata,
      ]
    );

    evidence.id = result.rows[0].id;

    // Link evidence to alert
    await query(`UPDATE uptc_llm.alerts SET evidence_id = $1 WHERE id = $2`, [
      evidence.id,
      evidence.alertId,
    ]);

    this.logger.info({ evidenceId: evidence.id, alertId: evidence.alertId }, 'Evidence saved');
    return evidence;
  }

  async getEvidence(alertId) {
    const result = await query(
      `SELECT id, alert_id, values, baseline, delta, anomaly_score, forecast, metadata
       FROM uptc_llm.alert_evidence
       WHERE alert_id = $1`,
      [alertId]
    );
    return result.rows.length > 0 ? this._mapEvidenceRow(result.rows[0]) : null;
  }
}

export default PostgresAlertsRepository;
