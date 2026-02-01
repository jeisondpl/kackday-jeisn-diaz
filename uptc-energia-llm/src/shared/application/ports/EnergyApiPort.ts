import { SedeRef } from '../../domain/SedeRef.js';
import { SensorReading } from '../../domain/SensorReading.js';

export interface SedeStats {
  totalConsumo: number;
  promedioConsumo: number;
  minConsumo: number;
  maxConsumo: number;
  primeraLectura: Date;
  ultimaLectura: Date;
}

export interface SedeWithStats extends SedeRef {
  area?: number;
  estudiantes?: number;
  empleados?: number;
  edificios?: number;
  stats?: SedeStats;
}

export interface ConsumoFilters {
  sedeId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export interface StatsFilters {
  sedeId?: string;
  from?: Date;
  to?: Date;
  sector?: string;
  esFinSemana?: boolean;
  año?: number;
}

export interface EnergyApiPort {
  healthCheck(): Promise<{ status: string; database: string }>;
  getSedes(withStats?: boolean): Promise<SedeWithStats[]>;
  getSede(sedeId: string): Promise<SedeWithStats | null>;
  getConsumos(filters: ConsumoFilters): Promise<SensorReading[]>;
  getStatsDiario(filters: StatsFilters): Promise<any[]>;
  getStatsSector(filters: StatsFilters): Promise<any[]>;
  getStatsHorario(filters: StatsFilters): Promise<any[]>;
  getStatsSummary(sedeId?: string): Promise<any>;
}
