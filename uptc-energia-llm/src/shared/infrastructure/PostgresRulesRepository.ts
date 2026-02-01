import { Pool } from 'pg';
import {
  RulesRepositoryPort,
  CreateRuleDTO,
  UpdateRuleDTO,
} from '../application/ports/RulesRepositoryPort.js';
import { Rule, createRule } from '../domain/Rule.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PostgresRulesRepository implements RulesRepositoryPort {
  private readonly pool: Pool;
  private readonly schema: string;
  private readonly logger: LoggerPort;

  constructor(pool: Pool, schema: string, logger: LoggerPort) {
    this.pool = pool;
    this.schema = schema;
    this.logger = logger;
  }

  async findById(id: number): Promise<Rule | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.rules WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to find rule ${id}`, error as Error);
      throw error;
    }
  }

  async findAll(filters?: {
    enabled?: boolean;
    sedeId?: string;
    sector?: string;
  }): Promise<Rule[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.enabled !== undefined) {
        conditions.push(`enabled = $${paramIndex++}`);
        params.push(filters.enabled);
      }

      if (filters?.sedeId) {
        conditions.push(`(dsl_json->'scope'->>'sede_id' = $${paramIndex} OR dsl_json->'scope'->>'sede_id' IS NULL)`);
        params.push(filters.sedeId);
        paramIndex++;
      }

      if (filters?.sector) {
        conditions.push(`(dsl_json->'scope'->>'sector' = $${paramIndex} OR dsl_json->'scope'->>'sector' IS NULL)`);
        params.push(filters.sector);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await this.pool.query(
        `SELECT * FROM ${this.schema}.rules ${whereClause} ORDER BY created_at DESC`,
        params
      );

      return result.rows.map(this.mapRow);
    } catch (error) {
      this.logger.error('Failed to find rules', error as Error);
      throw error;
    }
  }

  async create(data: CreateRuleDTO): Promise<Rule> {
    try {
      const scope = this.normalizeScope(data.dsl.scope as any);
      const result = await this.pool.query(
        `INSERT INTO ${this.schema}.rules (name, description, dsl_json, scope, metric, severity, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.name,
          data.description || null,
          JSON.stringify(data.dsl),
          JSON.stringify(scope),
          data.dsl.metric,
          data.dsl.severity,
          data.enabled ?? true,
        ]
      );

      this.logger.info(`Created rule: ${data.name}`, { ruleId: result.rows[0].id });

      return this.mapRow(result.rows[0]);
    } catch (error) {
      this.logger.error('Failed to create rule', error as Error);
      throw error;
    }
  }

  async update(id: number, data: UpdateRuleDTO): Promise<Rule> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(data.name);
      }

      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(data.description);
      }

      if (data.dsl !== undefined) {
        updates.push(`dsl_json = $${paramIndex++}`);
        params.push(JSON.stringify(data.dsl));

        const scope = this.normalizeScope((data.dsl as any).scope);
        updates.push(`scope = $${paramIndex++}`);
        params.push(JSON.stringify(scope));

        updates.push(`metric = $${paramIndex++}`);
        params.push(data.dsl.metric);

        updates.push(`severity = $${paramIndex++}`);
        params.push(data.dsl.severity);
      }

      if (data.enabled !== undefined) {
        updates.push(`enabled = $${paramIndex++}`);
        params.push(data.enabled);
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        // Only updated_at changed, fetch current record
        return (await this.findById(id))!;
      }

      params.push(id);

      const result = await this.pool.query(
        `UPDATE ${this.schema}.rules
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        throw new Error(`Rule ${id} not found`);
      }

      this.logger.info(`Updated rule ${id}`, { updates: Object.keys(data) });

      return this.mapRow(result.rows[0]);
    } catch (error) {
      this.logger.error(`Failed to update rule ${id}`, error as Error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.schema}.rules WHERE id = $1`,
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error(`Rule ${id} not found`);
      }

      this.logger.info(`Deleted rule ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete rule ${id}`, error as Error);
      throw error;
    }
  }

  private mapRow(row: any): Rule {
    return createRule({
      id: row.id,
      name: row.name,
      description: row.description,
      dsl: row.dsl_json,
      enabled: row.enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private normalizeScope(scope: { sedeId?: string; sede_id?: string; sector?: string } | undefined) {
    if (!scope) {
      return {};
    }
    return {
      sede_id: scope.sede_id ?? scope.sedeId ?? null,
      sector: scope.sector ?? null,
    };
  }
}
