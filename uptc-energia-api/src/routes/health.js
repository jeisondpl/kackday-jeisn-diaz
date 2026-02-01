import express from 'express';
import { query } from '../db.js';

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as timestamp, version() as pg_version');

    res.json({
      status: 'ok',
      timestamp: result.rows[0].timestamp,
      database: {
        connected: true,
        version: result.rows[0].pg_version.split(' ')[1],
      },
      api: {
        name: 'UPTC Energy API',
        version: '1.0.0',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

export default router;
