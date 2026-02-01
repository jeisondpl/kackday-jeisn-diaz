import { useState } from 'react';
import { FiltersPanel } from '../components/FiltersPanel.tsx';
import { SummaryCards } from '../components/SummaryCards.tsx';
import { AnomaliesList } from '../components/AnomaliesList.tsx';
import { ForecastTable } from '../components/ForecastTable.tsx';
import { AlertsTable } from '../components/AlertsTable.tsx';
import { RecommendationPanel } from '../components/RecommendationPanel.tsx';
import { ExplanationPanel } from '../components/ExplanationPanel.tsx';
import { AlertsSeverityChart } from '../components/AlertsSeverityChart.tsx';
import { AlertsWeeklyTrendChart } from '../components/AlertsWeeklyTrendChart.tsx';
import { AlertsBySedeChart } from '../components/AlertsBySedeChart.tsx';
import { AlertsBySectorChart } from '../components/AlertsBySectorChart.tsx';
import { AlertsByStatusChart } from '../components/AlertsByStatusChart.tsx';
import { AlertsByMetricChart } from '../components/AlertsByMetricChart.tsx';
import { AlertsTopNChart } from '../components/AlertsTopNChart.tsx';
import { AlertsTimeSeriesCharts } from '../components/AlertsTimeSeriesCharts.tsx';
import { Loading } from '@shared/components/ui/Loading.tsx';
import { ErrorMessage } from '@shared/components/ui/ErrorMessage.tsx';
import { useInteligencia } from '../hooks/useInteligencia.ts';

export function InteligenciaPage() {
  const [activeTab, setActiveTab] = useState<'categorias' | 'tendencias'>('categorias');
  const {
    filters,
    summary,
    summaryStatus,
    summaryError,
    anomalies,
    anomaliesStatus,
    anomaliesError,
    forecast,
    forecastStatus,
    forecastError,
    alerts,
    alertsStatus,
    alertsError,
    explanation,
    explanationStatus,
    explanationError,
    recommendation,
    recommendationStatus,
    recommendationError,
    setFilters,
    fetchAll,
    fetchExplanation,
    generateRecommendation,
    recalcBaseline,
  } = useInteligencia();

  const isLoading = summaryStatus === 'loading' || anomaliesStatus === 'loading' || forecastStatus === 'loading';

  return (
    <div className="min-h-screen bg-corp-light">
      {/* Header */}
      <header className="bg-corp-dark">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-white">Centro de Alertas y Prediccion</h1>
          <p className="text-sm text-white/70 mt-1">
            Monitoreo de anomalias, prediccion de consumo y gestion de alertas energeticas
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filtros */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Filtros de Consulta
          </h2>
          <FiltersPanel
            sedeId={filters.sede_id}
            sedes={summary?.sedes || []}
            sector={filters.sector}
            metric={filters.metric}
            hours={filters.hours}
            lookbackDays={filters.lookback_days}
            threshold={filters.threshold}
            onChange={(next) => setFilters(next)}
            onRefresh={() => fetchAll()}
            onRecalculate={() => recalcBaseline({
              sede_id: filters.sede_id || undefined,
              metric: filters.metric,
              lookback_days: filters.lookback_days,
            })}
          />
        </section>

        {/* Estados de carga y error */}
        {isLoading && <Loading text="Cargando analítica..." />}
        {summaryError && <ErrorMessage message={summaryError} onRetry={() => fetchAll()} />}
        {anomaliesError && <ErrorMessage message={anomaliesError} />}
        {forecastError && <ErrorMessage message={forecastError} />}

        {/* Resumen */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Resumen General
          </h2>
          <SummaryCards summary={summary} />
        </section>

        {/* Anomalias y Prediccion */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Deteccion y Prediccion
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnomaliesList anomalies={anomalies} />
            <ForecastTable forecast={forecast} />
          </div>
        </section>

        {/* Graficos de Analisis */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Analisis de Alertas
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 bg-white">
            <button
              onClick={() => setActiveTab('categorias')}
              className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition border-b-2 ${
                activeTab === 'categorias'
                  ? 'bg-corp-dark text-white border-corp-dark'
                  : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
              }`}
            >
              Analisis por Categoria
            </button>
            <button
              onClick={() => setActiveTab('tendencias')}
              className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition border-b-2 ${
                activeTab === 'tendencias'
                  ? 'bg-corp-dark text-white border-corp-dark'
                  : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
              }`}
            >
              Tendencias Temporales
            </button>
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-6 pt-4">
            {activeTab === 'categorias' && (
              <div className="space-y-6">
                {/* Distribucion - 5 graficos pequenos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <AlertsSeverityChart alerts={alerts} />
                  <AlertsBySedeChart alerts={alerts} />
                  <AlertsBySectorChart alerts={alerts} />
                  <AlertsByStatusChart alerts={alerts} />
                  <AlertsByMetricChart alerts={alerts} />
                </div>

                {/* Top N - Ranking integrado */}
                <div className="border-t border-gray-100 pt-6">
                  <AlertsTopNChart alerts={alerts} />
                </div>
              </div>
            )}

            {activeTab === 'tendencias' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertsWeeklyTrendChart alerts={alerts} />
                <AlertsTimeSeriesCharts alerts={alerts} />
              </div>
            )}
          </div>
        </section>

        {/* Tabla de Alertas */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Detalle de Alertas
          </h2>
          {alertsStatus === 'loading' && <Loading text="Cargando alertas..." />}
          {alertsError && <ErrorMessage message={alertsError} />}
          <AlertsTable
            alerts={alerts}
            onExplain={(id) => fetchExplanation(id)}
            onRecommend={(id) => generateRecommendation(id)}
          />
        </section>

        {/* Paneles de IA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Explicacion IA
            </h2>
            {explanationStatus === 'loading' && <Loading text="Generando explicación..." />}
            {explanationError && <ErrorMessage message={explanationError} />}
            <ExplanationPanel explanation={explanation} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Recomendacion IA
            </h2>
            {recommendationStatus === 'loading' && <Loading text="Generando recomendación..." />}
            {recommendationError && <ErrorMessage message={recommendationError} />}
            <RecommendationPanel recommendation={recommendation} />
          </div>
        </section>
      </div>
    </div>
  );
}
