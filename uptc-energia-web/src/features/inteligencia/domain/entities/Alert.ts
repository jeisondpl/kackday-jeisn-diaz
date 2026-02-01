export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface LlmAlert {
  id: number;
  fingerprint: string;
  ruleId?: number | null;
  sedeId: string;
  sector?: string;
  metric: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  windowStart?: string;
  windowEnd?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertEvidence {
  id?: number;
  alertId?: number;
  values?: Record<string, unknown>;
  baseline?: Record<string, unknown>;
  delta?: Record<string, unknown>;
  anomalyScore?: number;
  forecast?: Record<string, unknown>;
  createdAt?: string;
}

export interface AlertExplanation {
  alert: LlmAlert;
  rule?: {
    id: number;
    name: string;
    description?: string;
    type: string;
  };
  evidence: AlertEvidence[];
  explanation: {
    summary: string;
    details: string[];
    metrics: Record<string, unknown>;
  };
}
