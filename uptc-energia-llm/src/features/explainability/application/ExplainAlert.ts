import { AlertsRepositoryPort } from '../../../shared/application/ports/AlertsRepositoryPort.js';
import { RulesRepositoryPort } from '../../../shared/application/ports/RulesRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { Alert } from '../../../shared/domain/Alert.js';
import { Evidence } from '../../../shared/domain/Evidence.js';

export interface AlertExplanation {
  alert: Alert;
  rule?: {
    id: number;
    name: string;
    description?: string;
    type: string;
  };
  evidence: Evidence[];
  explanation: {
    summary: string;
    details: string[];
    metrics: Record<string, any>;
  };
}

export class ExplainAlert {
  constructor(
    private readonly alertsRepository: AlertsRepositoryPort,
    private readonly rulesRepository: RulesRepositoryPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(alertId: number): Promise<AlertExplanation> {
    this.logger.info(`Generating explanation for alert ${alertId}`);

    try {
      // Fetch alert
      const alert = await this.alertsRepository.findById(alertId);
      if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
      }

      // Fetch rule if exists
      let rule: AlertExplanation['rule'] | undefined;
      if (alert.ruleId) {
        const ruleEntity = await this.rulesRepository.findById(alert.ruleId);
        if (ruleEntity) {
          rule = {
            id: ruleEntity.id,
            name: ruleEntity.name,
            description: ruleEntity.description,
            type: ruleEntity.dsl.type,
          };
        }
      }

      // Fetch evidence
      const evidence = await this.alertsRepository.getEvidence(alertId);

      // Generate explanation
      const explanation = this.generateExplanation(alert, rule, evidence);

      this.logger.info(`Explanation generated for alert ${alertId}`, {
        evidenceCount: evidence.length,
      });

      return {
        alert,
        rule,
        evidence,
        explanation,
      };
    } catch (error) {
      this.logger.error(`Failed to explain alert ${alertId}`, error as Error);
      throw error;
    }
  }

  private generateExplanation(
    alert: Alert,
    rule: AlertExplanation['rule'] | undefined,
    evidence: Evidence[]
  ): AlertExplanation['explanation'] {
    const details: string[] = [];
    const metrics: Record<string, any> = {};

    // Basic alert info
    details.push(`Alert triggered at ${alert.createdAt.toISOString()}`);
    details.push(`Severity: ${alert.severity}`);
    details.push(`Metric: ${alert.metric}`);
    details.push(`Sede: ${alert.sedeId}${alert.sector ? ` - ${alert.sector}` : ''}`);

    // Rule-based explanation
    if (rule) {
      details.push(`Rule: ${rule.name} (${rule.type})`);
      if (rule.description) {
        details.push(`Description: ${rule.description}`);
      }
    }

    // Evidence-based explanation
    if (evidence.length > 0) {
      const latestEvidence = evidence[0]; // Most recent evidence

      // Values
      if (latestEvidence.values) {
        metrics.currentValues = latestEvidence.values;
        details.push(`Current value: ${JSON.stringify(latestEvidence.values)}`);
      }

      // Baseline comparison
      if (latestEvidence.baseline) {
        metrics.baseline = latestEvidence.baseline;
        details.push(`Baseline: ${JSON.stringify(latestEvidence.baseline)}`);
      }

      // Delta
      if (latestEvidence.delta) {
        metrics.delta = latestEvidence.delta;
        const deltaDesc = this.describeDelta(latestEvidence.delta);
        if (deltaDesc) {
          details.push(deltaDesc);
        }
      }

      // Anomaly score
      if (latestEvidence.anomalyScore !== undefined) {
        metrics.anomalyScore = latestEvidence.anomalyScore;
        const anomalyLevel = this.classifyAnomalyScore(latestEvidence.anomalyScore);
        details.push(`Anomaly level: ${anomalyLevel} (score: ${latestEvidence.anomalyScore.toFixed(2)})`);
      }

      // Forecast
      if (latestEvidence.forecast) {
        metrics.forecast = latestEvidence.forecast;
        details.push(`Forecast data available`);
      }
    }

    // Generate summary
    const summary = this.generateSummary(alert, rule, evidence);

    return {
      summary,
      details,
      metrics,
    };
  }

  private generateSummary(
    alert: Alert,
    rule: AlertExplanation['rule'] | undefined,
    evidence: Evidence[]
  ): string {
    const parts: string[] = [];

    parts.push(`This ${alert.severity} alert was triggered`);

    if (rule) {
      parts.push(`by the "${rule.name}" rule (${rule.type})`);
    }

    if (evidence.length > 0) {
      const latestEvidence = evidence[0];
      if (latestEvidence.anomalyScore !== undefined) {
        const level = this.classifyAnomalyScore(latestEvidence.anomalyScore);
        parts.push(`with ${level.toLowerCase()} anomaly detection`);
      }
    }

    parts.push(`for ${alert.metric} in ${alert.sedeId}${alert.sector ? ` (${alert.sector})` : ''}`);

    return parts.join(' ') + '.';
  }

  private describeDelta(delta: any): string | null {
    if (delta.percentage !== undefined) {
      const direction = delta.percentage > 0 ? 'increase' : 'decrease';
      return `${Math.abs(delta.percentage).toFixed(1)}% ${direction} from baseline`;
    }

    if (delta.absolute !== undefined) {
      const direction = delta.absolute > 0 ? 'above' : 'below';
      return `${Math.abs(delta.absolute).toFixed(2)} units ${direction} baseline`;
    }

    return null;
  }

  private classifyAnomalyScore(score: number): string {
    if (score >= 3.0) return 'Critical';
    if (score >= 2.0) return 'High';
    if (score >= 1.0) return 'Medium';
    return 'Low';
  }
}
