import { Sector } from './Sector.js';

/**
 * Lectura de sensores (datos reales desde Energy API)
 */
export interface SensorReading {
  readonly timestamp: Date;
  readonly sedeId: string;
  readonly sector?: Sector;
  readonly metrics: {
    energiaTotal?: number; // kWh
    energiaComedor?: number;
    energiaSalones?: number;
    energiaLaboratorios?: number;
    energiaAuditorios?: number;
    energiaOficinas?: number;
    potencia?: number; // kW
    agua?: number;
    co2?: number;
    temperaturaExterior?: number;
    ocupacion?: number;
  };
  readonly temporalDimensions?: {
    hora?: number;
    diaSemana?: number;
    mes?: number;
    año?: number;
    periodoAcademico?: string;
    esFinSemana?: boolean;
    esFestivo?: boolean;
  };
}

export const createSensorReading = (data: SensorReading): SensorReading => {
  return Object.freeze(data);
};
