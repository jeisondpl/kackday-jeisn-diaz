import { Pool, PoolConfig } from 'pg';
import { LoggerPort } from '../application/ports/LoggerPort.js';

export class PostgresPool {
  private readonly pool: Pool;
  private readonly logger: LoggerPort;

  constructor(connectionString: string, schema: string, config: Partial<PoolConfig>, logger: LoggerPort) {
    this.logger = logger;

    this.pool = new Pool({
      connectionString,
      ...config,
    });

    // Set schema search path for all connections
    this.pool.on('connect', async (client) => {
      try {
        await client.query(`SET search_path TO ${schema}, public`);
      } catch (error) {
        this.logger.error('Failed to set search path', error as Error);
      }
    });

    this.pool.on('error', (error) => {
      this.logger.error('Unexpected pool error', error);
    });

    this.logger.info('PostgreSQL pool initialized', {
      min: config.min,
      max: config.max,
      schema,
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('PostgreSQL pool closed');
    } catch (error) {
      this.logger.error('Error closing pool', error as Error);
      throw error;
    }
  }
}
