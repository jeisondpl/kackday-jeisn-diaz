/**
 * Evidencia numérica que respalda una alerta
 * Usa objetos JSON flexibles para valores, baseline, delta y forecast
 */
export interface Evidence {
  readonly id: number;
  readonly alertId: number;
  readonly values: Record<string, any>; // e.g., { current: 150, hour: 14 }
  readonly baseline: Record<string, any>; // e.g., { value: 100, method: 'average' }
  readonly delta: Record<string, any>; // e.g., { absolute: 50, percentage: 50 }
  readonly anomalyScore?: number;
  readonly forecast?: Record<string, any>; // e.g., { predicted: 120, confidence: 0.85 }
  readonly createdAt: Date;
}

export const createEvidence = (
  data: Omit<Evidence, 'createdAt'> & { createdAt?: Date }
): Evidence => {
  return Object.freeze({
    ...data,
    createdAt: data.createdAt || new Date(),
  });
};
