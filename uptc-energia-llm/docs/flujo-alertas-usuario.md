# Flujo de Alertas (Manual de Usuario)

Este documento describe **cómo reporta el usuario**, **cómo se disparan las alertas** y **cómo validarlas** en el sistema `uptc-energia-llm`.

## 1) Conceptos clave

- **Regla**: Condición en DSL que define cuándo disparar una alerta.
- **Ingesta**: Proceso que trae lecturas desde la Energy API.
- **Evaluación**: Motor que aplica reglas sobre lecturas recientes.
- **Alerta**: Evento generado cuando una regla se cumple (con evidencia).
- **Explicación**: Detalle numérico y textual del porqué se disparó.
- **Recomendación**: Sugerencia IA basada en RAG y evidencia.

---

## 2) Flujo manual del usuario (paso a paso)

### Paso 1: Crear una regla
El usuario define la condición que disparará alertas.

**Endpoint**  
`POST /llm/rules`

**Ejemplo** (consumo alto fuera de horario):
```json
{
  "name": "Consumo alto fuera de horario - Comedores",
  "description": "Regla para consumo fuera de horario laboral",
  "dsl": {
    "type": "out_of_schedule",
    "scope": { "sede_id": "UPTC_TUN", "sector": "comedores" },
    "metric": "energiaTotal",
    "schedule": { "allowed": [{ "from": "06:00", "to": "21:00" }] },
    "condition": { "gt": 120 },
    "severity": "critical",
    "messageTemplate": "Consumo alto fuera de horario en {sector} ({value} kWh > {threshold})"
  },
  "enabled": true
}
```

---

### Paso 2: Ejecutar ingesta + evaluación
El usuario dispara manualmente el proceso que:
1) Trae lecturas recientes.
2) Evalúa reglas activas.

**Endpoint**  
`POST /llm/ingestion/run`

**Ejemplo**
```json
{
  "hours_back": 24,
  "evaluate_rules": true
}
```

---

### Paso 3: Ver alertas generadas
El usuario consulta las alertas que se dispararon.

**Endpoint**  
`GET /llm/alerts?status=open&severity=critical&limit=20`

---

### Paso 4: Revisar explicación de la alerta
El usuario puede ver evidencia numérica y razones.

**Endpoint**  
`GET /llm/alerts/:id/explanation`

Ejemplos de evidencia:
- Valor actual
- Baseline histórico
- Delta absoluto / porcentaje
- Anomaly score

---

### Paso 5: Generar recomendación IA (RAG)
El usuario solicita una recomendación basada en documentos de conocimiento.

**Endpoint**  
`POST /llm/recommendations/alerts/:id`

Respuesta incluye:
- Summary
- Actions
- Expected Savings
- Why
- Sources (docs)

---

### Paso 6: Acknowledge (reconocer alerta)
Cuando el usuario ya revisó la alerta:

**Endpoint**  
`POST /llm/alerts/:id/ack`

**Ejemplo**
```json
{
  "acknowledged_by": "admin@uptc.edu.co"
}
```

---

## 3) ¿Cómo se dispara una alerta?

Una alerta se dispara cuando:
1) Hay datos recientes disponibles (ingesta).
2) Una regla activa se cumple.

### Ejemplos de disparo

- **Fuera de horario**: consumo > umbral en hora no permitida.
- **Baseline relativo**: consumo actual > baseline + tolerancia.
- **Budget window**: consumo total supera presupuesto en ventana de tiempo.

### Idempotencia
Cada alerta tiene un **fingerprint** único, evitando duplicados si se evalúa varias veces el mismo rango.

---

## 4) Casos comunes de uso

✅ **Simular una alerta rápida**  
1. Crear regla con umbral muy bajo.  
2. Ejecutar ingesta + evaluación.  
3. Ver alertas.

✅ **Auditar alertas del día**  
1. Filtrar `/llm/alerts` por `from`/`to`.  
2. Revisar explicaciones.  
3. Generar recomendaciones.

---

## 5) Flujo resumido

1. **Crear regla**  
2. **Ingesta + Evaluación**  
3. **Alerta generada**  
4. **Explicación**  
5. **Recomendación**  
6. **Acknowledge**

---

## 6) Endpoints usados en el flujo

- `POST /llm/rules`
- `POST /llm/ingestion/run`
- `GET /llm/alerts`
- `GET /llm/alerts/:id/explanation`
- `POST /llm/recommendations/alerts/:id`
- `POST /llm/alerts/:id/ack`

