import { useState } from 'react';
import { Card } from '@shared/components/ui/Card.tsx';

interface FiltersPanelProps {
  sedeId: string;
  sedes?: Array<{ id: string; nombre: string }>;
  sector: string;
  metric: string;
  hours: number;
  lookbackDays: number;
  threshold: number;
  onChange: (next: {
    sede_id?: string;
    metric?: string;
    hours?: number;
    lookback_days?: number;
    threshold?: number;
  }) => void;
  onRefresh: () => void;
  onRecalculate: () => void;
}

const metrics = [
  { value: 'energiaTotal', label: 'Energía total' },
  { value: 'energiaComedor', label: 'Energía comedores' },
  { value: 'energiaLaboratorios', label: 'Energía laboratorios' },
  { value: 'agua', label: 'Agua' },
  { value: 'co2', label: 'CO2' },
  { value: 'temperaturaExterior', label: 'Temperatura exterior' },
  { value: 'ocupacion', label: 'Ocupación' },
];

export function FiltersPanel({
  sedeId,
  sedes = [],
  sector,
  metric,
  hours,
  lookbackDays,
  threshold,
  onChange,
  onRefresh,
  onRecalculate,
}: FiltersPanelProps) {
  const [localSede, setLocalSede] = useState(sedeId);
  const [localSector, setLocalSector] = useState(sector);

  return (
    <Card title="Filtros de análisis" subtitle="Configura sede, métrica y ventanas de tiempo">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Sede</label>
          <select
            value={localSede}
            onChange={(e) => {
              const value = e.target.value;
              setLocalSede(value);
              onChange({ sede_id: value || undefined });
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Métrica</label>
          <select
            value={metric}
            onChange={(e) => onChange({ metric: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {metrics.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Sector</label>
          <select
            value={localSector}
            onChange={(e) => {
              const value = e.target.value;
              setLocalSector(value);
              onChange({ sector: value || undefined });
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Todos los sectores</option>
            <option value="comedores">Comedores</option>
            <option value="salones">Salones</option>
            <option value="laboratorios">Laboratorios</option>
            <option value="auditorios">Auditorios</option>
            <option value="oficinas">Oficinas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Horas</label>
          <input
            type="number"
            min={1}
            value={hours}
            onChange={(e) => onChange({ hours: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Lookback (días)</label>
          <input
            type="number"
            min={1}
            value={lookbackDays}
            onChange={(e) => onChange({ lookback_days: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Z-Score</label>
          <input
            type="number"
            step="0.1"
            min={1}
            value={threshold}
            onChange={(e) => onChange({ threshold: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-5">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Actualizar
        </button>
        <button
          onClick={onRecalculate}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
        >
          Recalibrar baseline
        </button>
      </div>
    </Card>
  );
}
