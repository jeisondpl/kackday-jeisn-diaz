import { axiosConsultaClient } from '@core/infrastructure/http/axiosClient.ts';
import { API_ENDPOINTS } from '@config/api.config.ts';
import { ApiValidationError } from '@core/shared/utils/errorHandler.ts';
import type { ApiResponse } from '@core/shared/types/api.types.ts';
import type { Sede, SedeConStats } from '../domain/entities/Sede.ts';
import type {
  Consumo,
  ConsumoDiario,
  ConsumoSector,
  PatronHorario,
  ConsumoPeriodo,
  ResumenGeneral,
} from '../domain/entities/Consumo.ts';
import type {
  IConsultaRepository,
  ConsumosFilters,
  StatsFilters,
} from '../domain/interfaces/IConsultaRepository.ts';
import {
  SedeSchema,
  SedeConStatsSchema,
  ConsumoSchema,
  ConsumoDiarioSchema,
  ConsumoSectorSchema,
  PatronHorarioSchema,
  ConsumoPeriodoSchema,
  ResumenGeneralSchema,
  createApiResponseSchema,
  createSimpleResponseSchema,
} from '../application/dto/schemas.ts';

export class HttpConsultaRepository implements IConsultaRepository {
  async getSedes(): Promise<ApiResponse<Sede[]>> {
    const response = await axiosConsultaClient.get(API_ENDPOINTS.SEDES);
    const schema = createApiResponseSchema(SedeSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de sedes fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getSedesConStats(): Promise<ApiResponse<SedeConStats[]>> {
    const response = await axiosConsultaClient.get(API_ENDPOINTS.SEDES, {
      params: { with_stats: 'true' },
    });
    const schema = createApiResponseSchema(SedeConStatsSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de sedes con stats fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getSedeById(sedeId: string): Promise<SedeConStats> {
    const response = await axiosConsultaClient.get(`${API_ENDPOINTS.SEDES}/${sedeId}`);
    const result = SedeConStatsSchema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de sede fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getConsumos(filters?: ConsumosFilters): Promise<ApiResponse<Consumo[]>> {
    const response = await axiosConsultaClient.get(API_ENDPOINTS.CONSUMOS, { params: filters });
    const schema = createApiResponseSchema(ConsumoSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de consumos fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getConsumoById(readingId: number): Promise<Consumo> {
    const response = await axiosConsultaClient.get(`${API_ENDPOINTS.CONSUMOS}/${readingId}`);
    const result = ConsumoSchema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de consumo fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getStatsDiario(filters?: StatsFilters): Promise<ApiResponse<ConsumoDiario[]>> {
    const response = await axiosConsultaClient.get(API_ENDPOINTS.STATS.DIARIO, { params: filters });
    const schema = createApiResponseSchema(ConsumoDiarioSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de stats diario fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getStatsSector(filters?: StatsFilters): Promise<ApiResponse<ConsumoSector[]>> {
    const response = await axiosConsultaClient.get(API_ENDPOINTS.STATS.SECTOR, { params: filters });
    const schema = createApiResponseSchema(ConsumoSectorSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de stats sector fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getStatsHorario(filters?: StatsFilters): Promise<{ count: number; data: PatronHorario[] }> {
    const response = await axiosConsultaClient.get(API_ENDPOINTS.STATS.HORARIO, { params: filters });
    const schema = createSimpleResponseSchema(PatronHorarioSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de stats horario fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getStatsPeriodo(filters?: StatsFilters): Promise<{ count: number; data: ConsumoPeriodo[] }> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.sede_id) params.sede_id = filters.sede_id;
    if (filters?.año) params['año'] = filters.año;

    const response = await axiosConsultaClient.get(API_ENDPOINTS.STATS.PERIODO, { params });
    const schema = createSimpleResponseSchema(ConsumoPeriodoSchema);
    const result = schema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de stats periodo fallida: ${result.error.message}`);
    }

    return result.data;
  }

  async getSummary(sedeId?: string): Promise<ResumenGeneral> {
    const params = sedeId ? { sede_id: sedeId } : {};
    const response = await axiosConsultaClient.get(API_ENDPOINTS.STATS.SUMMARY, { params });
    const result = ResumenGeneralSchema.safeParse(response.data);

    if (!result.success) {
      throw new ApiValidationError(`Validación de resumen fallida: ${result.error.message}`);
    }

    return result.data;
  }
}

// Singleton instance
export const consultaRepository = new HttpConsultaRepository();
