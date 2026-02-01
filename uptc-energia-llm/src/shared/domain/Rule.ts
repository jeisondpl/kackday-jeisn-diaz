/**
 * Regla de evaluación en formato DSL JSON
 */
export type RuleType = 
  | 'absolute_threshold'
  | 'out_of_schedule'
  | 'baseline_relative'
  | 'budget_window'
  | 'forecast_breach'
  | 'anomaly_score';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface RuleScope {
  sedeId?: string;
  sector?: string;
}

export interface RuleDSL {
  type: RuleType;
  scope: RuleScope;
  metric: string;
  window?: {
    granularity: 'hour' | 'day' | 'week' | 'month';
    lookbackHours?: number;
  };
  condition?: {
    gt?: number;
    lt?: number;
    gte?: number;
    lte?: number;
  };
  schedule?: {
    allowed: Array<{ from: string; to: string }>;
  };
  baseline?: {
    tolerance_pct: number;
  };
  budget?: {
    amount: number;
    period: 'daily' | 'weekly' | 'monthly';
  };
  severity: Severity;
  messageTemplate: string;
  actions?: string[];
}

export interface Rule {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly dsl: RuleDSL;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const createRule = (data: Omit<Rule, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }): Rule => {
  const now = new Date();
  return Object.freeze({
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  });
};
