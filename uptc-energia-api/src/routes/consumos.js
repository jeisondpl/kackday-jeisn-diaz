import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /consumos
 * Get energy consumption readings with filters and pagination
 *
 * Query parameters:
 * - sede_id: Filter by campus (e.g., UPTC_TUN)
 * - from: Start date (ISO 8601 format)
 * - to: End date (ISO 8601 format)
 * - limit: Maximum number of results (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 * - order: Sort order 'asc' or 'desc' (default: desc)
 */
router.get('/', async (req, res) => {
  try {
    const {
      sede_id,
      from,
      to,
      limit = 100,
      offset = 0,
      order = 'desc',
    } = req.query;

    // Validate and sanitize inputs
    const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
    const parsedOffset = parseInt(offset) || 0;
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause dynamically
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (sede_id) {
      conditions.push(`sede_id = $${paramIndex++}`);
      params.push(sede_id);
    }

    if (from) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM consumos ${whereClause}`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT
        reading_id,
        timestamp,
        sede,
        sede_id,
        energia_total_kwh,
        energia_comedor_kwh,
        energia_salones_kwh,
        energia_laboratorios_kwh,
        energia_auditorios_kwh,
        energia_oficinas_kwh,
        potencia_total_kw,
        agua_litros,
        temperatura_exterior_c,
        ocupacion_pct,
        hora,
        dia_semana,
        dia_nombre,
        mes,
        trimestre,
        año,
        periodo_academico,
        es_fin_semana,
        es_festivo,
        es_semana_parciales,
        es_semana_finales,
        co2_kg
      FROM consumos
      ${whereClause}
      ORDER BY timestamp ${sortOrder}
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
    console.error('Error fetching consumos:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /consumos/:reading_id
 * Get specific reading by ID
 */
router.get('/:reading_id', async (req, res) => {
  try {
    const { reading_id } = req.params;

    const result = await query(
      'SELECT * FROM consumos WHERE reading_id = $1',
      [reading_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: `Reading ${reading_id} not found`,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching consumo:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
