import { useEffect, useCallback } from 'react';
import { useConsultaStore } from '../../application/store/consultaStore.ts';

export function useConsultaInit() {
  const fetchAllData = useConsultaStore((state) => state.fetchAllData);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
}

export function useFilters() {
  const filters = useConsultaStore((state) => state.filters);
  const setFilters = useConsultaStore((state) => state.setFilters);
  const resetFilters = useConsultaStore((state) => state.resetFilters);
  const fetchAllData = useConsultaStore((state) => state.fetchAllData);

  const applyFilters = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    filters,
    setFilters,
    resetFilters,
    applyFilters,
  };
}

export function useSedes() {
  const sedes = useConsultaStore((state) => state.sedes);
  const status = useConsultaStore((state) => state.sedesStatus);
  const error = useConsultaStore((state) => state.sedesError);

  return {
    sedes,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
  };
}

export function useSummary() {
  const summary = useConsultaStore((state) => state.summary);
  const status = useConsultaStore((state) => state.summaryStatus);
  const error = useConsultaStore((state) => state.summaryError);
  const fetchSummary = useConsultaStore((state) => state.fetchSummary);

  return {
    summary,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    refetch: fetchSummary,
  };
}

export function useConsumoDiario() {
  const data = useConsultaStore((state) => state.consumoDiario);
  const total = useConsultaStore((state) => state.consumoDiarioTotal);
  const status = useConsultaStore((state) => state.consumoDiarioStatus);
  const error = useConsultaStore((state) => state.consumoDiarioError);
  const fetch = useConsultaStore((state) => state.fetchConsumoDiario);

  return {
    data,
    total,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    refetch: fetch,
  };
}

export function useConsumoSector() {
  const data = useConsultaStore((state) => state.consumoSector);
  const status = useConsultaStore((state) => state.consumoSectorStatus);
  const error = useConsultaStore((state) => state.consumoSectorError);
  const fetch = useConsultaStore((state) => state.fetchConsumoSector);

  return {
    data,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    refetch: fetch,
  };
}

export function usePatronHorario() {
  const data = useConsultaStore((state) => state.patronHorario);
  const status = useConsultaStore((state) => state.patronHorarioStatus);
  const error = useConsultaStore((state) => state.patronHorarioError);
  const fetch = useConsultaStore((state) => state.fetchPatronHorario);

  return {
    data,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    refetch: fetch,
  };
}

export function useConsumoPeriodo() {
  const data = useConsultaStore((state) => state.consumoPeriodo);
  const status = useConsultaStore((state) => state.consumoPeriodoStatus);
  const error = useConsultaStore((state) => state.consumoPeriodoError);
  const fetch = useConsultaStore((state) => state.fetchConsumoPeriodo);

  return {
    data,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    refetch: fetch,
  };
}
