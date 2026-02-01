import { useState, useEffect } from 'react';
import { DocsForm } from '../components/DocsForm.tsx';
import { DocsStatusPanel } from '../components/DocsStatusPanel.tsx';
import { Loading } from '@shared/components/ui/Loading.tsx';
import { ErrorMessage } from '@shared/components/ui/ErrorMessage.tsx';
import { useInteligencia } from '../hooks/useInteligencia.ts';

export function KnowledgeBasePage() {
  const [page, setPage] = useState(1);
  const { docs, docsStatus, docsError, createDoc, listDocs } = useInteligencia();

  useEffect(() => {
    listDocs({ limit: 10, offset: 0 });
  }, []);

  const handleSearch = (q: string) => {
    setPage(1);
    listDocs({ q, limit: 10, offset: 0 });
  };

  const handleFilter = (filters: { sector?: string; tags?: string }) => {
    setPage(1);
    listDocs({ ...filters, limit: 10, offset: 0 });
  };

  const handlePage = (nextPage: number) => {
    setPage(nextPage);
    listDocs({ limit: 10, offset: (nextPage - 1) * 10 });
  };

  const handleRefresh = () => {
    listDocs({ limit: 10, offset: (page - 1) * 10 });
  };

  const handleCreate = async (payload: Parameters<typeof createDoc>[0]) => {
    await createDoc(payload);
    handleRefresh();
  };

  return (
    <div className="min-h-screen bg-corp-light">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-sm text-gray-500">
            Gestiona documentos para el sistema RAG de recomendaciones.
          </p>
        </div>

        {docsStatus === 'loading' && <Loading text="Cargando documentos..." />}
        {docsError && <ErrorMessage message={docsError} onRetry={handleRefresh} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocsStatusPanel
            docs={docs}
            page={page}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onPage={handlePage}
          />
          <DocsForm onCreate={handleCreate} />
        </div>
      </div>
    </div>
  );
}
