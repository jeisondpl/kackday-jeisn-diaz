import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { appConfig } from './shared/config/index.js';
import { DependencyContainer } from './shared/infrastructure/DependencyContainer.js';

// Routes
import { alertsRoutes } from './interfaces/http/routes/alerts.js';
import { rulesRoutes } from './interfaces/http/routes/rules.js';
import { recommendationsRoutes } from './interfaces/http/routes/recommendations.js';
import { ingestionRoutes } from './interfaces/http/routes/ingestion.js';
import { queryRoutes } from './interfaces/http/routes/query.js';
import { analyticsRoutes } from './interfaces/http/routes/analytics.js';
import { docsRoutes } from './interfaces/http/routes/docs.js';

const server = Fastify({
  logger: false, // We use our own logger (PinoLoggerAdapter)
});

// Initialize dependency container
const container = new DependencyContainer();

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: true,
    });

    await server.register(swagger, {
      openapi: {
        info: {
          title: 'UPTC Energia LLM API',
          description: 'Sistema inteligente de domótica y análisis energético con IA',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${appConfig.port}`,
            description: 'Development server',
          },
        ],
        tags: [
          { name: 'health', description: 'Health check endpoints' },
          { name: 'ingestion', description: 'Data ingestion from Energy API' },
          { name: 'alerts', description: 'Alert management' },
          { name: 'rules', description: 'Rules engine management' },
          { name: 'recommendations', description: 'AI recommendations' },
          { name: 'query', description: 'Natural language queries' },
          { name: 'analytics', description: 'Anomaly detection and forecasting' },
          { name: 'docs', description: 'Knowledge base documents' },
        ],
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    // Health check route
    server.get('/llm/health', {
      schema: {
        tags: ['health'],
        summary: 'Health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'boolean' },
                  energyApi: { type: 'boolean' },
                },
              },
              config: {
                type: 'object',
                properties: {
                  rulesEngine: { type: 'boolean' },
                  anomalyDetection: { type: 'boolean' },
                  forecasting: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    }, async () => {
      const health = await container.healthCheck();

      return {
        status: health.database && health.energyApi ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: health,
        config: {
          rulesEngine: appConfig.enableRulesEngine,
          anomalyDetection: appConfig.enableAnomalyDetection,
          forecasting: appConfig.enableForecasting,
        },
      };
    });

    // Register feature routes
    await alertsRoutes(server, container.alertsController);
    await rulesRoutes(server, container.rulesController);
    await recommendationsRoutes(server, container.recommendationsController);
    await ingestionRoutes(server, container.ingestionController);
    await queryRoutes(server, container.queryController);
    await analyticsRoutes(server, container.analyticsController);
    await docsRoutes(server, container.docsController);

    // Start server
    await server.listen({ port: appConfig.port, host: '0.0.0.0' });

    // Start scheduler
    container.startScheduler();

    container.logger.info(`Server running on port ${appConfig.port}`, {
      environment: appConfig.nodeEnv,
      docsUrl: `http://localhost:${appConfig.port}/docs`,
      schedulerStatus: container.getSchedulerStatus(),
    });
  } catch (err) {
    container.logger.error('Failed to start server', err as Error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  container.logger.info('SIGTERM received, shutting down gracefully');
  await server.close();
  await container.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  container.logger.info('SIGINT received, shutting down gracefully');
  await server.close();
  await container.close();
  process.exit(0);
});

start();
