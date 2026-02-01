import { Card } from '@shared/components/ui/Card.tsx';
import type { Recommendation } from '../../domain/entities/Recommendation.ts';

interface RecommendationPanelProps {
  recommendation: Recommendation | null;
}

export function RecommendationPanel({ recommendation }: RecommendationPanelProps) {
  if (!recommendation) return null;

  return (
    <Card title="Recomendación IA" subtitle="Acciones sugeridas">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{recommendation.summary}</p>
        <div>
          <p className="text-xs uppercase text-gray-500">Acciones</p>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
            {recommendation.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
        {recommendation.expectedSavings && (
          <p className="text-sm text-emerald-700">
            Ahorro estimado: {recommendation.expectedSavings.value}
          </p>
        )}
        <div>
          <p className="text-xs uppercase text-gray-500">Fuentes</p>
          <ul className="text-sm text-gray-700 mt-2 space-y-1">
            {recommendation.sources.map((source) => (
              <li key={`${source.docId}-${source.title}`}>
                {source.title} (Doc {source.docId})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
