import { useEffect, useMemo, useState } from 'react';
import { Card } from '@shared/components/ui/Card.tsx';
import { Loading } from '@shared/components/ui/Loading.tsx';
import { ErrorMessage } from '@shared/components/ui/ErrorMessage.tsx';
import { useInteligenciaStore } from '../../application/store/inteligenciaStore.ts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export function ChatbotPage() {
  const { askQuestion, query, queryStatus, queryError, summary, fetchSummary } = useInteligenciaStore();
  const [question, setQuestion] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const sedes = useMemo(() => summary?.sedes || [], [summary]);

  const onSend = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');

    const toIso = (val: string) => {
      if (!val) return undefined;
      const date = new Date(val);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    };

    await askQuestion({
      question: userMessage.content,
      sede_id: sedeId || undefined,
      from: toIso(from),
      to: toIso(to),
    });
  };

  useEffect(() => {
    if (!summary) {
      fetchSummary();
    }
  }, [summary, fetchSummary]);

  useEffect(() => {
    if (!query) return;
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: query.answer,
        timestamp: query.timestamp,
        sources: query.sources,
      },
    ]);
  }, [query]);

  return (
    <div className="min-h-screen bg-corp-light">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot IA</h1>
          <p className="text-sm text-gray-500">
            Pregunta en lenguaje natural sobre consumo energético y alertas.
          </p>
        </div>

        <Card title="Contexto de consulta">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Sede</label>
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
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
              <label className="block text-sm text-gray-600 mb-1">Desde</label>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hasta</label>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </Card>

        <Card title="Conversación">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-50 text-blue-900'
                    : 'bg-white border border-gray-100 text-gray-700'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    Fuentes: {message.sources.join(', ')}
                  </div>
                )}
              </div>
            ))}

            {queryStatus === 'loading' && <Loading text="Generando respuesta..." />}
            {queryError && <ErrorMessage message={queryError} />}

            
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
            />
            <button
              onClick={onSend}
              className="px-4 py-2 bg-corp-dark text-white rounded-lg hover:bg-primary-light"
            >
              Enviar
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
