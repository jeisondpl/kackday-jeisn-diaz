import { useConsultaInit } from '../hooks/useConsulta.ts';
import {
  SummaryCards,
  FilterPanel,
  ConsumoDiarioChart,
  ConsumoSectorChart,
  PatronHorarioChart,
  ConsumoPeriodoChart,
  SedesComparisonChart,
} from '../components/index.ts';

export function DashboardPage() {
  // Initialize data fetching
  useConsultaInit();

  return (
    <div className="min-h-screen bg-corp-light">
      {/* Header */}
      <header className="bg-corp-dark shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Dashboard de Energía UPTC
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Análisis de consumo energético de las sedes universitarias
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                <span className="w-2 h-2 mr-1 bg-green-400 rounded-full animate-pulse"></span>
                API Conectada
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <FilterPanel />

        {/* Summary Cards */}
        <section className="mb-8">
          <SummaryCards />
        </section>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Consumo Diario - Full width */}
          <div className="lg:col-span-2">
            <ConsumoDiarioChart />
          </div>

          {/* Sector and Hourly Pattern */}
          <ConsumoSectorChart />
          <PatronHorarioChart />

          {/* Period and Campus Comparison */}
          <ConsumoPeriodoChart />
          <SedesComparisonChart />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-corp-dark mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-white/70">
              Universidad Pedagógica y Tecnológica de Colombia - Sistema de Monitoreo Energético
            </p>
            <p className="text-sm text-white/50 mt-2 sm:mt-0">
              Datos desde 2018 hasta 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
