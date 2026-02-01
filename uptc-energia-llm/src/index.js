/**
 * UPTC Energia LLM - Main Entry Point
 * Hexagonal Architecture + Screaming Architecture + Vertical Slice
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import config from './shared/config/index.js';
import logger from './shared/observability/logger.js';
import { checkHealth as checkDbHealth } from './shared/infrastructure/database.js';

// Routes
import healthRoutes from './interfaces/http/routes/health.js';
import rulesRoutes from './interfaces/http/routes/rules.js';
import alertsRoutes from './interfaces/http/routes/alerts.js';
import ingestionRoutes from './interfaces/http/routes/ingestion.js';

const fastify = Fastify({
  logger: logger,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

// Register routes
await fastify.register(healthRoutes, { prefix: '/llm' });
await fastify.register(rulesRoutes, { prefix: '/llm' });
await fastify.register(alertsRoutes, { prefix: '/llm' });
await fastify.register(ingestionRoutes, { prefix: '/llm' });

// Root route
fastify.get('/', async (request, reply) => {
  return {
    service: 'UPTC Energia LLM',
    version: '1.0.0',
    description: 'Motor de domótica simulada e IA para análisis inteligente de consumo energético',
    endpoints: {
      health: 'GET /llm/health',
      rules: {
        list: 'GET /llm/rules',
        create: 'POST /llm/rules',
        get: 'GET /llm/rules/:id',
        update: 'PUT /llm/rules/:id',
        delete: 'DELETE /llm/rules/:id',
      },
      alerts: {
        list: 'GET /llm/alerts',
        get: 'GET /llm/alerts/:id',
        acknowledge: 'POST /llm/alerts/:id/ack',
        explanation: 'GET /llm/alerts/:id/explanation',
      },
      ingestion: {
        runManual: 'POST /llm/ingestion/run',
      },
    },
  };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error',
    statusCode: error.statusCode || 500,
  });
});

// Start server
async function start() {
  try {
    // Check database connection
    const dbHealth = await checkDbHealth();
    if (dbHealth.status !== 'healthy') {
      logger.error({ dbHealth }, 'Database is not healthy');
      throw new Error('Database connection failed');
    }
    logger.info({ dbHealth }, 'Database connection established');

    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`🚀 UPTC Energia LLM server started on port ${config.port}`);
    logger.info(`📚 API documentation available at http://localhost:${config.port}/`);
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, closing server gracefully...`);
    await fastify.close();
    process.exit(0);
  });
});

start();

export default fastify;
