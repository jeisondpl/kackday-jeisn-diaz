-- Migration 002: Create core tables
SET search_path TO uptc_llm, public;

-- =====================================================
-- RULES & POLICIES
-- =====================================================

CREATE TABLE IF NOT EXISTS rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dsl_json JSONB NOT NULL, -- DSL rule definition
    scope JSONB NOT NULL, -- {sede_id, sector}
    metric VARCHAR(100) NOT NULL, -- energia_kwh, agua, etc.
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    sede_id VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    horarios JSONB, -- {allowed: [{from, to}]}
    presupuestos JSONB, -- {diario, mensual, por_franja}
    tolerancias JSONB, -- {baseline_pct, anomaly_threshold}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sede_id, sector)
);

-- =====================================================
-- ALERTS & EVIDENCE
-- =====================================================

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL, -- deduplication key
    rule_id INTEGER REFERENCES rules(id) ON DELETE SET NULL,
    sede_id VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    metric VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
    message TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_evidence (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    values JSONB NOT NULL,
    baseline JSONB,
    delta JSONB,
    anomaly_score NUMERIC,
    forecast JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RECOMMENDATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    actions JSONB NOT NULL, -- array of action strings
    expected_savings JSONB, -- {type: 'heuristic', value: '5-12%'}
    why JSONB, -- array of explanation strings
    sources JSONB, -- array of {docId, title, chunk_id}
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- KNOWLEDGE BASE (RAG)
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_docs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT,
    content_type VARCHAR(100), -- md, txt, pdf
    sector VARCHAR(100), -- null means global
    tags TEXT[] DEFAULT '{}',
    metadata JSONB,
    indexed BOOLEAN DEFAULT false,
    chunks_count INTEGER DEFAULT 0,
    indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doc_chunks (
    id SERIAL PRIMARY KEY,
    doc_id INTEGER NOT NULL REFERENCES knowledge_docs(id) ON DELETE CASCADE,
    chunk_index INTEGER DEFAULT 0,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doc_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    chunk_id INTEGER NOT NULL REFERENCES doc_chunks(id) ON DELETE CASCADE,
    embedding vector(768), -- adjust dimension based on model
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chunk_id)
);

-- =====================================================
-- SIMULATED ACTUATORS (Optional - for domotic simulation)
-- =====================================================

CREATE TABLE IF NOT EXISTS simulated_actuators (
    id SERIAL PRIMARY KEY,
    sede_id VARCHAR(50) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    actuator_type VARCHAR(100) NOT NULL, -- hvac, lighting, refrigeration, lab_equipment
    state JSONB NOT NULL, -- {on: bool, power_pct: number, mode: string, ...}
    last_action JSONB, -- {action: string, reason: string, triggered_by: alert_id}
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sede_id, sector, actuator_type)
);

-- =====================================================
-- ANALYTICS & BASELINE
-- =====================================================

CREATE TABLE IF NOT EXISTS baselines (
    id SERIAL PRIMARY KEY,
    sede_id VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    metric VARCHAR(100) NOT NULL,
    granularity VARCHAR(20) NOT NULL, -- hour, day, week
    time_key VARCHAR(50) NOT NULL, -- e.g., "Monday-09", "2025-01-15"
    baseline_value NUMERIC NOT NULL,
    std_dev NUMERIC,
    sample_count INTEGER,
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sede_id, sector, metric, granularity, time_key)
);

CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    sede_id VARCHAR(50) NOT NULL,
    sector VARCHAR(100),
    metric VARCHAR(100) NOT NULL,
    forecast_time TIMESTAMPTZ NOT NULL,
    forecast_value NUMERIC NOT NULL,
    lower_bound NUMERIC,
    upper_bound NUMERIC,
    confidence NUMERIC,
    model_type VARCHAR(50), -- simple_baseline, moving_average, arima
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- rule, alert, policy, doc
    entity_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, acknowledged
    actor VARCHAR(255),
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rules IS 'Rule definitions in DSL JSON format';
COMMENT ON TABLE policies IS 'Configurable policies for each sede/sector';
COMMENT ON TABLE alerts IS 'Generated alerts with deduplication';
COMMENT ON TABLE alert_evidence IS 'Numerical evidence supporting each alert';
COMMENT ON TABLE recommendations IS 'AI-generated recommendations with RAG sources';
COMMENT ON TABLE knowledge_docs IS 'Uploaded knowledge base documents';
COMMENT ON TABLE doc_chunks IS 'Text chunks for RAG retrieval';
COMMENT ON TABLE embeddings IS 'Vector embeddings for semantic search';
COMMENT ON TABLE simulated_actuators IS 'Simulated domotic actuator states';
COMMENT ON TABLE baselines IS 'Historical baseline values for anomaly detection';
COMMENT ON TABLE forecasts IS 'Predicted future values';
COMMENT ON TABLE audit_log IS 'Audit trail for all changes';
