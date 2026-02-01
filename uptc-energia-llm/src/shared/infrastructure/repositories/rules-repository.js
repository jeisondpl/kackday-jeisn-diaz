/**
 * PostgreSQL Rules Repository
 * Implements RulesRepositoryPort
 */

import { RulesRepositoryPort } from '../../domain/ports.js';
import { Rule } from '../../domain/entities.js';
import { query } from '../database.js';

export class PostgresRulesRepository extends RulesRepositoryPort {
  constructor(logger = console) {
    super();
    this.logger = logger;
  }

  _mapRow(row) {
    return new Rule({
      id: row.id,
      dslJson: row.dsl_json,
      scope: row.scope,
      metric: row.metric,
      severity: row.severity,
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findAll() {
    const result = await query(
      `SELECT id, dsl_json, scope, metric, severity, enabled, created_at, updated_at
       FROM uptc_llm.rules
       ORDER BY created_at DESC`
    );
    return result.rows.map((row) => this._mapRow(row));
  }

  async findById(id) {
    const result = await query(
      `SELECT id, dsl_json, scope, metric, severity, enabled, created_at, updated_at
       FROM uptc_llm.rules
       WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this._mapRow(result.rows[0]) : null;
  }

  async findByScope(scope) {
    const result = await query(
      `SELECT id, dsl_json, scope, metric, severity, enabled, created_at, updated_at
       FROM uptc_llm.rules
       WHERE scope @> $1 AND enabled = true
       ORDER BY created_at DESC`,
      [scope]
    );
    return result.rows.map((row) => this._mapRow(row));
  }

  async save(rule) {
    const result = await query(
      `INSERT INTO uptc_llm.rules (dsl_json, scope, metric, severity, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at, updated_at`,
      [rule.dslJson, rule.scope, rule.metric, rule.severity, rule.enabled]
    );

    rule.id = result.rows[0].id;
    rule.createdAt = result.rows[0].created_at;
    rule.updatedAt = result.rows[0].updated_at;

    this.logger.info({ ruleId: rule.id }, 'Rule saved');
    return rule;
  }

  async update(id, rule) {
    const result = await query(
      `UPDATE uptc_llm.rules
       SET dsl_json = $1, scope = $2, metric = $3, severity = $4, enabled = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING updated_at`,
      [rule.dslJson, rule.scope, rule.metric, rule.severity, rule.enabled, id]
    );

    if (result.rowCount === 0) {
      throw new Error(`Rule ${id} not found`);
    }

    rule.updatedAt = result.rows[0].updated_at;
    this.logger.info({ ruleId: id }, 'Rule updated');
    return rule;
  }

  async delete(id) {
    const result = await query(`DELETE FROM uptc_llm.rules WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      throw new Error(`Rule ${id} not found`);
    }
    this.logger.info({ ruleId: id }, 'Rule deleted');
  }
}

export default PostgresRulesRepository;
