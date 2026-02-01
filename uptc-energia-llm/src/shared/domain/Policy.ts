export interface PolicySchedule {
  allowed: Array<{ from: string; to: string }>;
}

export interface PolicyBudgets {
  daily?: number;
  monthly?: number;
  byWindow?: Array<{ from: string; to: string; amount: number }>;
}

export interface PolicyTolerances {
  baselinePct?: number;
  anomalyThreshold?: number;
}

export interface Policy {
  readonly id: number;
  readonly sedeId: string;
  readonly sector?: string;
  readonly schedule?: PolicySchedule;
  readonly budgets?: PolicyBudgets;
  readonly tolerances?: PolicyTolerances;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
