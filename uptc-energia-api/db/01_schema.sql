-- ==============================================================================
-- UPTC Energy Database Schema
-- ==============================================================================

-- Drop existing tables
DROP TABLE IF EXISTS consumos CASCADE;
DROP TABLE IF EXISTS sedes CASCADE;

-- ==============================================================================
-- DIMENSION TABLE: Sedes
-- ==============================================================================
CREATE TABLE sedes (
    sede_id VARCHAR(20) PRIMARY KEY,
    sede VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    ciudad VARCHAR(50) NOT NULL,
    area_m2 INTEGER NOT NULL,
    num_estudiantes INTEGER NOT NULL,
    num_empleados INTEGER NOT NULL,
    num_edificios INTEGER NOT NULL,
    tiene_residencias BOOLEAN NOT NULL,
    tiene_laboratorios_pesados BOOLEAN NOT NULL,
    altitud_msnm INTEGER NOT NULL,
    temp_promedio_c NUMERIC(4,1) NOT NULL,
    pct_comedores NUMERIC(4,2) NOT NULL,
    pct_salones NUMERIC(4,2) NOT NULL,
    pct_laboratorios NUMERIC(4,2) NOT NULL,
    pct_auditorios NUMERIC(4,2) NOT NULL,
    pct_oficinas NUMERIC(4,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sedes IS 'Dimension table with metadata for each UPTC campus';
COMMENT ON COLUMN sedes.sede_id IS 'Primary key (e.g., UPTC_TUN)';
COMMENT ON COLUMN sedes.area_m2 IS 'Total campus area in square meters';
COMMENT ON COLUMN sedes.altitud_msnm IS 'Altitude in meters above sea level';
COMMENT ON COLUMN sedes.pct_comedores IS 'Percentage of area allocated to dining halls';

-- ==============================================================================
-- FACT TABLE: Consumos
-- ==============================================================================
CREATE TABLE consumos (
    reading_id BIGINT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    sede VARCHAR(50) NOT NULL,
    sede_id VARCHAR(20) NOT NULL REFERENCES sedes(sede_id),

    -- Energy metrics (total)
    energia_total_kwh DOUBLE PRECISION,
    potencia_total_kw DOUBLE PRECISION,
    co2_kg DOUBLE PRECISION,

    -- Energy by sector
    energia_comedor_kwh DOUBLE PRECISION,
    energia_salones_kwh DOUBLE PRECISION,
    energia_laboratorios_kwh DOUBLE PRECISION,
    energia_auditorios_kwh DOUBLE PRECISION,
    energia_oficinas_kwh DOUBLE PRECISION,

    -- Water and context
    agua_litros DOUBLE PRECISION,
    temperatura_exterior_c DOUBLE PRECISION,
    ocupacion_pct DOUBLE PRECISION,

    -- Temporal dimensions
    hora INTEGER NOT NULL CHECK (hora BETWEEN 0 AND 23),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    dia_nombre VARCHAR(20) NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
    año INTEGER NOT NULL CHECK (año >= 2018),
    periodo_academico VARCHAR(50),

    -- Boolean flags
    es_fin_semana BOOLEAN NOT NULL,
    es_festivo BOOLEAN NOT NULL,
    es_semana_parciales BOOLEAN NOT NULL,
    es_semana_finales BOOLEAN NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE consumos IS 'Fact table with hourly energy consumption readings';
COMMENT ON COLUMN consumos.reading_id IS 'Unique identifier for each reading';
COMMENT ON COLUMN consumos.timestamp IS 'Timestamp of the reading (hourly granularity)';
COMMENT ON COLUMN consumos.energia_total_kwh IS 'Total energy consumption in kWh (may contain outliers)';
COMMENT ON COLUMN consumos.co2_kg IS 'CO2 emissions in kg (may have missing values)';
COMMENT ON COLUMN consumos.dia_semana IS 'Day of week: 0=Monday, 6=Sunday';
COMMENT ON COLUMN consumos.periodo_academico IS 'Academic period (may have inconsistencies)';
