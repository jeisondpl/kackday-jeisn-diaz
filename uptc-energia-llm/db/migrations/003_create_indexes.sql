-- Migration 003: Create indexes for performance
SET search_path TO uptc_llm, public;

-- Rules indexes
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);
CREATE INDEX IF NOT EXISTS idx_rules_metric ON rules(metric);
CREATE INDEX IF NOT EXISTS idx_rules_scope ON rules USING gin(scope);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint ON alerts(fingerprint);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_sede ON alerts(sede_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sector ON alerts(sector);
CREATE INDEX IF NOT EXISTS idx_alerts_window ON alerts(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- Alert evidence indexes
CREATE INDEX IF NOT EXISTS idx_evidence_alert ON alert_evidence(alert_id);
CREATE INDEX IF NOT EXISTS idx_evidence_anomaly_score ON alert_evidence(anomaly_score);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_alert ON recommendations(alert_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at DESC);

-- Knowledge docs indexes
CREATE INDEX IF NOT EXISTS idx_docs_sector ON knowledge_docs(sector);
CREATE INDEX IF NOT EXISTS idx_docs_tags ON knowledge_docs USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_docs_indexed ON knowledge_docs(indexed_at);

-- Doc chunks indexes
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON doc_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Embeddings indexes (for vector similarity search)
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Actuators indexes
CREATE INDEX IF NOT EXISTS idx_actuators_sede_sector ON simulated_actuators(sede_id, sector);

-- Baselines indexes
CREATE INDEX IF NOT EXISTS idx_baselines_lookup ON baselines(sede_id, sector, metric, granularity, time_key);
CREATE INDEX IF NOT EXISTS idx_baselines_calculated ON baselines(last_calculated DESC);

-- Forecasts indexes
CREATE INDEX IF NOT EXISTS idx_forecasts_lookup ON forecasts(sede_id, sector, metric, forecast_time);
CREATE INDEX IF NOT EXISTS idx_forecasts_created ON forecasts(created_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
