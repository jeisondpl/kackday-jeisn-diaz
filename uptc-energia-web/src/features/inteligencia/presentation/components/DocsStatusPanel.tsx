import { useState } from 'react';
import { Card } from '@shared/components/ui/Card.tsx';
import type { KnowledgeDoc } from '../../domain/entities/KnowledgeDoc.ts';

const SECTORS = [
  { value: '', label: 'Todos los sectores' },
  { value: 'comedores', label: 'Comedores' },
  { value: 'salones', label: 'Salones' },
  { value: 'laboratorios', label: 'Laboratorios' },
  { value: 'auditorios', label: 'Auditorios' },
  { value: 'oficinas', label: 'Oficinas' },
];

const ALL_TAGS = [
  'hvac',
  'refrigeracion',
  'cocina',
  'consumo_nocturno',
  'standby',
  'iluminacion',
  'ocupacion',
  'climatizacion',
  'aire',
  'equipos',
  'ventilacion',
  'consumo_pico',
  'sonido',
  'eventos',
  'computo',
  'aislamiento',
];

interface DocsStatusPanelProps {
  docs: KnowledgeDoc[];
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: { sector?: string; tags?: string }) => void;
  onPage?: (page: number) => void;
  page?: number;
}

export function DocsStatusPanel({
  docs,
  onRefresh,
  onSearch,
  onFilter,
  onPage,
  page = 1,
}: DocsStatusPanelProps) {
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const indexed = docs.filter((doc) => doc.indexed).length;
  const pending = docs.length - indexed;

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    onFilter?.({ sector: sector || undefined, tags: selectedTag || undefined });
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    onFilter?.({ sector: selectedSector || undefined, tags: tag || undefined });
  };

  return (
    <Card title="Estado de documentos" subtitle="RAG y base de conocimiento">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar documentos..."
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <select
            value={selectedSector}
            onChange={(e) => handleSectorChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {SECTORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={selectedTag}
            onChange={(e) => handleTagChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">Todos los tags</option>
            {ALL_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Refrescar
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Total: {docs.length} · Indexados: {indexed} · Pendientes: {pending}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-700">
          <p className="text-xs uppercase">Indexados</p>
          <p className="text-2xl font-semibold">{indexed}</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-50 text-amber-700">
          <p className="text-xs uppercase">Pendientes</p>
          <p className="text-2xl font-semibold">{pending}</p>
        </div>
        <div className="p-4 rounded-lg bg-slate-100 text-slate-700">
          <p className="text-xs uppercase">Total</p>
          <p className="text-2xl font-semibold">{docs.length}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {docs.slice(0, 6).map((doc) => (
          <div key={doc.id} className="flex items-center justify-between text-sm text-gray-700">
            <span>{doc.title}</span>
            <span className={doc.indexed ? 'text-emerald-600' : 'text-amber-600'}>
              {doc.indexed ? `Indexado (${doc.chunksCount ?? 0})` : 'Pendiente'}
            </span>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="text-sm text-gray-500">No hay documentos registrados.</p>
        )}
      </div>
      {onPage && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => onPage(Math.max(1, page - 1))}
            className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Anterior
          </button>
          <span className="text-xs text-gray-500">Página {page}</span>
          <button
            onClick={() => onPage(page + 1)}
            className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Siguiente
          </button>
        </div>
      )}
    </Card>
  );
}
