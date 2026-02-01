/**
 * Ports (Interfaces) for Hexagonal Architecture
 * These define the contracts that adapters must implement
 * Domain depends on these abstractions, not concrete implementations
 */

// ============================================================================
// External Services Ports
// ============================================================================

export class EnergyApiPort {
  async getHealth() {
    throw new Error('Not implemented');
  }

  async getSedes(withStats = false) {
    throw new Error('Not implemented');
  }

  async getSede(sedeId) {
    throw new Error('Not implemented');
  }

  async getConsumos(filters = {}) {
    throw new Error('Not implemented');
  }

  async getStatsDiario(filters = {}) {
    throw new Error('Not implemented');
  }

  async getStatsSector(filters = {}) {
    throw new Error('Not implemented');
  }

  async getStatsHorario(filters = {}) {
    throw new Error('Not implemented');
  }

  async getStatsPeriodo(filters = {}) {
    throw new Error('Not implemented');
  }

  async getStatsSummary(filters = {}) {
    throw new Error('Not implemented');
  }
}

// ============================================================================
// Repository Ports
// ============================================================================

export class RulesRepositoryPort {
  async findAll() {
    throw new Error('Not implemented');
  }

  async findById(id) {
    throw new Error('Not implemented');
  }

  async findByScope(scope) {
    throw new Error('Not implemented');
  }

  async save(rule) {
    throw new Error('Not implemented');
  }

  async update(id, rule) {
    throw new Error('Not implemented');
  }

  async delete(id) {
    throw new Error('Not implemented');
  }
}

export class AlertsRepositoryPort {
  async findAll(filters = {}) {
    throw new Error('Not implemented');
  }

  async findById(id) {
    throw new Error('Not implemented');
  }

  async findByFingerprint(fingerprint) {
    throw new Error('Not implemented');
  }

  async save(alert) {
    throw new Error('Not implemented');
  }

  async update(id, alert) {
    throw new Error('Not implemented');
  }

  async saveEvidence(evidence) {
    throw new Error('Not implemented');
  }

  async getEvidence(alertId) {
    throw new Error('Not implemented');
  }
}

export class KnowledgeRepositoryPort {
  async findAllDocs() {
    throw new Error('Not implemented');
  }

  async findDocById(id) {
    throw new Error('Not implemented');
  }

  async saveDoc(doc) {
    throw new Error('Not implemented');
  }

  async updateDoc(id, doc) {
    throw new Error('Not implemented');
  }

  async deleteDoc(id) {
    throw new Error('Not implemented');
  }

  async saveChunk(chunk) {
    throw new Error('Not implemented');
  }

  async findChunksByDocId(docId) {
    throw new Error('Not implemented');
  }

  async deleteChunksByDocId(docId) {
    throw new Error('Not implemented');
  }
}

export class RecommendationsRepositoryPort {
  async findByAlertId(alertId) {
    throw new Error('Not implemented');
  }

  async save(recommendation) {
    throw new Error('Not implemented');
  }
}

// ============================================================================
// AI/ML Ports
// ============================================================================

export class VectorStorePort {
  async addDocuments(documents) {
    throw new Error('Not implemented');
  }

  async similaritySearch(query, k = 5, filter = {}) {
    throw new Error('Not implemented');
  }

  async deleteByDocId(docId) {
    throw new Error('Not implemented');
  }
}

export class EmbeddingsPort {
  async embedQuery(text) {
    throw new Error('Not implemented');
  }

  async embedDocuments(texts) {
    throw new Error('Not implemented');
  }
}

export class LLMPort {
  async generate(prompt, options = {}) {
    throw new Error('Not implemented');
  }

  async generateStructured(prompt, schema, options = {}) {
    throw new Error('Not implemented');
  }
}

// ============================================================================
// Infrastructure Ports
// ============================================================================

export class SchedulerPort {
  schedule(cronExpression, callback, name) {
    throw new Error('Not implemented');
  }

  stop(name) {
    throw new Error('Not implemented');
  }

  stopAll() {
    throw new Error('Not implemented');
  }
}

export class ClockPort {
  now() {
    return new Date();
  }

  nowISO() {
    return new Date().toISOString();
  }
}

// ============================================================================
// Event Bus Port (optional for future)
// ============================================================================

export class EventBusPort {
  async publish(event) {
    throw new Error('Not implemented');
  }

  subscribe(eventType, handler) {
    throw new Error('Not implemented');
  }

  unsubscribe(eventType, handler) {
    throw new Error('Not implemented');
  }
}
