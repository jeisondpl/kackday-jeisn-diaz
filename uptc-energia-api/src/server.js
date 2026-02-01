import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { closePool } from './db.js';

// Import routes
import healthRouter from './routes/health.js';
import sedesRouter from './routes/sedes.js';
import consumosRouter from './routes/consumos.js';
import statsRouter from './routes/stats.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// CORS middleware - must be first
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
}));

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'UPTC Energy API',
    version: '1.0.0',
    description: 'REST API for UPTC energy consumption analysis',
    endpoints: {
      health: '/health',
      sedes: '/sedes',
      consumos: '/consumos',
      stats: {
        diario: '/stats/diario',
        sector: '/stats/sector',
        horario: '/stats/horario',
        periodo: '/stats/periodo',
        summary: '/stats/summary',
      },
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

app.use('/health', healthRouter);
app.use('/sedes', sedesRouter);
app.use('/consumos', consumosRouter);
app.use('/stats', statsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  UPTC Energy API Server               ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/sedes`);
  console.log(`  GET  http://localhost:${PORT}/consumos`);
  console.log(`  GET  http://localhost:${PORT}/stats/diario`);
  console.log(`  GET  http://localhost:${PORT}/stats/sector`);
  console.log(`  GET  http://localhost:${PORT}/stats/horario`);
  console.log(`  GET  http://localhost:${PORT}/stats/periodo`);
  console.log(`  GET  http://localhost:${PORT}/stats/summary\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

export default app;
