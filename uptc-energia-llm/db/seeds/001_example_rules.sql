-- Seed: Example rules
SET search_path TO uptc_llm, public;

-- Rule 1: Out of schedule - Comedores
INSERT INTO rules (name, description, dsl_json, scope, metric, severity, enabled) VALUES (
  'Alto consumo nocturno comedores',
  'Detecta consumo energético alto fuera del horario de servicio en comedores',
  '{
    "type": "out_of_schedule",
    "scope": {"sector": "comedores"},
    "metric": "energia_kwh",
    "window": {"granularity": "hour", "lookbackHours": 24},
    "schedule": {"allowed": [{"from": "06:00", "to": "21:00"}]},
    "condition": {"gt": 120},
    "severity": "critical",
    "messageTemplate": "Consumo alto fuera de horario en {sector}: {value} kWh > {threshold} kWh",
    "actions": ["Revisar HVAC", "Validar iluminación", "Verificar equipos standby"]
  }'::jsonb,
  '{"sector": "comedores"}'::jsonb,
  'energia_kwh',
  'critical',
  true
) ON CONFLICT DO NOTHING;

-- Rule 2: Baseline relative - Laboratorios
INSERT INTO rules (name, description, dsl_json, scope, metric, severity, enabled) VALUES (
  'Desviación baseline laboratorios',
  'Alerta cuando el consumo se desvía significativamente del baseline histórico en laboratorios',
  '{
    "type": "baseline_relative",
    "scope": {"sector": "laboratorios"},
    "metric": "energia_kwh",
    "window": {"granularity": "hour", "lookbackHours": 24},
    "baseline": {"tolerance_pct": 25},
    "severity": "high",
    "messageTemplate": "Consumo {value} kWh en {sector} supera baseline {baseline} kWh en {tolerance_pct}%",
    "actions": ["Revisar equipos laboratorio", "Validar calibración", "Verificar procesos"]
  }'::jsonb,
  '{"sector": "laboratorios"}'::jsonb,
  'energia_kwh',
  'high',
  true
) ON CONFLICT DO NOTHING;

-- Rule 3: Absolute threshold - Salones fin de semana
INSERT INTO rules (name, description, dsl_json, scope, metric, severity, enabled) VALUES (
  'Consumo alto salones fin de semana',
  'Detecta consumo anormalmente alto en salones durante fines de semana',
  '{
    "type": "absolute_threshold",
    "scope": {"sector": "salones"},
    "metric": "energia_kwh",
    "condition": {"gt": 150},
    "severity": "medium",
    "messageTemplate": "Consumo de {value} kWh en {sector} durante fin de semana (umbral: {threshold} kWh)"
  }'::jsonb,
  '{"sector": "salones"}'::jsonb,
  'energia_kwh',
  'medium',
  true
) ON CONFLICT DO NOTHING;
