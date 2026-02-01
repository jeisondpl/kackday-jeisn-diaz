import { EnergyApiPort } from '../../../shared/application/ports/EnergyApiPort.js';
import { LLMPort } from '../../../shared/application/ports/LLMPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';

export interface QueryRequest {
  question: string;
  sedeId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface QueryResponse {
  question: string;
  answer: string;
  data?: any;
  sources: string[];
  timestamp: Date;
}

export class QueryNaturalLanguage {
  constructor(
    private readonly energyApi: EnergyApiPort,
    private readonly llm: LLMPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: QueryRequest): Promise<QueryResponse> {
    this.logger.info('Processing natural language query', {
      question: request.question.substring(0, 100),
    });

    try {
      // Determine what data to fetch based on question
      const dataContext = await this.fetchRelevantData(request);

      // Generate answer using LLM
      const answer = await this.generateAnswer(request.question, dataContext);

      return {
        question: request.question,
        answer,
        data: dataContext.summary,
        sources: dataContext.sources,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to process natural language query', error as Error);
      throw error;
    }
  }

  private async fetchRelevantData(request: QueryRequest): Promise<{
    summary: any;
    rawData: any;
    sources: string[];
  }> {
    const question = request.question.toLowerCase();
    const sources: string[] = [];
    let summary: any = {};
    let rawData: any = {};

    // Determine date range
    const to = request.dateRange?.to || new Date();
    const from = request.dateRange?.from || new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Check what kind of query this is
    const isHourlyPattern = question.includes('hora') || question.includes('horario') || question.includes('patrón');
    const isDailyPattern = question.includes('día') || question.includes('diario');
    const isSectorAnalysis = question.includes('sector') || question.includes('comedor') || question.includes('laboratorio');
    const isSummary = question.includes('resumen') || question.includes('total') || question.includes('general');

    try {
      // Fetch sedes data
      const sedes = await this.energyApi.getSedes(true);
      sources.push('Sedes con estadísticas');

      // Fetch based on query type
      if (isHourlyPattern) {
        const hourlyStats = await this.energyApi.getStatsHorario({
          sedeId: request.sedeId,
          from,
          to,
        });
        rawData.hourlyPatterns = hourlyStats;
        summary.type = 'hourly_pattern';
        summary.dataPoints = hourlyStats.length;
        sources.push('Patrones horarios');
      }

      if (isDailyPattern) {
        const dailyStats = await this.energyApi.getStatsDiario({
          sedeId: request.sedeId,
          from,
          to,
        });
        rawData.dailyStats = dailyStats;
        summary.type = 'daily_pattern';
        summary.dataPoints = dailyStats.length;
        sources.push('Estadísticas diarias');
      }

      if (isSectorAnalysis) {
        const sectorStats = await this.energyApi.getStatsSector({
          sedeId: request.sedeId,
          from,
          to,
        });
        rawData.sectorStats = sectorStats;
        summary.type = 'sector_analysis';
        summary.dataPoints = sectorStats.length;
        sources.push('Distribución por sector');
      }

      if (isSummary || (!isHourlyPattern && !isDailyPattern && !isSectorAnalysis)) {
        if (request.dateRange?.from && request.dateRange?.to) {
          const dailyStats = await this.energyApi.getStatsDiario({
            sedeId: request.sedeId,
            from,
            to,
          });
          rawData.dailyStats = dailyStats;
          summary.type = 'summary';
          summary.data = this.buildRangeSummary(dailyStats);
          sources.push('Estadísticas diarias (rango)');
        } else {
          const generalSummary = await this.energyApi.getStatsSummary(request.sedeId);
          rawData.summary = generalSummary;
          summary.type = 'summary';
          summary.data = generalSummary;
          sources.push('Resumen general');
        }
      }

      // Add sedes info (filter if sedeId provided)
      const filteredSedes = request.sedeId
        ? sedes.filter((s) => s.id === request.sedeId)
        : sedes;

      summary.sedes = filteredSedes.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        totalConsumo: s.stats?.totalConsumo,
      }));
      summary.requestedSedeId = request.sedeId || null;

      summary.dateRange = { from: from.toISOString(), to: to.toISOString() };

      return { summary, rawData, sources };
    } catch (error) {
      this.logger.error('Failed to fetch relevant data', error as Error);
      // Return basic info on error
      return {
        summary: { error: 'Failed to fetch some data' },
        rawData: {},
        sources: ['Energy API (partial data)'],
      };
    }
  }

  private buildRangeSummary(dailyStats: any[]): {
    days: number;
    totalKwh: number;
    avgKwh: number;
  } {
    const getNum = (row: any, keys: string[]) => {
      for (const key of keys) {
        const value = row?.[key];
        if (typeof value === 'number' && !Number.isNaN(value)) return value;
        if (typeof value === 'string') {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) return parsed;
        }
      }
      return 0;
    };

    const total = dailyStats.reduce((sum, row) => {
      return sum + getNum(row, [
        'energia_total_suma_kwh',
        'energia_total_kwh',
        'energia_total',
        'energia_total_kwh_sum',
      ]);
    }, 0);

    const avg = dailyStats.reduce((sum, row) => {
      return sum + getNum(row, [
        'energia_total_promedio_kwh',
        'energia_promedio_kwh',
        'energia_total_avg_kwh',
      ]);
    }, 0);

    return {
      days: dailyStats.length,
      totalKwh: total,
      avgKwh: dailyStats.length > 0 ? avg / dailyStats.length : 0,
    };
  }

  private async generateAnswer(question: string, dataContext: any): Promise<string> {
    const systemPrompt = `You are an energy analysis assistant for UPTC (Universidad Pedagógica y Tecnológica de Colombia).

Your role is to answer questions about energy consumption data in a clear, concise, and helpful manner.

Guidelines:
1. Answer in Spanish
2. Be specific and use actual numbers from the data
3. Provide insights and context
4. If the data is insufficient, say so clearly
5. Suggest follow-up actions when relevant
6. Keep answers concise but informative (2-4 paragraphs max)`;

    const userPrompt = `Question: ${question}

Available Data:
${JSON.stringify(dataContext.summary, null, 2)}

Please provide a clear answer to the question based on the available data.`;

    try {
      const answer = await this.llm.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 800,
        }
      );

      return answer;
    } catch (error) {
      this.logger.error('Failed to generate LLM answer', error as Error);
      return 'Lo siento, no pude generar una respuesta en este momento. Por favor, intenta reformular tu pregunta o verifica la configuración del LLM.';
    }
  }
}
