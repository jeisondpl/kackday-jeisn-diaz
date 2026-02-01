# UPTC Energia LLM

Sistema inteligente de análisis energético con LLM para la Universidad Pedagógica y Tecnológica de Colombia (UPTC).

## Descripción

Este proyecto implementa un servicio de inteligencia artificial que analiza datos de consumo energético de las sedes universitarias UPTC, genera alertas inteligentes, detecta anomalías y proporciona recomendaciones basadas en RAG (Retrieval-Augmented Generation).

### Integración con Ecosistema UPTC Energía

| Proyecto | Puerto | Descripción |
|----------|--------|-------------|
| **uptc-energia-api** | 3000 | API REST Node.js/Express + PostgreSQL |
| **uptc-energia-web** | 5173 | Frontend React + ECharts |
| **uptc-energia-llm** | 3001 | Servicio LLM (este proyecto) |

---

## Arquitectura

### Patrones Implementados

- **Hexagonal Architecture** - Separación clara entre dominio, aplicación e infraestructura
- **Screaming Architecture** - La estructura de carpetas refleja el dominio del negocio
- **Vertical Slice** - Cada feature es autónomo con sus propias capas

### Estructura del Proyecto

```
uptc-energia-llm/
├── package.json                    # Dependencias Node.js + TypeScript
├── tsconfig.json                   # Config TypeScript (strict mode)
├── .env.example                    # Template variables entorno
├── .gitignore
├── README.md
│
├── src/
│   ├── server.ts                   # Servidor Fastify + Swagger
│   │
│   ├── shared/
│   │   ├── config/
│   │   │   └── index.ts            # Configuración centralizada (Zod)
│   │   │
│   │   ├── domain/                 # ENTIDADES PURAS (8 archivos)
│   │   │   ├── SedeRef.ts          # Value object de Sede
│   │   │   ├── Sector.ts           # Enum sectores
│   │   │   ├── SensorReading.ts    # Lecturas sensores
│   │   │   ├── Rule.ts             # Regla con DSL JSON
│   │   │   ├── Alert.ts            # Alerta con fingerprint
│   │   │   ├── Evidence.ts         # Evidencia numérica
│   │   │   ├── Recommendation.ts   # Recomendación IA
│   │   │   └── KnowledgeDoc.ts     # Documento RAG
│   │   │
│   │   ├── application/ports/      # INTERFACES (5 archivos)
│   │   │   ├── EnergyApiPort.ts    # Consumir Energy API
│   │   │   ├── RulesRepositoryPort.ts
│   │   │   ├── AlertsRepositoryPort.ts
│   │   │   ├── LLMPort.ts          # Interacción LLM
│   │   │   └── LoggerPort.ts
│   │   │
│   │   └── infrastructure/
│   │       └── PinoLoggerAdapter.ts
│   │
│   ├── interfaces/http/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middlewares/
│   │
│   └── features/                   # VERTICAL SLICES
│       ├── ingestion/              # Ingesta datos desde Energy API
│       ├── rules/                  # Motor de reglas DSL
│       ├── alerts/                 # Gestión de alertas
│       ├── analytics/              # Anomalías + Forecast
│       ├── rag/                    # RAG + Recomendaciones
│       └── explainability/         # Explicaciones IA
│
├── db/
│   ├── migrations/
│   │   ├── 001_create_schema.sql   # Schema uptc_llm + pgvector
│   │   ├── 002_create_tables.sql   # 11 tablas
│   │   └── 003_create_indexes.sql  # Índices optimizados
│   └── seeds/
│       └── 001_example_rules.sql   # 3 reglas de ejemplo
│
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── rules-dsl.md
│   └── rag/knowledge-base/
│       └── guia-eficiencia-energetica.md
│
└── scripts/
    └── migrate.ts
```

---

## Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 15+ con extensión pgvector
- uptc-energia-api corriendo en puerto 3000

### Setup

```bash
# Clonar/navegar al proyecto
cd C:\INDRA\HackDay\uptc-energia-llm

# Instalar dependencias
npm install

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
npm run db:migrate

# Cargar datos de ejemplo
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

### Variables de Entorno (.env)

```env
# Servidor
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Base de datos
DATABASE_URL=postgresql://uptc_admin:uptc_password@localhost:5432/uptc_energia

# Energy API (proyecto uptc-energia-api)
ENERGY_API_BASE_URL=http://localhost:3000
ENERGY_API_TIMEOUT=30000

# LLM (OpenAI-compatible: OpenAI, Anthropic, LM Studio, Ollama)
LLM_PROVIDER=openai
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=lm-studio
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048

# RAG
RAG_EMBEDDING_MODEL=text-embedding-ada-002
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=50
RAG_TOP_K=5

# Jobs
RULES_EVALUATION_CRON=*/5 * * * *
INGESTION_CRON=*/1 * * * *
```

---

## Base de Datos

### Schema: `uptc_llm`

El proyecto usa un schema separado para no modificar la base de datos original de uptc-energia-api.

### Tablas (11 total)

| Tabla | Descripción |
|-------|-------------|
| `rules` | Reglas de detección en formato DSL JSON |
| `policies` | Políticas que agrupan reglas |
| `alerts` | Alertas generadas con fingerprint único |
| `alert_evidence` | Evidencia numérica de cada alerta |
| `recommendations` | Recomendaciones generadas por IA |
| `knowledge_docs` | Documentos base de conocimiento |
| `doc_chunks` | Chunks de documentos para RAG |
| `embeddings` | Embeddings vectoriales (pgvector) |
| `baselines` | Líneas base históricas |
| `forecasts` | Predicciones de consumo |
| `audit_log` | Log de auditoría |

### Tabla: rules

```sql
CREATE TABLE uptc_llm.rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dsl_json JSONB NOT NULL,           -- Regla en formato DSL
    scope JSONB NOT NULL,              -- {sede_id, sector}
    metric VARCHAR(100) NOT NULL,      -- energia_kwh, agua, etc.
    severity VARCHAR(20) NOT NULL,     -- low|medium|high|critical
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: alerts

```sql
CREATE TABLE uptc_llm.alerts (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,  -- Deduplicación
    rule_id INTEGER REFERENCES rules,
    sede_id VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',         -- open|acknowledged|resolved
    message TEXT NOT NULL,
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

### Tabla: embeddings (pgvector)

```sql
CREATE TABLE uptc_llm.embeddings (
    id SERIAL PRIMARY KEY,
    chunk_id INTEGER REFERENCES doc_chunks,
    embedding vector(768),              -- Vector para búsqueda semántica
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice vectorial para búsqueda eficiente
CREATE INDEX idx_embeddings_vector
ON uptc_llm.embeddings
USING ivfflat (embedding vector_cosine_ops);
```

---

## Motor de Reglas DSL

### Tipos de Reglas Soportados

| Tipo | Descripción |
|------|-------------|
| `absolute_threshold` | Umbral fijo (ej: > 500 kWh) |
| `baseline_relative` | Desviación del baseline (ej: +25%) |
| `out_of_schedule` | Consumo fuera de horario permitido |
| `rate_of_change` | Cambio brusco en ventana de tiempo |
| `comparative` | Comparación entre sedes/sectores |
| `forecast_deviation` | Desviación del pronóstico |

### Ejemplo: Regla out_of_schedule

```json
{
  "type": "out_of_schedule",
  "scope": {
    "sector": "comedores"
  },
  "metric": "energia_kwh",
  "schedule": {
    "allowed": [
      {"from": "06:00", "to": "21:00"}
    ]
  },
  "condition": {
    "gt": 120
  },
  "severity": "critical",
  "messageTemplate": "Consumo fuera de horario en {sector}: {value} kWh > {threshold}",
  "actions": [
    "Revisar programación HVAC",
    "Validar iluminación automática",
    "Verificar equipos en standby"
  ]
}
```

### Ejemplo: Regla baseline_relative

```json
{
  "type": "baseline_relative",
  "scope": {
    "sector": "laboratorios"
  },
  "metric": "energia_kwh",
  "window": {
    "granularity": "hour",
    "lookbackHours": 24
  },
  "baseline": {
    "tolerance_pct": 25
  },
  "severity": "high",
  "messageTemplate": "Consumo {value} kWh supera baseline {baseline} en {tolerance_pct}%",
  "actions": [
    "Revisar equipos de laboratorio",
    "Validar calibración sensores",
    "Verificar procesos en ejecución"
  ]
}
```

---

## API REST

### Endpoints Principales

#### Health Check

```http
GET /llm/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T10:00:00Z",
  "uptime": 3600,
  "config": {
    "rulesEngine": true,
    "anomalyDetection": true,
    "forecasting": true
  }
}
```

#### Listar Alertas

```http
GET /llm/alerts?status=open&severity=critical&sede_id=UPTC_TUN
```

**Response:**
```json
{
  "alerts": [
    {
      "id": 42,
      "fingerprint": "5::UPTC_TUN::comedores::2025-01-31T02:00:00Z::...",
      "sedeId": "UPTC_TUN",
      "sector": "comedores",
      "severity": "critical",
      "status": "open",
      "message": "Consumo alto fuera de horario: 245 kWh > 120 kWh",
      "windowStart": "2025-01-31T02:00:00Z",
      "windowEnd": "2025-01-31T03:00:00Z",
      "createdAt": "2025-01-31T03:05:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

#### Obtener Explicación de Alerta

```http
GET /llm/alerts/:id/explanation
```

**Response:**
```json
{
  "alertId": 42,
  "rule": {
    "id": 5,
    "name": "Consumo nocturno comedores",
    "type": "out_of_schedule"
  },
  "evidence": [
    {
      "type": "value",
      "value": 245,
      "threshold": 120,
      "unit": "kWh"
    },
    {
      "type": "baseline",
      "baseline": 85,
      "delta": 160,
      "deltaPct": 188
    },
    {
      "type": "anomaly_score",
      "anomalyScore": 4.2,
      "threshold": 3.0
    }
  ],
  "why": [
    "El consumo de 245 kWh supera el umbral de 120 kWh establecido para horario no laboral (fuera de 06:00-21:00)",
    "La desviación del baseline histórico (85 kWh) es de +188%",
    "El z-score de 4.2 indica una anomalía estadísticamente significativa (umbral: 3.0)"
  ]
}
```

#### Generar Recomendación

```http
POST /llm/recommendations/alerts/:id
```

**Response:**
```json
{
  "id": 15,
  "alertId": 42,
  "summary": "Revisar programación HVAC y equipos cocina en horario nocturno",
  "actions": [
    "Revisar programación HVAC para evitar encendido nocturno",
    "Verificar refrigeradores (deben operar 24/7 pero no exceder 60 kWh/h)",
    "Implementar temporizadores en equipos de cocina",
    "Auditar sistema de iluminación automática"
  ],
  "expectedSavings": {
    "type": "heuristic",
    "value": "8-15% reducción consumo nocturno (~40-60 kWh/noche)"
  },
  "why": [
    "60% del consumo nocturno en comedores típicamente corresponde a HVAC mal programado",
    "La temperatura exterior (12°C) no justifica climatización activa",
    "Caso similar en Tunja 2024 logró reducción del 18% con estas medidas",
    "Consumo esperado refrigeración: 40-60 kWh/h, actual: 245 kWh (4x)"
  ],
  "sources": [
    {
      "docId": 5,
      "title": "Guía eficiencia energética comedores.md",
      "chunkId": 23
    },
    {
      "docId": 12,
      "title": "Casos éxito - Optimización HVAC UPTC.md",
      "chunkId": 45
    }
  ],
  "confidence": 0.85,
  "generatedAt": "2025-01-31T10:15:00Z"
}
```

#### CRUD Reglas

```http
GET    /llm/rules                    # Listar reglas
GET    /llm/rules/:id                # Obtener regla
POST   /llm/rules                    # Crear regla
PUT    /llm/rules/:id                # Actualizar regla
DELETE /llm/rules/:id                # Eliminar regla
POST   /llm/rules/:id/toggle         # Activar/desactivar
POST   /llm/rules/validate           # Validar DSL
```

#### Consulta en Lenguaje Natural

```http
POST /llm/query
Content-Type: application/json

{
  "question": "¿Cuál sede consume más energía los fines de semana?",
  "context": {
    "dateRange": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    }
  }
}
```

**Response:**
```json
{
  "answer": "La sede Sogamoso es la que más energía consume los fines de semana con un promedio de 156 kWh/día, seguida de Duitama (142 kWh/día) y Tunja (98 kWh/día). Esto se debe principalmente a que Sogamoso tiene laboratorios pesados que operan en turnos extendidos.",
  "data": {
    "query": "SELECT sede, AVG(energia_total_suma_kwh) FROM stats/diario WHERE es_fin_semana = true GROUP BY sede",
    "results": [
      {"sede": "Sogamoso", "promedio": 156.4},
      {"sede": "Duitama", "promedio": 142.1},
      {"sede": "Tunja", "promedio": 98.7},
      {"sede": "Chiquinquirá", "promedio": 45.2}
    ]
  },
  "sources": [
    {"type": "api", "endpoint": "/stats/diario"}
  ],
  "confidence": 0.92
}
```

#### Documentos RAG

```http
POST /llm/docs
Content-Type: application/json

{
  "title": "Guía de eficiencia energética - Comedores",
  "content": "Texto del documento...",
  "sector": "comedores",
  "tags": ["hvac", "iluminacion"],
  "index": true
}
```

```http
GET /llm/docs?sector=comedores&tags=hvac,iluminacion&indexed=true
```

#### Analítica (Anomalías y Predicción)

```http
GET /llm/analytics/anomalies?sede_id=UPTC_TUN&metric=energiaTotal&hours=24&threshold=3.0
```

```http
GET /llm/analytics/forecast?sede_id=UPTC_TUN&metric=energiaTotal&hours=24&lookback_days=30
```

```http
GET /llm/analytics/summary?sede_id=UPTC_TUN
```

```http
GET /llm/analytics/baseline?sede_id=UPTC_TUN&metric=energiaTotal&days=30
```

---

## Ejemplos de Uso

### Ejemplo: Explicación de Alerta

**Contexto:** Alerta #42 - Consumo nocturno elevado en comedores de Tunja

**Mensaje de la Alerta:**
> "Consumo alto fuera de horario en comedores: 245 kWh > 120 kWh"

**Evidencia Numérica:**

| Tipo | Valor | Referencia | Interpretación |
|------|-------|------------|----------------|
| value | 245 kWh | threshold: 120 kWh | Supera umbral en 104% |
| baseline | 85 kWh | delta: +160 kWh | Desviación +188% |
| anomaly_score | 4.2 | threshold: 3.0 | Anomalía significativa |

**Explicación Generada:**

1. El consumo de 245 kWh supera el umbral de 120 kWh establecido para horario no laboral (fuera de 06:00-21:00)
2. La desviación del baseline histórico (85 kWh para esta hora/día) es de +188% [(245-85)/85]

---

## Manual de Usuario - Flujo de Alertas

Consulta el flujo manual para creación, evaluación y explicación de alertas en:

- `docs/flujo-alertas-usuario.md`
3. El z-score de 4.2 indica una anomalía estadísticamente significativa (umbral típico: 3.0)

### Ejemplo: Recomendación con RAG

**Input:** Alerta #42 (consumo alto nocturno comedores)

**Proceso RAG:**
1. Embedding de la alerta
2. Búsqueda semántica en knowledge base
3. Recuperación de chunks relevantes
4. Generación con contexto

**Output:**

```
RESUMEN: Revisar programación HVAC y equipos cocina en horario nocturno

ACCIONES RECOMENDADAS:
1. Revisar programación HVAC para evitar encendido nocturno
2. Verificar refrigeradores (deben operar 24/7)
3. Implementar temporizadores en equipos cocina
4. Auditar iluminación automática

AHORRO ESPERADO: 8-15% reducción consumo nocturno (~40-60 kWh/noche)

JUSTIFICACIÓN:
- 60% del consumo nocturno comedores es HVAC mal programado
- Temperatura exterior (12°C) no justifica climatización
- Caso Tunja 2024 logró reducción 18% con estas medidas

FUENTES:
- Guía eficiencia energética comedores.md (chunk 23)
- Casos éxito - Optimización HVAC UPTC.md (chunk 45)

CONFIANZA: 85%
```

---

## Scripts NPM

```bash
# Desarrollo
npm run dev           # Inicia servidor con hot-reload
npm run build         # Compila TypeScript
npm start             # Inicia servidor producción

# Base de datos
npm run db:migrate    # Ejecuta migraciones
npm run db:seed       # Carga datos de ejemplo
npm run db:reset      # Reinicia base de datos

# Testing
npm test              # Ejecuta tests
npm run test:watch    # Tests en modo watch
npm run test:coverage # Coverage report

# Linting
npm run lint          # ESLint
npm run lint:fix      # ESLint con autofix
npm run format        # Prettier
```

---

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js 18+ |
| Lenguaje | TypeScript 5.x |
| Framework HTTP | Fastify 4.x |
| Validación | Zod |
| Base de datos | PostgreSQL 15+ |
| Vectores | pgvector |
| LLM | LangChain.js |
| Embeddings | OpenAI / Local |
| Logging | Pino |
| Documentación | Swagger/OpenAPI |
| Scheduler | node-cron |

---

## Flujo de Datos

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  uptc-energia   │────▶│  uptc-energia   │────▶│  uptc-energia   │
│      api        │     │      llm        │     │      web        │
│   (port 3000)   │     │   (port 3001)   │     │   (port 5173)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │   PostgreSQL    │     │    Browser      │
│  (schema: public)│    │ (schema: uptc_llm)│   │                 │
│                 │     │   + pgvector    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Proceso de Detección de Anomalías

```
1. INGESTION (cada minuto)
   └─▶ Consume /consumos de Energy API
   └─▶ Almacena lecturas recientes

2. RULES EVALUATION (cada 5 minutos)
   └─▶ Carga reglas activas
   └─▶ Evalúa cada regla contra datos
   └─▶ Genera alertas si hay violaciones
   └─▶ Calcula fingerprint (deduplicación)

3. ANOMALY DETECTION (cada 5 minutos)
   └─▶ Calcula z-scores
   └─▶ Detecta patrones inusuales
   └─▶ Genera alertas de anomalía

4. RECOMMENDATION (on-demand)
   └─▶ Recibe alerta
   └─▶ Búsqueda RAG en knowledge base
   └─▶ Genera recomendación con LLM
   └─▶ Incluye fuentes y confianza
```

---

## Configuración LLM

### OpenAI

```env
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo-preview
```

### Anthropic Claude

```env
LLM_PROVIDER=anthropic
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_API_KEY=sk-ant-...
LLM_MODEL=claude-3-opus-20240229
```

### LM Studio (Local)

```env
LLM_PROVIDER=openai
LLM_BASE_URL=http://localhost:1234/v1
LLM_API_KEY=lm-studio
LLM_MODEL=local-model
```

### Ollama (Local)

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llama2:70b
```

---

## Roadmap

### Fase 1 - Base (Completado)
- [x] Arquitectura Hexagonal + Vertical Slice
- [x] Dominio: 8 entidades puras
- [x] Puertos: 5 interfaces
- [x] Base de datos: 11 tablas + migraciones
- [x] Servidor HTTP base
- [x] Documentación

### Fase 2 - Implementación (En progreso)
- [ ] Adaptador HttpEnergyApiAdapter
- [ ] Adaptador PostgresRepositories
- [ ] Adaptador PgVectorAdapter (RAG)
- [ ] Adaptador LLMAdapter
- [ ] Use Cases principales

### Fase 3 - Features Avanzados
- [ ] Forecasting con Prophet/ARIMA
- [ ] Dashboard de alertas en tiempo real
- [ ] Integración con uptc-energia-web
- [ ] Notificaciones (email, Slack, webhook)

### Fase 4 - Producción
- [ ] Docker Compose
- [ ] CI/CD
- [ ] Monitoreo (Prometheus/Grafana)
- [ ] Rate limiting
- [ ] Autenticación JWT

---

## Contribución

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

---

## Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## Contacto

**Proyecto:** UPTC Energía - Sistema de Monitoreo Energético Inteligente

**Desarrollado para:** HackDay 2025 - Indra
