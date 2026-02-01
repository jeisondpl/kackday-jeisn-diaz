import type { ApiResponse } from '@core/shared/types/api.types.ts';
import type { Sede, SedeConStats } from '../entities/Sede.ts';
import type {
  Consumo,
  ConsumoDiario,
  ConsumoSector,
  PatronHorario,
  ConsumoPeriodo,
  ResumenGeneral,
} from '../entities/Consumo.ts';

export interface ConsumosFilters {
  sede_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export interface StatsFilters {
  sede_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  año?: number;
  es_fin_semana?: boolean;
}

export interface IConsultaRepository {
  // Sedes
  getSedes(): Promise<ApiResponse<Sede[]>>;
  getSedesConStats(): Promise<ApiResponse<SedeConStats[]>>;
  getSedeById(sedeId: string): Promise<SedeConStats>;

  // Consumos
  getConsumos(filters?: ConsumosFilters): Promise<ApiResponse<Consumo[]>>;
  getConsumoById(readingId: number): Promise<Consumo>;

  // Stats
  getStatsDiario(filters?: StatsFilters): Promise<ApiResponse<ConsumoDiario[]>>;
  getStatsSector(filters?: StatsFilters): Promise<ApiResponse<ConsumoSector[]>>;
  getStatsHorario(filters?: StatsFilters): Promise<{ count: number; data: PatronHorario[] }>;
  getStatsPeriodo(filters?: StatsFilters): Promise<{ count: number; data: ConsumoPeriodo[] }>;
  getSummary(sedeId?: string): Promise<ResumenGeneral>;
}
