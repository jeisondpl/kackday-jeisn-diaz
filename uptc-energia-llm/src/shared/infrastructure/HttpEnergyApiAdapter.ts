import {
  EnergyApiPort,
  SedeWithStats,
  ConsumoFilters,
  StatsFilters,
} from '../application/ports/EnergyApiPort.js';
import { SensorReading } from '../domain/SensorReading.js';
import { Sector } from '../domain/Sector.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

interface ApiConsumo {
  id: number;
  sede_id: string;
  timestamp: string;
  energia_total: number | null;
  energia_comedor: number | null;
  energia_salones: number | null;
  energia_laboratorios: number | null;
  energia_auditorios: number | null;
  energia_oficinas: number | null;
  potencia: number | null;
  agua: number | null;
  co2: number | null;
  temperatura_exterior: number | null;
  ocupacion: number | null;
  hora: number | null;
  dia_semana: number | null;
  mes: number | null;
  año: number | null;
  periodo_academico: string | null;
  es_fin_semana: boolean | null;
  es_festivo: boolean | null;
}

interface ApiSede {
  id?: string;
  nombre?: string;
  sede_id?: string;
  sede?: string;
  nombre_completo?: string;
  area_m2?: number;
  estudiantes?: number;
  empleados?: number;
  edificios?: number;
  stats?: {
    total_consumo: number;
    promedio_consumo: number;
    min_consumo: number;
    max_consumo: number;
    primera_lectura: string;
    ultima_lectura: string;
  };
}

export class HttpEnergyApiAdapter implements EnergyApiPort {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly logger: LoggerPort;

  constructor(baseUrl: string, timeout: number, logger: LoggerPort) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
    this.logger = logger;
  }

  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      const response = await this.fetch('/health');
      return response as { status: string; database: string };
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      throw error;
    }
  }

  async getSedes(withStats = false): Promise<SedeWithStats[]> {
    try {
      const url = withStats ? '/sedes?with_stats=true' : '/sedes';
      const response = await this.fetch(url);
      const list = this.normalizeList<ApiSede>(response);
      return list.map(this.mapSede);
    } catch (error) {
      this.logger.error('Failed to fetch sedes', error as Error);
      throw error;
    }
  }

  async getSede(sedeId: string): Promise<SedeWithStats | null> {
    try {
      const response = await this.fetch(`/sedes/${sedeId}`);
      const sede = this.normalizeItem<ApiSede>(response);
      return sede ? this.mapSede(sede) : null;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return null;
      }
      this.logger.error(`Failed to fetch sede ${sedeId}`, error as Error);
      throw error;
    }
  }

  async getConsumos(filters: ConsumoFilters): Promise<SensorReading[]> {
    try {
      const params = new URLSearchParams();

      if (filters.sedeId) params.append('sede_id', filters.sedeId);
      if (filters.from) params.append('from', filters.from.toISOString());
      if (filters.to) params.append('to', filters.to.toISOString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.order) params.append('order', filters.order);

      const url = `/consumos?${params.toString()}`;
      const response = await this.fetch(url);
      const list = this.normalizeList<ApiConsumo>(response);
      return list.map(this.mapConsumo);
    } catch (error) {
      this.logger.error('Failed to fetch consumos', error as Error);
      throw error;
    }
  }

  async getStatsDiario(filters: StatsFilters): Promise<any[]> {
    try {
      const params = this.buildStatsParams(filters);
      const url = `/stats/diario?${params.toString()}`;
      const response = await this.fetch(url);
      return this.normalizeList<any>(response);
    } catch (error) {
      this.logger.error('Failed to fetch stats diario', error as Error);
      throw error;
    }
  }

  async getStatsSector(filters: StatsFilters): Promise<any[]> {
    try {
      const params = this.buildStatsParams(filters);
      const url = `/stats/sector?${params.toString()}`;
      const response = await this.fetch(url);
      return this.normalizeList<any>(response);
    } catch (error) {
      this.logger.error('Failed to fetch stats sector', error as Error);
      throw error;
    }
  }

  async getStatsHorario(filters: StatsFilters): Promise<any[]> {
    try {
      const params = this.buildStatsParams(filters);
      const url = `/stats/horario?${params.toString()}`;
      const response = await this.fetch(url);
      return this.normalizeList<any>(response);
    } catch (error) {
      this.logger.error('Failed to fetch stats horario', error as Error);
      throw error;
    }
  }

  async getStatsSummary(sedeId?: string): Promise<any> {
    try {
      const url = sedeId ? `/stats/summary?sede_id=${sedeId}` : '/stats/summary';
      const response = await this.fetch(url);
      return this.normalizeItem<any>(response) ?? response;
    } catch (error) {
      this.logger.error('Failed to fetch stats summary', error as Error);
      throw error;
    }
  }

  private async fetch(path: string): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  private buildStatsParams(filters: StatsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.sedeId) params.append('sede_id', filters.sedeId);
    if (filters.from) params.append('from', filters.from.toISOString());
    if (filters.to) params.append('to', filters.to.toISOString());
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.esFinSemana !== undefined) params.append('es_fin_semana', filters.esFinSemana.toString());
    if (filters.año) params.append('año', filters.año.toString());

    return params;
  }

  private mapSede(apiSede: ApiSede): SedeWithStats {
    const id = apiSede.id ?? apiSede.sede_id ?? '';
    const nombre = apiSede.nombre ?? apiSede.sede ?? apiSede.nombre_completo ?? '';
    return {
      id,
      nombre,
      area: apiSede.area_m2,
      estudiantes: apiSede.estudiantes,
      empleados: apiSede.empleados,
      edificios: apiSede.edificios,
      stats: apiSede.stats
        ? {
            totalConsumo: apiSede.stats.total_consumo,
            promedioConsumo: apiSede.stats.promedio_consumo,
            minConsumo: apiSede.stats.min_consumo,
            maxConsumo: apiSede.stats.max_consumo,
            primeraLectura: new Date(apiSede.stats.primera_lectura),
            ultimaLectura: new Date(apiSede.stats.ultima_lectura),
          }
        : undefined,
    };
  }

  private mapConsumo(apiConsumo: ApiConsumo): SensorReading {
    // Map sector based on dominant energy source
    let sector: Sector | undefined;
    const sectorValues = {
      comedor: apiConsumo.energia_comedor || 0,
      salones: apiConsumo.energia_salones || 0,
      laboratorios: apiConsumo.energia_laboratorios || 0,
      auditorios: apiConsumo.energia_auditorios || 0,
      oficinas: apiConsumo.energia_oficinas || 0,
    };

    const maxSector = Object.entries(sectorValues).reduce((max, [key, value]) =>
      value > max.value ? { key, value } : max,
      { key: '', value: 0 }
    );

    if (maxSector.value > 0) {
      sector = maxSector.key as Sector;
    }

    return {
      timestamp: new Date(apiConsumo.timestamp),
      sedeId: apiConsumo.sede_id,
      sector,
      metrics: {
        energiaTotal: apiConsumo.energia_total ?? undefined,
        energiaComedor: apiConsumo.energia_comedor ?? undefined,
        energiaSalones: apiConsumo.energia_salones ?? undefined,
        energiaLaboratorios: apiConsumo.energia_laboratorios ?? undefined,
        energiaAuditorios: apiConsumo.energia_auditorios ?? undefined,
        energiaOficinas: apiConsumo.energia_oficinas ?? undefined,
        potencia: apiConsumo.potencia ?? undefined,
        agua: apiConsumo.agua ?? undefined,
        co2: apiConsumo.co2 ?? undefined,
        temperaturaExterior: apiConsumo.temperatura_exterior ?? undefined,
        ocupacion: apiConsumo.ocupacion ?? undefined,
      },
      temporalDimensions: {
        hora: apiConsumo.hora ?? undefined,
        diaSemana: apiConsumo.dia_semana ?? undefined,
        mes: apiConsumo.mes ?? undefined,
        año: apiConsumo.año ?? undefined,
        periodoAcademico: apiConsumo.periodo_academico ?? undefined,
        esFinSemana: apiConsumo.es_fin_semana ?? undefined,
        esFestivo: apiConsumo.es_festivo ?? undefined,
      },
    };
  }

  private normalizeList<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (response && Array.isArray(response.data)) {
      return response.data as T[];
    }

    return [];
  }

  private normalizeItem<T>(response: any): T | null {
    if (!response) return null;
    if (Array.isArray(response)) return (response[0] as T) || null;
    if (response.data && !Array.isArray(response.data)) return response.data as T;
    return response as T;
  }
}
