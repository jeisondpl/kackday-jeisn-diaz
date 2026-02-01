import { create } from 'zustand';
import type { LoadingState } from '@core/shared/types/api.types.ts';
import { handleApiError } from '@core/shared/utils/errorHandler.ts';
import type { SedeConStats } from '../../domain/entities/Sede.ts';
import type {
  ConsumoDiario,
  ConsumoSector,
  PatronHorario,
  ConsumoPeriodo,
  ResumenGeneral,
} from '../../domain/entities/Consumo.ts';
import type { ConsumosFilters, StatsFilters } from '../../domain/interfaces/IConsultaRepository.ts';
import { consultaRepository } from '../../infrastructure/HttpConsultaRepository.ts';

interface Filters {
  sede_id: string;
  from: string;
  to: string;
}

interface ConsultaState {
  // Filters
  filters: Filters;

  // Sedes
  sedes: SedeConStats[];
  sedesStatus: LoadingState;
  sedesError: string | null;

  // Summary
  summary: ResumenGeneral | null;
  summaryStatus: LoadingState;
  summaryError: string | null;

  // Consumo Diario
  consumoDiario: ConsumoDiario[];
  consumoDiarioTotal: number;
  consumoDiarioStatus: LoadingState;
  consumoDiarioError: string | null;

  // Consumo Sector
  consumoSector: ConsumoSector[];
  consumoSectorStatus: LoadingState;
  consumoSectorError: string | null;

  // Patron Horario
  patronHorario: PatronHorario[];
  patronHorarioStatus: LoadingState;
  patronHorarioError: string | null;

  // Consumo Periodo
  consumoPeriodo: ConsumoPeriodo[];
  consumoPeriodoStatus: LoadingState;
  consumoPeriodoError: string | null;

  // Actions
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  fetchSedes: () => Promise<void>;
  fetchSummary: (sedeId?: string) => Promise<void>;
  fetchConsumoDiario: (filters?: StatsFilters) => Promise<void>;
  fetchConsumoSector: (filters?: StatsFilters) => Promise<void>;
  fetchPatronHorario: (filters?: StatsFilters) => Promise<void>;
  fetchConsumoPeriodo: (filters?: StatsFilters) => Promise<void>;
  fetchAllData: () => Promise<void>;
}

const initialFilters: Filters = {
  sede_id: '',
  from: '',
  to: '',
};

export const useConsultaStore = create<ConsultaState>((set, get) => ({
  // Initial state
  filters: initialFilters,

  sedes: [],
  sedesStatus: 'idle',
  sedesError: null,

  summary: null,
  summaryStatus: 'idle',
  summaryError: null,

  consumoDiario: [],
  consumoDiarioTotal: 0,
  consumoDiarioStatus: 'idle',
  consumoDiarioError: null,

  consumoSector: [],
  consumoSectorStatus: 'idle',
  consumoSectorError: null,

  patronHorario: [],
  patronHorarioStatus: 'idle',
  patronHorarioError: null,

  consumoPeriodo: [],
  consumoPeriodoStatus: 'idle',
  consumoPeriodoError: null,

  // Actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters });
  },

  fetchSedes: async () => {
    set({ sedesStatus: 'loading', sedesError: null });
    try {
      const response = await consultaRepository.getSedesConStats();
      set({ sedes: response.data, sedesStatus: 'success' });
    } catch (error) {
      const message = handleApiError(error);
      set({ sedesStatus: 'error', sedesError: message });
    }
  },

  fetchSummary: async (sedeId?: string) => {
    set({ summaryStatus: 'loading', summaryError: null });
    try {
      const summary = await consultaRepository.getSummary(sedeId);
      set({ summary, summaryStatus: 'success' });
    } catch (error) {
      const message = handleApiError(error);
      set({ summaryStatus: 'error', summaryError: message });
    }
  },

  fetchConsumoDiario: async (filters?: StatsFilters) => {
    set({ consumoDiarioStatus: 'loading', consumoDiarioError: null });
    try {
      const currentFilters = get().filters;
      const mergedFilters: ConsumosFilters = {
        ...filters,
        sede_id: filters?.sede_id || currentFilters.sede_id || undefined,
        from: filters?.from || currentFilters.from || undefined,
        to: filters?.to || currentFilters.to || undefined,
        limit: filters?.limit || 100,
      };

      const response = await consultaRepository.getStatsDiario(mergedFilters);
      set({
        consumoDiario: response.data,
        consumoDiarioTotal: response.total || response.count,
        consumoDiarioStatus: 'success',
      });
    } catch (error) {
      const message = handleApiError(error);
      set({ consumoDiarioStatus: 'error', consumoDiarioError: message });
    }
  },

  fetchConsumoSector: async (filters?: StatsFilters) => {
    set({ consumoSectorStatus: 'loading', consumoSectorError: null });
    try {
      const currentFilters = get().filters;
      const mergedFilters: ConsumosFilters = {
        ...filters,
        sede_id: filters?.sede_id || currentFilters.sede_id || undefined,
        from: filters?.from || currentFilters.from || undefined,
        to: filters?.to || currentFilters.to || undefined,
        limit: filters?.limit || 100,
      };

      const response = await consultaRepository.getStatsSector(mergedFilters);
      set({ consumoSector: response.data, consumoSectorStatus: 'success' });
    } catch (error) {
      const message = handleApiError(error);
      set({ consumoSectorStatus: 'error', consumoSectorError: message });
    }
  },

  fetchPatronHorario: async (filters?: StatsFilters) => {
    set({ patronHorarioStatus: 'loading', patronHorarioError: null });
    try {
      const currentFilters = get().filters;
      const mergedFilters: StatsFilters = {
        ...filters,
        sede_id: filters?.sede_id || currentFilters.sede_id || undefined,
      };

      const response = await consultaRepository.getStatsHorario(mergedFilters);
      set({ patronHorario: response.data, patronHorarioStatus: 'success' });
    } catch (error) {
      const message = handleApiError(error);
      set({ patronHorarioStatus: 'error', patronHorarioError: message });
    }
  },

  fetchConsumoPeriodo: async (filters?: StatsFilters) => {
    set({ consumoPeriodoStatus: 'loading', consumoPeriodoError: null });
    try {
      const currentFilters = get().filters;
      const mergedFilters: StatsFilters = {
        ...filters,
        sede_id: filters?.sede_id || currentFilters.sede_id || undefined,
      };

      const response = await consultaRepository.getStatsPeriodo(mergedFilters);
      set({ consumoPeriodo: response.data, consumoPeriodoStatus: 'success' });
    } catch (error) {
      const message = handleApiError(error);
      set({ consumoPeriodoStatus: 'error', consumoPeriodoError: message });
    }
  },

  fetchAllData: async () => {
    const { fetchSedes, fetchSummary, fetchConsumoDiario, fetchConsumoSector, fetchPatronHorario, fetchConsumoPeriodo } = get();
    const { filters } = get();

    await Promise.all([
      fetchSedes(),
      fetchSummary(filters.sede_id || undefined),
      fetchConsumoDiario(),
      fetchConsumoSector(),
      fetchPatronHorario(),
      fetchConsumoPeriodo(),
    ]);
  },
}));

// Selectors
export const selectSedes = (state: ConsultaState) => state.sedes;
export const selectSedesLoading = (state: ConsultaState) => state.sedesStatus === 'loading';
export const selectSummary = (state: ConsultaState) => state.summary;
export const selectConsumoDiario = (state: ConsultaState) => state.consumoDiario;
export const selectConsumoSector = (state: ConsultaState) => state.consumoSector;
export const selectPatronHorario = (state: ConsultaState) => state.patronHorario;
export const selectConsumoPeriodo = (state: ConsultaState) => state.consumoPeriodo;
export const selectFilters = (state: ConsultaState) => state.filters;
