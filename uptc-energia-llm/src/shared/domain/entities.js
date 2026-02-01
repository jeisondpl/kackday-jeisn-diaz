/**
 * Domain Entities - Core business objects with identity
 * No framework dependencies
 */

import { SedeRef, Sector, Severity, AlertStatus, TimeWindow, Schedule } from './value-objects.js';

export class SensorReading {
  constructor({
    timestamp,
    sedeId,
    sector,
    energiaKwh,
    potenciaKw,
    aguaLitros,
    co2Kg,
    temperaturaExteriorC,
    ocupacionPct,
  }) {
    this.timestamp = new Date(timestamp);
    this.sedeId = sedeId;
    this.sector = sector ? Sector.validate(sector) : null;
    this.energiaKwh = energiaKwh;
    this.potenciaKw = potenciaKw;
    this.aguaLitros = aguaLitros;
    this.co2Kg = co2Kg;
    this.temperaturaExteriorC = temperaturaExteriorC;
    this.ocupacionPct = ocupacionPct;
  }

  toJSON() {
    return {
      timestamp: this.timestamp.toISOString(),
      sedeId: this.sedeId,
      sector: this.sector,
      energiaKwh: this.energiaKwh,
      potenciaKw: this.potenciaKw,
      aguaLitros: this.aguaLitros,
      co2Kg: this.co2Kg,
      temperaturaExteriorC: this.temperaturaExteriorC,
      ocupacionPct: this.ocupacionPct,
    };
  }
}

export class Policy {
  constructor({ id, sedeId, sector, horarios, presupuestos, tolerancias, createdAt }) {
    this.id = id;
    this.sedeId = sedeId;
    this.sector = sector ? Sector.validate(sector) : null;
    this.horarios = horarios || {};
    this.presupuestos = presupuestos || {};
    this.tolerancias = tolerancias || {};
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }
}

export class Rule {
  constructor({ id, dslJson, scope, metric, severity, enabled = true, createdAt, updatedAt }) {
    this.id = id;
    this.dslJson = dslJson; // DSL as JSON object
    this.scope = scope; // { sedeId?, sector? }
    this.metric = metric; // 'energia_kwh', 'agua_litros', etc.
    this.severity = Severity.validate(severity);
    this.enabled = enabled;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
  }

  disable() {
    this.enabled = false;
    this.updatedAt = new Date();
  }

  enable() {
    this.enabled = true;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      dslJson: this.dslJson,
      scope: this.scope,
      metric: this.metric,
      severity: this.severity,
      enabled: this.enabled,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export class Alert {
  constructor({
    id,
    ruleId,
    status,
    severity,
    message,
    fingerprint,
    scope,
    windowStart,
    windowEnd,
    evidenceId,
    createdAt,
    acknowledgedAt,
    resolvedAt,
  }) {
    this.id = id;
    this.ruleId = ruleId;
    this.status = AlertStatus.validate(status);
    this.severity = Severity.validate(severity);
    this.message = message;
    this.fingerprint = fingerprint;
    this.scope = scope; // { sedeId?, sector? }
    this.windowStart = windowStart ? new Date(windowStart) : null;
    this.windowEnd = windowEnd ? new Date(windowEnd) : null;
    this.evidenceId = evidenceId;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.acknowledgedAt = acknowledgedAt ? new Date(acknowledgedAt) : null;
    this.resolvedAt = resolvedAt ? new Date(resolvedAt) : null;
  }

  acknowledge() {
    if (this.status !== AlertStatus.OPEN) {
      throw new Error('Only OPEN alerts can be acknowledged');
    }
    this.status = AlertStatus.ACKNOWLEDGED;
    this.acknowledgedAt = new Date();
  }

  resolve() {
    if (this.status === AlertStatus.RESOLVED) {
      throw new Error('Alert is already resolved');
    }
    this.status = AlertStatus.RESOLVED;
    this.resolvedAt = new Date();
  }

  dismiss() {
    this.status = AlertStatus.DISMISSED;
  }

  toJSON() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      status: this.status,
      severity: this.severity,
      message: this.message,
      fingerprint: this.fingerprint,
      scope: this.scope,
      windowStart: this.windowStart?.toISOString(),
      windowEnd: this.windowEnd?.toISOString(),
      evidenceId: this.evidenceId,
      createdAt: this.createdAt.toISOString(),
      acknowledgedAt: this.acknowledgedAt?.toISOString(),
      resolvedAt: this.resolvedAt?.toISOString(),
    };
  }
}

export class Evidence {
  constructor({ id, alertId, values, baseline, delta, anomalyScore, forecast, metadata }) {
    this.id = id;
    this.alertId = alertId;
    this.values = values; // actual readings
    this.baseline = baseline; // expected/baseline values
    this.delta = delta; // difference
    this.anomalyScore = anomalyScore;
    this.forecast = forecast; // predicted values
    this.metadata = metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      alertId: this.alertId,
      values: this.values,
      baseline: this.baseline,
      delta: this.delta,
      anomalyScore: this.anomalyScore,
      forecast: this.forecast,
      metadata: this.metadata,
    };
  }
}

export class Recommendation {
  constructor({ id, alertId, summary, actions, expectedSavings, why, sources, createdAt }) {
    this.id = id;
    this.alertId = alertId;
    this.summary = summary;
    this.actions = actions || [];
    this.expectedSavings = expectedSavings; // { type: 'heuristic', value: '5-12%' }
    this.why = why || [];
    this.sources = sources || []; // [{ docId, title, chunkId }]
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  toJSON() {
    return {
      id: this.id,
      alertId: this.alertId,
      summary: this.summary,
      actions: this.actions,
      expectedSavings: this.expectedSavings,
      why: this.why,
      sources: this.sources,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

export class KnowledgeDoc {
  constructor({ id, title, filePath, metadata, sector, tags, createdAt, indexedAt }) {
    this.id = id;
    this.title = title;
    this.filePath = filePath;
    this.metadata = metadata || {};
    this.sector = sector ? Sector.validate(sector) : null;
    this.tags = tags || [];
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.indexedAt = indexedAt ? new Date(indexedAt) : null;
  }

  markIndexed() {
    this.indexedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      filePath: this.filePath,
      metadata: this.metadata,
      sector: this.sector,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
      indexedAt: this.indexedAt?.toISOString(),
    };
  }
}

export class DocChunk {
  constructor({ id, docId, text, chunkIndex, embeddingRef, metadata }) {
    this.id = id;
    this.docId = docId;
    this.text = text;
    this.chunkIndex = chunkIndex;
    this.embeddingRef = embeddingRef;
    this.metadata = metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      docId: this.docId,
      text: this.text,
      chunkIndex: this.chunkIndex,
      embeddingRef: this.embeddingRef,
      metadata: this.metadata,
    };
  }
}
