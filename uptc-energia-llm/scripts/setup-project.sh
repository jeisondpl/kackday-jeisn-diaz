#!/bin/bash
# Script para generar la documentación completa del proyecto

echo "Generando documentación del proyecto uptc-energia-llm..."

# Crear README principal
cat > README.md << 'ENDREADME'
# UPTC Energia LLM

Sistema inteligente de domótica y análisis energético con IA para UPTC.

## Stack

- Node.js 20+ + TypeScript
- Fastify + Zod
- PostgreSQL + pgvector
- LangChain JS + LLM OpenAI-compatible
- node-cron

## Arquitectura

**Hexagonal + Screaming + Vertical Slice**

Ver `/docs/architecture.md` para detalles completos.

## Instalación Rápida

```bash
npm install
cp .env.example .env
# Editar .env
npm run db:migrate
npm run dev
```

Puerto: `http://localhost:3001`
Docs: `http://localhost:3001/docs`

## Endpoints Principales

- `GET /llm/health`
- `POST /llm/ingestion/run`
- `GET /llm/alerts`
- `POST /llm/rules`
- `POST /llm/recommendations/alerts/:id`

Ver `/docs/api-contract.md` para especificaciones completas.

## Motor de Reglas DSL

6 tipos: `absolute_threshold`, `out_of_schedule`, `baseline_relative`, `budget_window`, `forecast_breach`, `anomaly_score`

Ver `/docs/rules-dsl.md` para ejemplos.

## Integración

Consume `uptc-energia-api` (puerto 3000) para obtener datos históricos.
No modifica la base de datos original.
Usa schema `uptc_llm` para su propia data.

## Licencia

MIT
ENDREADME

echo "README.md creado."
