/**
 * Domain Events - Represent things that have happened in the domain
 * These enable event-driven architecture and loose coupling
 */

export class DomainEvent {
  constructor(type, payload) {
    this.type = type;
    this.payload = payload;
    this.occurredAt = new Date();
    this.eventId = crypto.randomUUID();
  }

  toJSON() {
    return {
      eventId: this.eventId,
      type: this.type,
      payload: this.payload,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}

export class AlertTriggered extends DomainEvent {
  constructor(alert) {
    super('alert.triggered', {
      alertId: alert.id,
      ruleId: alert.ruleId,
      severity: alert.severity,
      scope: alert.scope,
    });
  }
}

export class AlertAcknowledged extends DomainEvent {
  constructor(alertId, acknowledgedBy) {
    super('alert.acknowledged', { alertId, acknowledgedBy });
  }
}

export class AlertResolved extends DomainEvent {
  constructor(alertId, resolvedBy) {
    super('alert.resolved', { alertId, resolvedBy });
  }
}

export class RuleCreated extends DomainEvent {
  constructor(rule) {
    super('rule.created', {
      ruleId: rule.id,
      metric: rule.metric,
      scope: rule.scope,
      severity: rule.severity,
    });
  }
}

export class RuleUpdated extends DomainEvent {
  constructor(ruleId, changes) {
    super('rule.updated', { ruleId, changes });
  }
}

export class RuleDeleted extends DomainEvent {
  constructor(ruleId) {
    super('rule.deleted', { ruleId });
  }
}

export class DocIndexed extends DomainEvent {
  constructor(docId, chunksCount) {
    super('doc.indexed', { docId, chunksCount });
  }
}

export class IngestionCompleted extends DomainEvent {
  constructor(recordsIngested, timeRange) {
    super('ingestion.completed', { recordsIngested, timeRange });
  }
}

export class EvaluationCompleted extends DomainEvent {
  constructor(rulesEvaluated, alertsTriggered) {
    super('evaluation.completed', { rulesEvaluated, alertsTriggered });
  }
}
