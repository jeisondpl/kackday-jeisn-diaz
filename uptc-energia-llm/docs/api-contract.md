# API Contract - uptc-energia-llm

Base URL: `http://localhost:3001`

## Health

### GET /llm/health

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

## Ingestion

### POST /llm/ingestion/run

Ejecuta ingesta manual desde Energy API.

Body:
```json
{
  "sede_id": "UPTC_TUN",
  "hours_back": 24,
  "evaluate_rules": true
}
```

Response:
```json
{
  "ingestion": {
    "status": "completed",
    "readingsCount": 1440,
    "timeRange": {
      "from": "2025-01-30T00:00:00Z",
      "to": "2025-01-31T00:00:00Z"
    }
  },
  "evaluation": {
    "rulesEvaluated": 2,
    "alertsTriggered": 1,
    "readingsProcessed": 1440
  },
  "message": "Ingestion completed successfully"
}
```

## Alerts

### GET /llm/alerts

Query params:
- `status`: open | acknowledged | resolved
- `severity`: low | medium | high | critical
- `sede_id`: Filter by sede
- `sector`: Filter by sector
- `from`, `to`: Date range
- `limit`, `offset`: Pagination

Response:
```json
{
  "data": [
    {
      "id": 42,
      "fingerprint": "5::UPTC_TUN::comedores::2025-01-31T02:00:00Z::2025-01-31T03:00:00Z",
      "ruleId": 5,
      "sedeId": "UPTC_TUN",
      "sector": "comedores",
      "metric": "energiaTotal",
      "severity": "critical",
      "status": "open",
      "message": "Consumo alto fuera de horario en comedores: 245 kWh > 120 kWh",
      "windowStart": "2025-01-31T02:00:00Z",
      "windowEnd": "2025-01-31T03:00:00Z",
      "createdAt": "2025-01-31T03:05:00Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1
  }
}
```

### GET /llm/alerts/:id

Response:
```json
{
  "alert": {
    "id": 42,
    "fingerprint": "5::UPTC_TUN::comedores::2025-01-31T02:00:00Z::2025-01-31T03:00:00Z",
    "ruleId": 5,
    "sedeId": "UPTC_TUN",
    "sector": "comedores",
    "metric": "energiaTotal",
    "severity": "critical",
    "status": "open",
    "message": "Consumo alto fuera de horario...",
    "windowStart": "2025-01-31T02:00:00Z",
    "windowEnd": "2025-01-31T03:00:00Z",
    "createdAt": "2025-01-31T03:05:00Z"
  },
  "evidence": [
    {
      "values": { "value": 245, "timestamp": "2025-01-31T02:30:00Z" },
      "baseline": { "mean": 85, "stdDev": 20, "method": "zscore" },
      "delta": { "absolute": 160, "percentage": 188, "zScore": 4.2 },
      "anomalyScore": 4.2
    }
  ]
}
```

### GET /llm/alerts/:id/explanation

Response:
```json
{
  "alertId": 42,
  "message": "Consumo alto fuera de horario...",
  "evidence": [
    {
      "type": "value",
      "metricName": "energia_kwh",
      "value": 245,
      "threshold": 120
    },
    {
      "type": "baseline",
      "baseline": 85,
      "delta": 160
    },
    {
      "type": "anomaly_score",
      "anomalyScore": 4.2
    }
  ],
  "why": [
    "El consumo de 245 kWh supera el umbral de 120 kWh...",
    "La desviación del baseline es de +188%",
    "El z-score de 4.2 indica anomalía significativa"
  ]
}
```

### POST /llm/alerts/:id/ack

Body:
```json
{
  "acknowledged_by": "admin@uptc.edu.co"
}
```

Response: Updated alert object

## Rules

### GET /llm/rules

Query params:
- `enabled`: true | false
- `sede_id`, `sector`: Filters

Response:
```json
{
  "rules": [
    {
      "id": 5,
      "name": "Alto consumo nocturno comedores",
      "description": "Detecta consumo fuera de horario...",
      "dsl": { /* DSL JSON */ },
      "enabled": true,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /llm/rules

Body:
```json
{
  "name": "Nueva regla",
  "description": "...",
  "dsl": {
    "type": "out_of_schedule",
    "scope": { "sede_id": "UPTC_TUN", "sector": "comedores" },
    "metric": "energiaTotal",
    "condition": { "gt": 120 },
    "severity": "critical",
    "messageTemplate": "..."
  }
}
```

### PUT /llm/rules/:id
### DELETE /llm/rules/:id

## Analytics

### GET /llm/analytics/anomalies

Query params:
- `sede_id` (optional)
- `metric` (default: energiaTotal)
- `hours` (default: 24)
- `threshold` (default: 3.0)

Response:
```json
{
  "anomalies": [
    {
      "timestamp": "2025-01-31T02:00:00Z",
      "sedeId": "UPTC_TUN",
      "sector": "comedores",
      "metric": "energiaTotal",
      "value": 245,
      "mean": 85,
      "stdDev": 20,
      "zScore": 4.2,
      "severity": "critical"
    }
  ],
  "totalReadings": 1440,
  "anomaliesCount": 1,
  "threshold": 3,
  "timeRange": {
    "from": "2025-01-30T00:00:00Z",
    "to": "2025-01-31T00:00:00Z"
  }
}
```

### GET /llm/analytics/forecast

Query params:
- `sede_id` (optional)
- `metric` (default: energiaTotal)
- `hours` (default: 24)
- `lookback_days` (default: 30)

### GET /llm/analytics/summary

Query params:
- `sede_id` (optional)

### GET /llm/analytics/baseline

Query params:
- `sede_id` (optional)
- `metric` (default: energiaTotal)
- `days` (default: 30)

## Recommendations

### POST /llm/recommendations/alerts/:id

Genera recomendación con RAG para una alerta.

Response:
```json
{
  "summary": "Revisar programación HVAC nocturno",
  "actions": [
    "Verificar horarios HVAC",
    "Auditar equipos cocina",
    "Implementar temporizadores"
  ],
  "expectedSavings": {
    "type": "heuristic",
    "value": "8-15%"
  },
  "why": [
    "60% consumo nocturno comedores es HVAC",
    "Temperatura no justifica climatización"
  ],
  "sources": [
    {
      "docId": 5,
      "title": "Guía eficiencia energética comedores.md"
    }
  ],
  "confidence": 0.85
}
```

## Knowledge Base

### GET /llm/docs
### POST /llm/docs

Create and list documents for indexing.

POST body:
```json
{
  "title": "Guia eficiencia energetica comedores",
  "content": "Texto del documento...",
  "file_path": "C:\\path\\to\\doc.txt",
  "sector": "comedores",
  "tags": ["hvac", "iluminacion"],
  "metadata": { "source": "manual" },
  "index": true
}
```

GET query params:
- `sector` (optional)
- `tags` (comma separated)
- `q` (search text)
- `indexed` (true|false)
- `limit`, `offset`

---

## Manual de Usuario

Flujo completo de creación y disparo de alertas:
- `docs/flujo-alertas-usuario.md`
