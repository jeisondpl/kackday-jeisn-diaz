import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /sedes
 * Get all campus locations with optional statistics
 */
router.get('/', async (req, res) => {
  try {
    const { with_stats } = req.query;

    let queryText;
    if (with_stats === 'true') {
      queryText = 'SELECT * FROM v_sedes_con_stats ORDER BY sede_id';
    } else {
      queryText = 'SELECT * FROM sedes ORDER BY sede_id';
    }

    const result = await query(queryText);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching sedes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /sedes/:sede_id
 * Get specific campus by ID
 */
router.get('/:sede_id', async (req, res) => {
  try {
    const { sede_id } = req.params;

    const result = await query(
      'SELECT * FROM v_sedes_con_stats WHERE sede_id = $1',
      [sede_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: `Sede ${sede_id} not found`,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sede:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
