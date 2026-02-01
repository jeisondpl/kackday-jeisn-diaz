# Rules DSL Reference

## Estructura Base

```typescript
{
  type: RuleType,
  scope: { sedeId?, sector? },
  metric: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  messageTemplate: string,
  // Campos específicos por tipo...
}
```

## Tipos de Reglas

### 1. absolute_threshold

Valor supera umbral absoluto.

```json
{
  "type": "absolute_threshold",
  "scope": { "sedeId": "UPTC_TUN", "sector": "laboratorios" },
  "metric": "energia_kwh",
  "condition": { "gt": 200 },
  "severity": "high",
  "messageTemplate": "{sector} consumo {value} kWh > {threshold}"
}
```

### 2. out_of_schedule

Consumo fuera de horario permitido.

```json
{
  "type": "out_of_schedule",
  "scope": { "sedeId": "UPTC_TUN", "sector": "comedores" },
  "metric": "energia_kwh",
  "schedule": {
    "allowed": [
      { "from": "06:00", "to": "21:00" }
    ]
  },
  "condition": { "gt": 120 },
  "severity": "critical",
  "messageTemplate": "Consumo fuera de horario en {sector}: {value} kWh > {threshold}",
  "actions": [
    "Revisar HVAC",
    "Validar iluminación",
    "Verificar equipos standby"
  ]
}
```

### 3. baseline_relative

Desviación del baseline histórico.

```json
{
  "type": "baseline_relative",
  "scope": { "sector": "laboratorios" },
  "metric": "energia_kwh",
  "window": {
    "granularity": "hour",
    "lookbackHours": 24
  },
  "baseline": {
    "tolerance_pct": 25
  },
  "severity": "high",
  "messageTemplate": "{sector} {value} kWh supera baseline {baseline} en {tolerance_pct}%",
  "actions": [
    "Revisar equipos laboratorio",
    "Validar calibración",
    "Verificar procesos en curso"
  ]
}
```

### 4. budget_window

Excede presupuesto en ventana temporal.

```json
{
  "type": "budget_window",
  "scope": { "sedeId": "UPTC_SOG" },
  "metric": "energia_kwh",
  "budget": {
    "amount": 50000,
    "period": "monthly"
  },
  "severity": "medium",
  "messageTemplate": "Presupuesto mensual excedido: {accumulated} kWh > {budget}"
}
```

### 5. forecast_breach

Predicción supera umbral.

```json
{
  "type": "forecast_breach",
  "scope": { "sedeId": "UPTC_DUI" },
  "metric": "energia_kwh",
  "window": {
    "granularity": "day"
  },
  "condition": { "gt": 15000 },
  "severity": "medium",
  "messageTemplate": "Forecast {forecast_value} kWh para mañana > {threshold}"
}
```

### 6. anomaly_score

Score de anomalía supera umbral.

```json
{
  "type": "anomaly_score",
  "scope": { "sector": "oficinas" },
  "metric": "energia_kwh",
  "condition": { "gt": 3.0 },
  "severity": "high",
  "messageTemplate": "Anomalía detectada en {sector}: z-score {anomaly_score}"
}
```

## Validación

Todas las reglas se validan con Zod antes de guardar.

Campos requeridos:
- `type`, `metric`, `severity`, `messageTemplate`

Campos opcionales:
- `scope` (si vacío = aplica a todo)
- `actions` (array de strings)
- `window` (para reglas temporales)

## Variables en messageTemplate

Disponibles:
- `{sector}`, `{sede}`, `{metric}`
- `{value}`, `{threshold}`, `{baseline}`
- `{tolerance_pct}`, `{anomaly_score}`
- `{forecast_value}`, `{accumulated}`, `{budget}`
