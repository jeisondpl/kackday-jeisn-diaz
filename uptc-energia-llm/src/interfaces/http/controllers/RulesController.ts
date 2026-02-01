import { FastifyRequest, FastifyReply } from 'fastify';
import {
  RulesRepositoryPort,
  CreateRuleDTO,
  UpdateRuleDTO,
} from '../../../shared/application/ports/RulesRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { RuleDSL } from '../../../shared/domain/Rule.js';

export class RulesController {
  constructor(
    private readonly rulesRepository: RulesRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async listRules(
    request: FastifyRequest<{
      Querystring: {
        enabled?: boolean;
        sede_id?: string;
        sector?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const filters = {
        enabled: request.query.enabled,
        sedeId: request.query.sede_id,
        sector: request.query.sector,
      };

      const rules = await this.rulesRepository.findAll(filters);

      return reply.send({
        data: rules,
        count: rules.length,
      });
    } catch (error) {
      this.logger.error('Failed to list rules', error as Error);
      return reply.status(500).send({
        error: 'Failed to list rules',
        message: (error as Error).message,
      });
    }
  }

  async getRule(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const ruleId = parseInt(request.params.id, 10);

      if (isNaN(ruleId)) {
        return reply.status(400).send({ error: 'Invalid rule ID' });
      }

      const rule = await this.rulesRepository.findById(ruleId);

      if (!rule) {
        return reply.status(404).send({ error: 'Rule not found' });
      }

      return reply.send(rule);
    } catch (error) {
      this.logger.error('Failed to get rule', error as Error);
      return reply.status(500).send({
        error: 'Failed to get rule',
        message: (error as Error).message,
      });
    }
  }

  async createRule(
    request: FastifyRequest<{
      Body: CreateRuleDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      // Basic validation
      const { name, dsl } = request.body;

      if (!name || !dsl) {
        return reply.status(400).send({ error: 'name and dsl are required' });
      }

      // Validate DSL structure
      const validationError = this.validateDSL(dsl);
      if (validationError) {
        return reply.status(400).send({ error: validationError });
      }

      const rule = await this.rulesRepository.create(request.body);

      return reply.status(201).send(rule);
    } catch (error) {
      this.logger.error('Failed to create rule', error as Error);
      return reply.status(500).send({
        error: 'Failed to create rule',
        message: (error as Error).message,
      });
    }
  }

  async updateRule(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateRuleDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      const ruleId = parseInt(request.params.id, 10);

      if (isNaN(ruleId)) {
        return reply.status(400).send({ error: 'Invalid rule ID' });
      }

      // Validate DSL if provided
      if (request.body.dsl) {
        const validationError = this.validateDSL(request.body.dsl);
        if (validationError) {
          return reply.status(400).send({ error: validationError });
        }
      }

      const rule = await this.rulesRepository.update(ruleId, request.body);

      return reply.send(rule);
    } catch (error) {
      this.logger.error('Failed to update rule', error as Error);
      return reply.status(500).send({
        error: 'Failed to update rule',
        message: (error as Error).message,
      });
    }
  }

  async deleteRule(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const ruleId = parseInt(request.params.id, 10);

      if (isNaN(ruleId)) {
        return reply.status(400).send({ error: 'Invalid rule ID' });
      }

      await this.rulesRepository.delete(ruleId);

      return reply.status(204).send();
    } catch (error) {
      this.logger.error('Failed to delete rule', error as Error);
      return reply.status(500).send({
        error: 'Failed to delete rule',
        message: (error as Error).message,
      });
    }
  }

  private validateDSL(dsl: RuleDSL): string | null {
    // Validate required fields
    if (!dsl.type) {
      return 'dsl.type is required';
    }

    if (!dsl.scope) {
      return 'dsl.scope is required';
    }

    if (!dsl.metric) {
      return 'dsl.metric is required';
    }

    if (!dsl.severity) {
      return 'dsl.severity is required';
    }

    if (!dsl.messageTemplate) {
      return 'dsl.messageTemplate is required';
    }

    // Validate type-specific requirements
    switch (dsl.type) {
      case 'out_of_schedule':
        if (!dsl.schedule) {
          return 'dsl.schedule is required for out_of_schedule rules';
        }
        if (!dsl.condition) {
          return 'dsl.condition is required for out_of_schedule rules';
        }
        break;

      case 'absolute_threshold':
        if (!dsl.condition) {
          return 'dsl.condition is required for absolute_threshold rules';
        }
        break;

      case 'baseline_relative':
        if (!dsl.baseline) {
          return 'dsl.baseline is required for baseline_relative rules';
        }
        break;

      case 'budget_window':
        if (!dsl.budget) {
          return 'dsl.budget is required for budget_window rules';
        }
        break;
    }

    return null;
  }
}
