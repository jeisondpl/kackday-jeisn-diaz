import { Alert, AlertStatus } from '../../domain/Alert.js';
import { Evidence } from '../../domain/Evidence.js';

export interface CreateAlertDTO {
  fingerprint: string;
  ruleId?: number;
  sedeId: string;
  sector?: string;
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  windowStart: Date;
  windowEnd: Date;
}

export interface AlertFilters {
  status?: AlertStatus;
  severity?: string;
  sedeId?: string;
  sector?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface AlertsRepositoryPort {
  findById(id: number): Promise<Alert | null>;
  findAll(filters: AlertFilters): Promise<Alert[]>;
  findByFingerprint(fingerprint: string): Promise<Alert | null>;
  create(data: CreateAlertDTO): Promise<Alert>;
  acknowledge(id: number, acknowledgedBy: string): Promise<Alert>;
  addEvidence(alertId: number, evidence: Omit<Evidence, 'id' | 'alertId' | 'createdAt'>): Promise<Evidence>;
  getEvidence(alertId: number): Promise<Evidence[]>;
}
