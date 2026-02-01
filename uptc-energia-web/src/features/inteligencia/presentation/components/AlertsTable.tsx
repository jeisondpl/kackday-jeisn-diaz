import { Card } from '@shared/components/ui/Card.tsx';
import type { LlmAlert } from '../../domain/entities/Alert.ts';

interface AlertsTableProps {
  alerts: LlmAlert[];
  onExplain: (alertId: number) => void;
  onRecommend: (alertId: number) => void;
}

export function AlertsTable({ alerts, onExplain, onRecommend }: AlertsTableProps) {
  return (
    <Card title="Alertas recientes" subtitle="Motor LLM">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase border-b">
            <tr>
              <th className="py-2">Sede</th>
              <th className="py-2">Sector</th>
              <th className="py-2">Severidad</th>
              <th className="py-2">Mensaje</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id} className="border-b last:border-0">
                <td className="py-2 text-gray-700">{alert.sedeId}</td>
                <td className="py-2 text-gray-700">{alert.sector || '-'}</td>
                <td className="py-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {alert.severity}
                  </span>
                </td>
                <td className="py-2 text-gray-600">{alert.message}</td>
                <td className="py-2 space-x-2">
                  <button
                    onClick={() => onExplain(alert.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Explicar
                  </button>
                  <button
                    onClick={() => onRecommend(alert.id)}
                    className="text-emerald-600 hover:underline"
                  >
                    Recomendar
                  </button>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No hay alertas recientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
