import { FastifyRequest, FastifyReply } from 'fastify';
import { DetectAnomalies } from '../../../features/analytics/application/DetectAnomalies.js';
import { ForecastConsumption } from '../../../features/analytics/application/ForecastConsumption.js';
import { RecalculateBaselines } from '../../../features/analytics/application/RecalculateBaselines.js';
import { EnergyApiPort } from '../../../shared/application/ports/EnergyApiPort.js';
import { AlertsRepositoryPort } from '../../../shared/application/ports/AlertsRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export class AnalyticsController {
  constructor(
    private readonly detectAnomalies: DetectAnomalies,
    private readonly forecastConsumption: ForecastConsumption,
    private readonly recalculateBaselines: RecalculateBaselines,
    private readonly energyApi: EnergyApiPort,
    private readonly alertsRepository: AlertsRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async getAnomalies(
    request: FastifyRequest<{
      Querystring: {
        sede_id?: string;
        metric?: string;
        hours?: number;
        threshold?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.detectAnomalies.execute({
        sedeId: request.query.sede_id,
        metric: request.query.metric,
        hoursBack: request.query.hours,
        zScoreThreshold: request.query.threshold,
      });

      return reply.send(result);
    } catch (error) {
      this.logger.error('Failed to detect anomalies', error as Error);
      return reply.status(500).send({
        error: 'Failed to detect anomalies',
        message: (error as Error).message,
      });
    }
  }

  async getForecast(
    request: FastifyRequest<{
      Querystring: {
        sede_id?: string;
        metric?: string;
        hours?: number;
        lookback_days?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.forecastConsumption.execute({
        sedeId: request.query.sede_id,
        metric: request.query.metric,
        hoursAhead: request.query.hours,
        lookbackDays: request.query.lookback_days,
      });

      return reply.send(result);
    } catch (error) {
      this.logger.error('Failed to generate forecast', error as Error);
      return reply.status(500).send({
        error: 'Failed to generate forecast',
        message: (error as Error).message,
      });
    }
  }

  async getSummary(
    request: FastifyRequest<{
      Querystring: {
        sede_id?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const sedeId = request.query.sede_id;

      // Fetch data from Energy API
      const [sedes, summary, recentAlerts] = await Promise.all([
        this.energyApi.getSedes(true),
        this.energyApi.getStatsSummary(sedeId),
        this.alertsRepository.findAll({
          sedeId,
          limit: 10,
        }),
      ]);

      // Get recent anomalies
      const anomalyResult = await this.detectAnomalies.execute({
        sedeId,
        hoursBack: 24,
      });

      // Get forecast for next 24 hours
      const forecastResult = await this.forecastConsumption.execute({
        sedeId,
        hoursAhead: 24,
      });

      // Calculate KPIs
      const totalSedes = sedes.length;
      const totalConsumo = sedes.reduce(
        (sum, s) => sum + (s.stats?.totalConsumo || 0),
        0
      );
      const avgConsumo = totalSedes > 0 ? totalConsumo / totalSedes : 0;

      const openAlerts = recentAlerts.filter((a) => a.status === 'open').length;
      const criticalAlerts = recentAlerts.filter(
        (a) => a.severity === 'critical'
      ).length;

      // Build response
      const analyticsData = {
        kpis: {
          totalSedes,
          totalConsumo,
          avgConsumo,
          openAlerts,
          criticalAlerts,
          anomaliesLast24h: anomalyResult.anomaliesCount,
        },
        sedes: sedes.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          totalConsumo: s.stats?.totalConsumo,
          promedioConsumo: s.stats?.promedioConsumo,
        })),
        recentAlerts: recentAlerts.slice(0, 5).map((a) => ({
          id: a.id,
          severity: a.severity,
          message: a.message,
          sedeId: a.sedeId,
          sector: a.sector,
          createdAt: a.createdAt,
        })),
        anomalies: {
          count: anomalyResult.anomaliesCount,
          threshold: anomalyResult.threshold,
          recent: anomalyResult.anomalies.slice(0, 5),
        },
        forecast: {
          next24Hours: forecastResult.forecast.slice(0, 24),
          method: forecastResult.method,
          accuracy: forecastResult.historicalData,
        },
        summary,
        generatedAt: new Date(),
      };

      return reply.send(analyticsData);
    } catch (error) {
      this.logger.error('Failed to generate analytics summary', error as Error);
      return reply.status(500).send({
        error: 'Failed to generate analytics summary',
        message: (error as Error).message,
      });
    }
  }

  async getBaseline(
    request: FastifyRequest<{
      Querystring: {
        sede_id?: string;
        metric?: string;
        days?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const days = request.query.days || 30;
      const metric = request.query.metric || 'energiaTotal';

      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

      // Fetch historical data
      const readings = await this.energyApi.getConsumos({
        sedeId: request.query.sede_id,
        from,
        to,
        limit: 10000,
      });

      // Group by hour and day of week
      const baseline = new Map<string, { values: number[]; mean: number; stdDev: number }>();

      for (const reading of readings) {
        const value = (reading.metrics as any)[metric];
        if (value === undefined) continue;

        const hour = reading.temporalDimensions?.hora;
        const dayOfWeek = reading.temporalDimensions?.diaSemana;

        if (hour === undefined || dayOfWeek === undefined) continue;

        const key = `${hour}_${dayOfWeek}`;
        if (!baseline.has(key)) {
          baseline.set(key, { values: [], mean: 0, stdDev: 0 });
        }
        baseline.get(key)!.values.push(value);
      }

      // Calculate statistics
      const baselineData: Array<{
        hour: number;
        dayOfWeek: number;
        mean: number;
        stdDev: number;
        count: number;
      }> = [];

      for (const [key, data] of baseline.entries()) {
        const [hour, dayOfWeek] = key.split('_').map(Number);
        const mean = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
        const variance = data.values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / data.values.length;
        const stdDev = Math.sqrt(variance);

        baselineData.push({
          hour,
          dayOfWeek,
          mean,
          stdDev,
          count: data.values.length,
        });
      }

      // Sort by day of week and hour
      baselineData.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek;
        }
        return a.hour - b.hour;
      });

      return reply.send({
        sedeId: request.query.sede_id,
        metric,
        days,
        baseline: baselineData,
        totalDataPoints: readings.length,
        generatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to calculate baseline', error as Error);
      return reply.status(500).send({
        error: 'Failed to calculate baseline',
        message: (error as Error).message,
      });
    }
  }

  async recalculateBaseline(
    request: FastifyRequest<{
      Body?: {
        sede_id?: string;
        metric?: string;
        lookback_days?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.recalculateBaselines.execute({
        sedeId: request.body?.sede_id,
        metric: request.body?.metric,
        lookbackDays: request.body?.lookback_days,
      });

      return reply.send(result);
    } catch (error) {
      this.logger.error('Failed to recalculate baselines', error as Error);
      return reply.status(500).send({
        error: 'Failed to recalculate baselines',
        message: (error as Error).message,
      });
    }
  }
}
