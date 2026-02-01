import { useState } from 'react';
import { Card } from '@shared/components/ui/Card.tsx';

interface DocsFormProps {
  onCreate: (payload: {
    title: string;
    content?: string;
    file_path?: string;
    sector?: string;
    tags?: string[];
    index?: boolean;
  }) => void;
}

export function DocsForm({ onCreate }: DocsFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sector, setSector] = useState('');
  const [tags, setTags] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sectorTagSuggestions: Record<string, string[]> = {
    comedores: ['hvac', 'refrigeracion', 'cocina', 'consumo_nocturno', 'standby'],
    salones: ['iluminacion', 'ocupacion', 'climatizacion', 'aire'],
    laboratorios: ['laboratorios', 'equipos', 'ventilacion', 'consumo_pico'],
    auditorios: ['iluminacion', 'ocupacion', 'sonido', 'eventos'],
    oficinas: ['iluminacion', 'computo', 'standby', 'climatizacion'],
  };

  const baseSuggestions = ['hvac', 'iluminacion', 'refrigeracion', 'ocupacion', 'aislamiento'];
  const tagSuggestions = sector
    ? sectorTagSuggestions[sector] || baseSuggestions
    : baseSuggestions;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        const next = prev.filter((t) => t !== tag);
        setTags(next.join(', '));
        return next;
      }
      const next = [...prev, tag];
      setTags(next.join(', '));
      return next;
    });
  };

  const mergedTags = Array.from(
    new Set([
      ...selectedTags,
      ...tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ])
  );

  return (
    <Card title="Base de conocimiento" subtitle="Carga documentos para recomendaciones">
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            placeholder="Guía eficiencia energética"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Sector</label>
          <select
            value={sector}
            onChange={(e) => {
              setSector(e.target.value);
              setSelectedTags([]);
              setTags('');
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
          >
            <option value="">Selecciona sector</option>
            <option value="comedores">Comedores</option>
            <option value="salones">Salones</option>
            <option value="laboratorios">Laboratorios</option>
            <option value="auditorios">Auditorios</option>
            <option value="oficinas">Oficinas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tags (coma)</label>
          <input
            value={tags}
            onChange={(e) => {
              const value = e.target.value;
              setTags(value);
              const parsed = value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              setSelectedTags(parsed);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            placeholder="Ej: hvac, iluminacion, refrigeracion"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {tagSuggestions.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Contenido</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[120px]"
            placeholder="Texto del documento..."
          />
        </div>
        <button
          onClick={() => {
            onCreate({
              title,
              content,
              sector: sector || undefined,
              tags: mergedTags.length > 0 ? mergedTags : undefined,
              index: true,
            });
            setTitle('');
            setContent('');
            setSector('');
            setTags('');
            setSelectedTags([]);
          }}
          disabled={!title.trim()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Subir documento
        </button>
      </div>
    </Card>
  );
}
