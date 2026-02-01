import { RulesRepositoryPort } from '../../../shared/application/ports/RulesRepositoryPort.js';
import { AlertsRepositoryPort, CreateAlertDTO } from '../../../shared/application/ports/AlertsRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { Rule, RuleDSL } from '../../../shared/domain/Rule.js';
import { SensorReading } from '../../../shared/domain/SensorReading.js';
import { Alert, generateFingerprint } from '../../../shared/domain/Alert.js';

interface EvaluationResult {
  triggeredAlerts: Alert[];
  rulesEvaluated: number;
  readingsProcessed: number;
}

export class EvaluateRules {
  constructor(
    private readonly rulesRepository: RulesRepositoryPort,
    private readonly alertsRepository: AlertsRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(readings: SensorReading[], filters?: { sedeId?: string; sector?: string }): Promise<EvaluationResult> {
    this.logger.info('Starting rules evaluation', {
      readingsCount: readings.length,
      filters,
    });

    try {
      // Fetch enabled rules
      const rules = await this.rulesRepository.findAll({
        enabled: true,
        sedeId: filters?.sedeId,
        sector: filters?.sector,
      });

      if (rules.length === 0) {
        this.logger.info('No enabled rules found');
        return {
          triggeredAlerts: [],
          rulesEvaluated: 0,
          readingsProcessed: readings.length,
        };
      }

      const triggeredAlerts: Alert[] = [];

      // Evaluate each rule
      for (const rule of rules) {
        const alerts = await this.evaluateRule(rule, readings);
        triggeredAlerts.push(...alerts);
      }

      this.logger.info('Rules evaluation completed', {
        rulesEvaluated: rules.length,
        alertsTriggered: triggeredAlerts.length,
      });

      return {
        triggeredAlerts,
        rulesEvaluated: rules.length,
        readingsProcessed: readings.length,
      };
    } catch (error) {
      this.logger.error('Rules evaluation failed', error as Error);
      throw error;
    }
  }

  private async evaluateRule(rule: Rule, readings: SensorReading[]): Promise<Alert[]> {
    const dsl = rule.dsl;
    const alerts: Alert[] = [];

    // Filter readings by rule scope
    const scopedReadings = this.filterReadingsByScope(readings, dsl);

    if (scopedReadings.length === 0) {
      return alerts;
    }

    this.logger.debug(`Evaluating rule: ${rule.name}`, {
      ruleId: rule.id,
      type: dsl.type,
      readingsCount: scopedReadings.length,
    });

    // Evaluate based on rule type
    switch (dsl.type) {
      case 'out_of_schedule':
        alerts.push(...await this.evaluateOutOfSchedule(rule, scopedReadings));
        break;

      case 'absolute_threshold':
        alerts.push(...await this.evaluateAbsoluteThreshold(rule, scopedReadings));
        break;

      case 'baseline_relative':
        alerts.push(...await this.evaluateBaselineRelative(rule, scopedReadings));
        break;

      case 'budget_window':
        alerts.push(...await this.evaluateBudgetWindow(rule, scopedReadings));
        break;

      default:
        this.logger.warn(`Unsupported rule type: ${dsl.type}`, { ruleId: rule.id });
    }

    return alerts;
  }

  private filterReadingsByScope(readings: SensorReading[], dsl: RuleDSL): SensorReading[] {
    return readings.filter((reading) => {
      if (dsl.scope.sedeId && reading.sedeId !== dsl.scope.sedeId) {
        return false;
      }
      if (dsl.scope.sector && reading.sector !== dsl.scope.sector) {
        return false;
      }
      return true;
    });
  }

  private async evaluateOutOfSchedule(rule: Rule, readings: SensorReading[]): Promise<Alert[]> {
    const dsl = rule.dsl;
    const alerts: Alert[] = [];

    if (!dsl.schedule || !dsl.condition) {
      this.logger.warn('out_of_schedule rule missing schedule or condition', { ruleId: rule.id });
      return alerts;
    }

    for (const reading of readings) {
      const hour = reading.temporalDimensions?.hora;
      if (hour === undefined) continue;

      // Check if current hour is outside allowed schedule
      const isOutOfSchedule = !this.isHourInSchedule(hour, dsl.schedule.allowed);

      if (isOutOfSchedule) {
        const value = this.extractMetricValue(reading, dsl.metric);
        if (value === undefined) continue;

        // Check if value exceeds threshold
        const exceedsThreshold = this.checkCondition(value, dsl.condition);

        if (exceedsThreshold) {
          const alert = await this.createAlert(rule, reading, value, {
            reason: 'out_of_schedule',
            hour,
            threshold: dsl.condition.gt || dsl.condition.gte || 0,
          });

          if (alert) {
            alerts.push(alert);
          }
        }
      }
    }

    return alerts;
  }

  private async evaluateAbsoluteThreshold(rule: Rule, readings: SensorReading[]): Promise<Alert[]> {
    const dsl = rule.dsl;
    const alerts: Alert[] = [];

    if (!dsl.condition) {
      this.logger.warn('absolute_threshold rule missing condition', { ruleId: rule.id });
      return alerts;
    }

    for (const reading of readings) {
      const value = this.extractMetricValue(reading, dsl.metric);
      if (value === undefined) continue;

      const exceedsThreshold = this.checkCondition(value, dsl.condition);

      if (exceedsThreshold) {
        const alert = await this.createAlert(rule, reading, value, {
          reason: 'absolute_threshold',
          threshold: dsl.condition.gt || dsl.condition.gte || dsl.condition.lt || dsl.condition.lte || 0,
        });

        if (alert) {
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  private async evaluateBaselineRelative(rule: Rule, readings: SensorReading[]): Promise<Alert[]> {
    const dsl = rule.dsl;
    const alerts: Alert[] = [];

    if (!dsl.baseline) {
      this.logger.warn('baseline_relative rule missing baseline config', { ruleId: rule.id });
      return alerts;
    }

    // Calculate baseline from historical data (simplified - use average)
    const baseline = this.calculateBaseline(readings, dsl.metric);

    for (const reading of readings) {
      const value = this.extractMetricValue(reading, dsl.metric);
      if (value === undefined || baseline === 0) continue;

      const deviationPct = ((value - baseline) / baseline) * 100;

      if (Math.abs(deviationPct) > dsl.baseline.tolerance_pct) {
        const alert = await this.createAlert(rule, reading, value, {
          reason: 'baseline_relative',
          baseline,
          deviation: deviationPct,
          tolerance: dsl.baseline.tolerance_pct,
        });

        if (alert) {
          alerts.push(alert);

          // Add evidence with baseline info
          await this.alertsRepository.addEvidence(alert.id, {
            values: { current: value },
            baseline: { baseline: baseline, method: 'average' },
            delta: { absolute: value - baseline, percentage: deviationPct },
            anomalyScore: Math.abs(deviationPct) / dsl.baseline.tolerance_pct,
          });
        }
      }
    }

    return alerts;
  }

  private async evaluateBudgetWindow(rule: Rule, readings: SensorReading[]): Promise<Alert[]> {
    const dsl = rule.dsl;
    const alerts: Alert[] = [];

    if (!dsl.budget) {
      this.logger.warn('budget_window rule missing budget config', { ruleId: rule.id });
      return alerts;
    }

    // Sum total consumption in the window
    const totalConsumption = readings.reduce((sum, reading) => {
      const value = this.extractMetricValue(reading, dsl.metric);
      return sum + (value || 0);
    }, 0);

    if (totalConsumption > dsl.budget.amount) {
      const firstReading = readings[0];
      const lastReading = readings[readings.length - 1];

      const alert = await this.createAlert(rule, firstReading, totalConsumption, {
        reason: 'budget_window',
        budget: dsl.budget.amount,
        period: dsl.budget.period,
        windowStart: firstReading.timestamp,
        windowEnd: lastReading.timestamp,
      });

      if (alert) {
        alerts.push(alert);

        await this.alertsRepository.addEvidence(alert.id, {
          values: { total: totalConsumption, readingsCount: readings.length },
          baseline: { budget: dsl.budget.amount, period: dsl.budget.period },
          delta: { absolute: totalConsumption - dsl.budget.amount, percentage: ((totalConsumption - dsl.budget.amount) / dsl.budget.amount) * 100 },
          anomalyScore: totalConsumption / dsl.budget.amount,
        });
      }
    }

    return alerts;
  }

  private isHourInSchedule(hour: number, allowedRanges: Array<{ from: string; to: string }>): boolean {
    for (const range of allowedRanges) {
      const [fromHour] = range.from.split(':').map(Number);
      const [toHour] = range.to.split(':').map(Number);

      if (hour >= fromHour && hour < toHour) {
        return true;
      }
    }
    return false;
  }

  private checkCondition(value: number, condition: NonNullable<RuleDSL['condition']>): boolean {
    if (condition.gt !== undefined && value <= condition.gt) return false;
    if (condition.gte !== undefined && value < condition.gte) return false;
    if (condition.lt !== undefined && value >= condition.lt) return false;
    if (condition.lte !== undefined && value > condition.lte) return false;
    return true;
  }

  private extractMetricValue(reading: SensorReading, metric: string): number | undefined {
    const metrics = reading.metrics as any;
    return metrics[metric];
  }

  private calculateBaseline(readings: SensorReading[], metric: string): number {
    const values = readings
      .map((r) => this.extractMetricValue(r, metric))
      .filter((v): v is number => v !== undefined);

    if (values.length === 0) return 0;

    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private async createAlert(
    rule: Rule,
    reading: SensorReading,
    value: number,
    context: any
  ): Promise<Alert | null> {
    const windowStart = reading.timestamp;
    const windowEnd = new Date(reading.timestamp.getTime() + 60 * 60 * 1000); // 1 hour window

    const fingerprint = generateFingerprint(
      rule.id,
      reading.sedeId,
      reading.sector,
      windowStart,
      windowEnd
    );

    // Check if alert already exists
    const existing = await this.alertsRepository.findByFingerprint(fingerprint);
    if (existing) {
      return null; // Alert already created
    }

    // Render message template
    const message = this.renderMessageTemplate(rule.dsl.messageTemplate, {
      sector: reading.sector || 'general',
      value,
      ...context,
    });

    const alertData: CreateAlertDTO = {
      fingerprint,
      ruleId: rule.id,
      sedeId: reading.sedeId,
      sector: reading.sector,
      metric: rule.dsl.metric,
      severity: rule.dsl.severity,
      message,
      windowStart,
      windowEnd,
    };

    return await this.alertsRepository.create(alertData);
  }

  private renderMessageTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key]?.toString() || match;
    });
  }
}
