import { Severity } from './Rule.js';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface Alert {
  readonly id: number;
  readonly fingerprint: string; // unique dedup key
  readonly ruleId?: number;
  readonly sedeId: string;
  readonly sector?: string;
  readonly metric: string;
  readonly severity: Severity;
  readonly status: AlertStatus;
  readonly message: string;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly acknowledgedAt?: Date;
  readonly acknowledgedBy?: string;
  readonly createdAt: Date;
}

export const createAlert = (
  data: Omit<Alert, 'createdAt'> & { createdAt?: Date }
): Alert => {
  return Object.freeze({
    ...data,
    createdAt: data.createdAt || new Date(),
  });
};

export const generateFingerprint = (
  ruleId: number | undefined,
  sedeId: string,
  sector: string | undefined,
  windowStart: Date,
  windowEnd: Date
): string => {
  const parts = [
    ruleId || 'manual',
    sedeId,
    sector || 'all',
    windowStart.toISOString(),
    windowEnd.toISOString(),
  ];
  return parts.join('::');
};
