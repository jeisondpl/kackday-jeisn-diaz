import { AlertsRepositoryPort } from '../../../shared/application/ports/AlertsRepositoryPort.js';
import { LLMPort } from '../../../shared/application/ports/LLMPort.js';
import { VectorStorePort } from '../../../shared/application/ports/VectorStorePort.js';
import { KnowledgeRepositoryPort } from '../../../shared/application/ports/KnowledgeRepositoryPort.js';
import { LoggerPort } from '../../../shared/application/ports/LoggerPort.js';
import { Recommendation } from '../../../shared/domain/Recommendation.js';

export interface RecommendationRequest {
  alertId: number;
  context?: string;
  useRAG?: boolean;
}

export class GenerateRecommendation {
  constructor(
    private readonly alertsRepository: AlertsRepositoryPort,
    private readonly llm: LLMPort,
    private readonly vectorStore: VectorStorePort,
    private readonly knowledgeRepository: KnowledgeRepositoryPort,
    private readonly ragTopK: number,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: RecommendationRequest): Promise<Recommendation> {
    this.logger.info(`Generating recommendation for alert ${request.alertId}`);

    try {
      // Fetch alert
      const alert = await this.alertsRepository.findById(request.alertId);
      if (!alert) {
        throw new Error(`Alert ${request.alertId} not found`);
      }

      // Fetch evidence
      const evidence = await this.alertsRepository.getEvidence(request.alertId);

      // Retrieve relevant knowledge using RAG (if enabled)
      let ragContext = '';
      const sources: Array<{ docId: number; title: string }> = [];

      if (request.useRAG !== false) {
        try {
          const ragResults = await this.retrieveRelevantKnowledge(alert, evidence);
          ragContext = ragResults.context;
          sources.push(...ragResults.sources);
        } catch (error) {
          this.logger.warn('RAG retrieval failed, continuing without it', { error: (error as Error).message });
        }
      }

      // Build context for LLM
      const contextText = this.buildContext(alert, evidence, request.context, ragContext);

      // Generate recommendation using LLM
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(alert, contextText);

      const response = await this.llm.complete([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.3, // Lower temperature for more focused recommendations
        maxTokens: 1500,
      });

      // Parse LLM response into structured recommendation
      const recommendation = this.parseRecommendation(response, alert, sources);

      this.logger.info(`Recommendation generated for alert ${request.alertId}`, {
        actionsCount: recommendation.actions.length,
      });

      return recommendation;
    } catch (error) {
      this.logger.error(`Failed to generate recommendation for alert ${request.alertId}`, error as Error);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `You are an energy efficiency expert assistant for the UPTC (Universidad Pedagógica y Tecnológica de Colombia).

Your role is to analyze energy consumption alerts and provide actionable recommendations to reduce energy waste and optimize consumption.

When providing recommendations:
1. Be specific and actionable
2. Consider the academic context (university campus)
3. Prioritize low-cost, high-impact solutions
4. Provide estimated savings when possible
5. Consider operational constraints (classes, labs, office hours)
6. Structure your response in the following format:

SUMMARY: Brief one-sentence summary
ACTIONS:
- Action 1
- Action 2
- Action 3
WHY:
- Reason 1
- Reason 2
EXPECTED_SAVINGS: Estimated savings (e.g., "5-12% reduction in sector")

Keep recommendations practical and implementable within a university setting.`;
  }

  private buildUserPrompt(alert: any, context: string): string {
    return `Analyze this energy alert and provide recommendations:

ALERT DETAILS:
- Severity: ${alert.severity}
- Message: ${alert.message}
- Location: ${alert.sedeId}${alert.sector ? ` - ${alert.sector}` : ''}
- Metric: ${alert.metric}
- Time window: ${alert.windowStart.toISOString()} to ${alert.windowEnd.toISOString()}

CONTEXT:
${context}

Provide specific, actionable recommendations to address this alert.`;
  }

  private buildContext(alert: any, evidence: any[], additionalContext?: string, ragContext?: string): string {
    const contextParts: string[] = [];

    // Evidence context
    if (evidence.length > 0) {
      const latestEvidence = evidence[0];

      if (latestEvidence.values) {
        contextParts.push(`Current values: ${JSON.stringify(latestEvidence.values)}`);
      }

      if (latestEvidence.baseline) {
        contextParts.push(`Baseline: ${JSON.stringify(latestEvidence.baseline)}`);
      }

      if (latestEvidence.delta) {
        contextParts.push(`Deviation: ${JSON.stringify(latestEvidence.delta)}`);
      }

      if (latestEvidence.anomalyScore !== undefined) {
        contextParts.push(`Anomaly score: ${latestEvidence.anomalyScore.toFixed(2)}`);
      }
    }

    // Sector-specific context
    if (alert.sector) {
      const sectorContext = this.getSectorContext(alert.sector);
      if (sectorContext) {
        contextParts.push(sectorContext);
      }
    }

    // RAG retrieved knowledge
    if (ragContext) {
      contextParts.push('\nRELEVANT KNOWLEDGE:');
      contextParts.push(ragContext);
    }

    // Additional context
    if (additionalContext) {
      contextParts.push(additionalContext);
    }

    return contextParts.join('\n');
  }

  private getSectorContext(sector: string): string | null {
    const contexts: Record<string, string> = {
      comedor: 'Sector: Dining hall - High energy use for refrigeration, cooking equipment, and HVAC during meal hours',
      salones: 'Sector: Classrooms - Energy mainly for lighting and HVAC during class hours',
      laboratorios: 'Sector: Laboratories - Specialized equipment with high energy requirements, often running 24/7',
      auditorios: 'Sector: Auditoriums - HVAC, lighting, and AV equipment, typically used for events',
      oficinas: 'Sector: Offices - Standard office equipment, lighting, and HVAC during business hours',
    };

    return contexts[sector] || null;
  }

  private parseRecommendation(
    llmResponse: string,
    alert: any,
    sources: Array<{ docId: number; title: string }> = []
  ): Recommendation {
    // Extract sections from LLM response
    const summaryMatch = llmResponse.match(/SUMMARY:\s*(.+?)(?=\n|ACTIONS:|$)/i);
    const actionsMatch = llmResponse.match(/ACTIONS:\s*((?:-.+?\n?)+)/i);
    const whyMatch = llmResponse.match(/WHY:\s*((?:-.+?\n?)+)/i);
    const savingsMatch = llmResponse.match(/EXPECTED_SAVINGS:\s*(.+?)(?=\n|$)/i);

    const summary = summaryMatch?.[1]?.trim() || llmResponse.substring(0, 200);

    const actions = actionsMatch?.[1]
      ?.split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter(Boolean) || ['Review energy consumption patterns', 'Consult with facilities management'];

    const why = whyMatch?.[1]
      ?.split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter(Boolean) || [];

    const expectedSavings = savingsMatch?.[1]?.trim() || 'To be determined based on implementation';

    // Use provided sources from RAG or fallback
    const finalSources = sources.length > 0 ? sources : [
      {
        docId: 1,
        title: 'UPTC Energy Efficiency Best Practices',
      },
      {
        docId: 2,
        title: `${alert.sector || 'General'} Sector Energy Guidelines`,
      },
    ];

    return {
      id: 0, // Will be set when persisted
      alertId: alert.id,
      summary,
      actions,
      expectedSavings: {
        type: 'heuristic',
        value: expectedSavings,
      },
      why,
      sources: finalSources,
      createdAt: new Date(),
    };
  }

  /**
   * Retrieve relevant knowledge from vector store using RAG
   */
  private async retrieveRelevantKnowledge(
    alert: any,
    _evidence: any[]
  ): Promise<{ context: string; sources: Array<{ docId: number; title: string }> }> {
    try {
      // Build query text for embedding
      const queryParts = [
        alert.message,
        alert.sector ? `sector: ${alert.sector}` : '',
        alert.metric,
      ].filter(Boolean);

      const queryText = queryParts.join(' ');

      // Generate embedding for query
      const queryEmbedding = await this.llm.embed(queryText);

      // Search similar chunks
      const results = await this.vectorStore.searchSimilar(queryEmbedding, this.ragTopK, 0.7);

      if (results.length === 0) {
        return { context: '', sources: [] };
      }

      // Get unique doc IDs
      const docIds = Array.from(new Set(results.map((r) => r.chunk.docId)));

      // Fetch doc metadata
      const docs = await Promise.all(
        docIds.map((id) => this.knowledgeRepository.findById(id))
      );

      const sources = docs
        .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
        .map((doc) => ({
          docId: doc.id,
          title: doc.title,
        }));

      // Build context from chunks
      const contextParts = results.map((result, index) =>
        `[${index + 1}] ${result.chunk.content} (similarity: ${result.similarity.toFixed(2)})`
      );

      const context = contextParts.join('\n\n');

      this.logger.debug('RAG retrieval successful', {
        resultsCount: results.length,
        sourcesCount: sources.length,
      });

      return { context, sources };
    } catch (error) {
      this.logger.error('RAG retrieval failed', error as Error);
      throw error;
    }
  }
}
