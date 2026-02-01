import { FastifyRequest, FastifyReply } from 'fastify';
import { AlertsRepositoryPort, AlertFilters } from '../../../shared/application/ports/AlertsRepositoryPort.js';
import { ExplainAlert } from '../../../features/explainability/application/ExplainAlert.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { AlertStatus } from '../../../shared/domain/Alert.js';

export class AlertsController {
  constructor(
    private readonly alertsRepository: AlertsRepositoryPort,
    private readonly explainAlertUseCase: ExplainAlert,
    private readonly logger: LoggerPort
  ) {}

  async listAlerts(
    request: FastifyRequest<{
      Querystring: {
        status?: AlertStatus;
        severity?: string;
        sede_id?: string;
        sector?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const filters: AlertFilters = {
        status: request.query.status,
        severity: request.query.severity,
        sedeId: request.query.sede_id,
        sector: request.query.sector,
        from: request.query.from ? new Date(request.query.from) : undefined,
        to: request.query.to ? new Date(request.query.to) : undefined,
        limit: request.query.limit || 100,
        offset: request.query.offset || 0,
      };

      const alerts = await this.alertsRepository.findAll(filters);

      return reply.send({
        data: alerts,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          count: alerts.length,
        },
      });
    } catch (error) {
      this.logger.error('Failed to list alerts', error as Error);
      return reply.status(500).send({
        error: 'Failed to list alerts',
        message: (error as Error).message,
      });
    }
  }

  async getAlert(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const alertId = parseInt(request.params.id, 10);

      if (isNaN(alertId)) {
        return reply.status(400).send({ error: 'Invalid alert ID' });
      }

      const alert = await this.alertsRepository.findById(alertId);

      if (!alert) {
        return reply.status(404).send({ error: 'Alert not found' });
      }

      // Include evidence
      const evidence = await this.alertsRepository.getEvidence(alertId);

      return reply.send({
        alert,
        evidence,
      });
    } catch (error) {
      this.logger.error('Failed to get alert', error as Error);
      return reply.status(500).send({
        error: 'Failed to get alert',
        message: (error as Error).message,
      });
    }
  }

  async acknowledgeAlert(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { acknowledged_by: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const alertId = parseInt(request.params.id, 10);

      if (isNaN(alertId)) {
        return reply.status(400).send({ error: 'Invalid alert ID' });
      }

      const { acknowledged_by } = request.body;

      if (!acknowledged_by) {
        return reply.status(400).send({ error: 'acknowledged_by is required' });
      }

      const alert = await this.alertsRepository.acknowledge(alertId, acknowledged_by);

      return reply.send(alert);
    } catch (error) {
      this.logger.error('Failed to acknowledge alert', error as Error);
      return reply.status(500).send({
        error: 'Failed to acknowledge alert',
        message: (error as Error).message,
      });
    }
  }

  async explainAlert(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const alertId = parseInt(request.params.id, 10);

      if (isNaN(alertId)) {
        return reply.status(400).send({ error: 'Invalid alert ID' });
      }

      const explanation = await this.explainAlertUseCase.execute(alertId);

      return reply.send(explanation);
    } catch (error) {
      this.logger.error('Failed to explain alert', error as Error);
      return reply.status(500).send({
        error: 'Failed to explain alert',
        message: (error as Error).message,
      });
    }
  }
}
