/**
 * PostgreSQL Database Connection Pool
 * Shared infrastructure for all repositories
 */

import pkg from 'pg';
const { Pool } = pkg;
import config from '../config/index.js';

let pool = null;

export function createPool() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error', err);
  });

  return pool;
}

export function getPool() {
  if (!pool) {
    return createPool();
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
}

export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Health check
export async function checkHealth() {
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    return {
      status: 'healthy',
      database: result.rows[0].db,
      timestamp: result.rows[0].now,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

export default {
  createPool,
  getPool,
  query,
  getClient,
  closePool,
  checkHealth,
};
