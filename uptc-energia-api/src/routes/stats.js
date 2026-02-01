import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /stats/diario
 * Get daily aggregated energy consumption
 *
 * Query parameters:
 * - sede_id: Filter by campus
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - limit: Maximum results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
router.get('/diario', async (req, res) => {
  try {
    const { sede_id, from, to, limit = 100, offset = 0 } = req.query;

    const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
    const parsedOffset = parseInt(offset) || 0;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (sede_id) {
      conditions.push(`sede_id = $${paramIndex++}`);
      params.push(sede_id);
    }

    if (from) {
      conditions.push(`fecha >= $${paramIndex++}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`fecha <= $${paramIndex++}`);
      params.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get count
    const countQuery = `SELECT COUNT(*) FROM v_consumo_diario ${whereClause}`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get data
    const dataQuery = `
      SELECT * FROM v_consumo_diario
      ${whereClause}
      ORDER BY fecha DESC, sede_id
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(parsedLimit, parsedOffset);

    const dataResult = await query(dataQuery, params);

    res.json({
      count: dataResult.rows.length,
      total: totalCount,
      limit: parsedLimit,
      offset: parsedOffset,
      data: dataResult.rows,
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /stats/sector
 * Get energy consumption breakdown by sector
 *
 * Query parameters:
 * - sede_id: Filter by campus
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - limit: Maximum results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
router.get('/sector', async (req, res) => {
  try {
    const { sede_id, from, to, limit = 100, offset = 0 } = req.query;

    const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
    const parsedOffset = parseInt(offset) || 0;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (sede_id) {
      conditions.push(`sede_id = $${paramIndex++}`);
      params.push(sede_id);
    }

    if (from) {
      conditions.push(`fecha >= $${paramIndex++}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`fecha <= $${paramIndex++}`);
      params.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get count
    const countQuery = `SELECT COUNT(*) FROM v_consumo_por_sector ${whereClause}`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get data
    const dataQuery = `
      SELECT * FROM v_consumo_por_sector
      ${whereClause}
      ORDER BY fecha DESC, sede_id
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(parsedLimit, parsedOffset);

    const dataResult = await query(dataQuery, params);

    res.json({
      count: dataResult.rows.length,
      total: totalCount,
      limit: parsedLimit,
      offset: parsedOffset,
      data: dataResult.rows,
    });
  } catch (error) {
    console.error('Error fetching sector stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /stats/horario
 * Get average hourly consumption patterns
 *
 * Query parameters:
 * - sede_id: Filter by campus
 * - dia_semana: Day of week (0-6, 0=Monday)
 * - es_fin_semana: Filter weekends (true/false)
 */
router.get('/horario', async (req, res) => {
  try {
    const { sede_id, dia_semana, es_fin_semana } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (sede_id) {
      conditions.push(`sede_id = $${paramIndex++}`);
      params.push(sede_id);
    }

    if (dia_semana !== undefined) {
      conditions.push(`hora IN (SELECT hora FROM v_patron_horario WHERE dia_semana = $${paramIndex++})`);
      params.push(parseInt(dia_semana));
    }

    if (es_fin_semana !== undefined) {
      conditions.push(`es_fin_semana = $${paramIndex++}`);
      params.push(es_fin_semana === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT * FROM v_patron_horario
      ${whereClause}
      ORDER BY sede_id, hora
    `;

    const result = await query(dataQuery, params);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching hourly patterns:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /stats/periodo
 * Get consumption by academic period
 *
 * Query parameters:
 * - sede_id: Filter by campus
 * - año: Filter by year
 */
router.get('/periodo', async (req, res) => {
  try {
    const { sede_id, año } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (sede_id) {
      conditions.push(`sede_id = $${paramIndex++}`);
      params.push(sede_id);
    }

    if (año) {
      conditions.push(`año = $${paramIndex++}`);
      params.push(parseInt(año));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT * FROM v_consumo_por_periodo
      ${whereClause}
      ORDER BY año DESC, sede_id, periodo_academico
    `;

    const result = await query(dataQuery, params);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching period stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /stats/summary
 * Get overall summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const { sede_id } = req.query;

    const whereClause = sede_id ? 'WHERE sede_id = $1' : '';
    const params = sede_id ? [sede_id] : [];

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT sede_id) as total_sedes,
        COUNT(*) as total_lecturas,
        MIN(timestamp) as fecha_inicio,
        MAX(timestamp) as fecha_fin,
        ROUND(AVG(energia_total_kwh)::numeric, 2) as energia_promedio_kwh,
        ROUND(SUM(energia_total_kwh)::numeric, 2) as energia_total_kwh,
        ROUND(SUM(co2_kg)::numeric, 2) as co2_total_kg,
        ROUND(SUM(agua_litros)::numeric, 2) as agua_total_litros
      FROM consumos
      ${whereClause}
    `;

    const result = await query(summaryQuery, params);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
