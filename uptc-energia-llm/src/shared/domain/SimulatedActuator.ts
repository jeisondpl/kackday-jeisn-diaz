export type ActuatorType =
  | 'hvac'
  | 'lighting'
  | 'refrigeration'
  | 'lab_equipment'
  | 'other';

export interface SimulatedActuator {
  readonly id: number;
  readonly sedeId: string;
  readonly sector?: string;
  readonly actuatorType: ActuatorType;
  readonly state: Record<string, unknown>;
  readonly lastAction?: Record<string, unknown>;
  readonly updatedAt: Date;
}
