# Arquitectura uptc-energia-llm

## Principios

1. **Hexagonal Architecture (Ports & Adapters)**
   - Dominio aislado de infraestructura
   - Puertos (interfaces) definen contratos
   - Adaptadores implementan detalles técnicos

2. **Screaming Architecture**
   - Estructura grita su propósito: `/features/alerts`, `/features/rag`
   - No framework-centric

3. **Vertical Slice**
   - Cada feature es autónoma: domain + application + infrastructure

## Capas

### Domain (Shared)
Entidades puras sin dependencias externas:
- `SedeRef`, `Sector`, `SensorReading`
- `Rule`, `Alert`, `Evidence`
- `Recommendation`, `KnowledgeDoc`

### Application Ports
Interfaces para inversión de dependencias:
- `EnergyApiPort`: Consumir API datos
- `RulesRepositoryPort`: Persistencia reglas
- `AlertsRepositoryPort`: Persistencia alertas
- `LLMPort`: Interacción con LLM
- `LoggerPort`: Logging abstracto

### Infrastructure Adapters
Implementaciones concretas:
- `HttpEnergyApiAdapter`: HTTP client para Energy API
- `PostgresRulesRepository`: Postgres con pg
- `PgVectorAdapter`: Vector store pgvector
- `OpenAILLMAdapter`: LLM OpenAI-compatible
- `PinoLoggerAdapter`: Logging con Pino

## Features (Vertical Slices)

### 1. Ingestion
Responsabilidad: Obtener datos desde Energy API
- Use case: `IngestRecentReadings`
- Adaptador: `HttpEnergyApiAdapter`

### 2. Rules
Responsabilidad: CRUD reglas + evaluación DSL
- Use case: `EvaluateRules`
- Motor DSL: JSON schema validado con Zod

### 3. Alerts
Responsabilidad: Gestionar alertas + evidencia
- Use case: `CreateAlert`, `AcknowledgeAlert`
- Deduplicación: fingerprint único

### 4. Analytics
Responsabilidad: Anomalías + forecasting
- Use case: `DetectAnomalies`, `GenerateForecast`
- Baseline + z-score + métricas

### 5. RAG
Responsabilidad: Indexación docs + retrieval
- Use case: `IndexDocument`, `RetrieveRelevantChunks`
- Vector store: pgvector
- Chunking + embeddings

### 6. Explainability
Responsabilidad: Explicar alertas + recomendaciones
- Use case: `ExplainAlert`, `GenerateRecommendation`
- Combina evidencia + RAG + LLM

## Flujo de Datos

```
Energy API → HttpAdapter → Ingestion → SensorReading
                                ↓
                        Rules Evaluation
                                ↓
                          Alert + Evidence
                                ↓
                          RAG Retrieval
                                ↓
                        LLM → Recommendation
```

## Base de Datos

Schema: `uptc_llm` (separado de public)

Tablas críticas:
- `rules` (DSL JSON)
- `alerts` (fingerprint UNIQUE)
- `alert_evidence` (FK alert_id)
- `recommendations` (sources JSON)
- `knowledge_docs` + `doc_chunks`
- `embeddings` (vector column)
- `baselines` (historical stats)

## Configuración

Centralizada en `/src/shared/config/index.ts`
Validación con Zod
Todas las env vars tienen defaults seguros
