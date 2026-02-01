import { Card } from '@shared/components/ui/Card.tsx';
import type { AlertExplanation } from '../../domain/entities/Alert.ts';

interface ExplanationPanelProps {
  explanation: AlertExplanation | null;
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  if (!explanation) return null;

  return (
    <Card title="Explicación de alerta" subtitle={explanation.rule?.name || 'Sin regla asociada'}>
      <div className="space-y-3">
        <p className="text-sm text-gray-700">{explanation.explanation.summary}</p>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {explanation.explanation.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
