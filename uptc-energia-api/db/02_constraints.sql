-- ==============================================================================
-- UPTC Energy Database Indexes and Constraints
-- ==============================================================================

-- ==============================================================================
-- INDEXES for Query Performance
-- ==============================================================================

-- Time-based queries (most common access pattern)
CREATE INDEX idx_consumos_timestamp ON consumos(timestamp DESC);
CREATE INDEX idx_consumos_sede_timestamp ON consumos(sede_id, timestamp DESC);

-- Sede filtering
CREATE INDEX idx_consumos_sede_id ON consumos(sede_id);

-- Date part queries
CREATE INDEX idx_consumos_year_month ON consumos(año, mes);
CREATE INDEX idx_consumos_dia_semana ON consumos(dia_semana);

-- Period-based analysis
CREATE INDEX idx_consumos_periodo ON consumos(periodo_academico) WHERE periodo_academico IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX idx_consumos_sede_year_month ON consumos(sede_id, año, mes);
CREATE INDEX idx_consumos_weekend_festivo ON consumos(es_fin_semana, es_festivo);

-- ==============================================================================
-- ADDITIONAL CONSTRAINTS
-- ==============================================================================

-- Ensure sede consistency between tables
ALTER TABLE consumos
    ADD CONSTRAINT fk_consumos_sede
    FOREIGN KEY (sede_id) REFERENCES sedes(sede_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ensure timestamp uniqueness per sede (prevent duplicate readings)
CREATE UNIQUE INDEX idx_unique_sede_timestamp ON consumos(sede_id, timestamp);

-- ==============================================================================
-- PERFORMANCE STATISTICS
-- ==============================================================================

-- Update table statistics for query planner
ANALYZE sedes;
ANALYZE consumos;
