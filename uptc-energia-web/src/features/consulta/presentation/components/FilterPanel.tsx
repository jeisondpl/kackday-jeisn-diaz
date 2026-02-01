import { Select, DateInput } from '@shared/components/ui/index.ts';
import { useFilters, useSedes } from '../hooks/useConsulta.ts';

export function FilterPanel() {
  const { filters, setFilters, resetFilters, applyFilters } = useFilters();
  const { sedes } = useSedes();

  const sedeOptions = sedes.map((s) => ({
    value: s.sede_id,
    label: s.sede,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Sede"
          value={filters.sede_id}
          onChange={(value) => setFilters({ sede_id: value })}
          options={sedeOptions}
          placeholder="Todas las sedes"
          className="w-full sm:w-48"
        />
        <DateInput
          label="Desde"
          value={filters.from}
          onChange={(value) => setFilters({ from: value })}
          className="w-full sm:w-40"
        />
        <DateInput
          label="Hasta"
          value={filters.to}
          onChange={(value) => setFilters({ to: value })}
          className="w-full sm:w-40"
        />
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={() => {
              resetFilters();
              setTimeout(applyFilters, 0);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
