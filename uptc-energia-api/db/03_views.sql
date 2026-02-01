-- ==============================================================================
-- UPTC Energy Database Views
-- ==============================================================================

-- ==============================================================================
-- VIEW: Daily Energy Summary by Campus
-- ==============================================================================
CREATE OR REPLACE VIEW v_consumo_diario AS
SELECT
    sede_id,
    sede,
    DATE(timestamp) AS fecha,
    año,
    mes,
    trimestre,
    COUNT(*) AS num_lecturas,

    -- Total energy metrics
    ROUND(AVG(energia_total_kwh)::numeric, 2) AS energia_total_promedio_kwh,
    ROUND(SUM(energia_total_kwh)::numeric, 2) AS energia_total_suma_kwh,
    ROUND(MIN(energia_total_kwh)::numeric, 2) AS energia_total_min_kwh,
    ROUND(MAX(energia_total_kwh)::numeric, 2) AS energia_total_max_kwh,

    -- CO2 emissions
    ROUND(SUM(co2_kg)::numeric, 2) AS co2_total_kg,

    -- Water consumption
    ROUND(SUM(agua_litros)::numeric, 2) AS agua_total_litros,

    -- Contextual
    ROUND(AVG(temperatura_exterior_c)::numeric, 1) AS temp_promedio_c,
    ROUND(AVG(ocupacion_pct)::numeric, 1) AS ocupacion_promedio_pct,

    -- Flags
    BOOL_OR(es_fin_semana) AS incluye_fin_semana,
    BOOL_OR(es_festivo) AS incluye_festivo

FROM consumos
GROUP BY sede_id, sede, DATE(timestamp), año, mes, trimestre
ORDER BY fecha DESC, sede_id;

COMMENT ON VIEW v_consumo_diario IS 'Daily aggregated energy consumption metrics per campus';

-- ==============================================================================
-- VIEW: Energy Consumption by Sector
-- ==============================================================================
CREATE OR REPLACE VIEW v_consumo_por_sector AS
SELECT
    sede_id,
    sede,
    DATE(timestamp) AS fecha,

    -- Energy by sector (totals)
    ROUND(SUM(energia_comedor_kwh)::numeric, 2) AS energia_comedor_total_kwh,
    ROUND(SUM(energia_salones_kwh)::numeric, 2) AS energia_salones_total_kwh,
    ROUND(SUM(energia_laboratorios_kwh)::numeric, 2) AS energia_laboratorios_total_kwh,
    ROUND(SUM(energia_auditorios_kwh)::numeric, 2) AS energia_auditorios_total_kwh,
    ROUND(SUM(energia_oficinas_kwh)::numeric, 2) AS energia_oficinas_total_kwh,

    -- Percentage distribution
    ROUND(
        (SUM(energia_comedor_kwh) / NULLIF(SUM(energia_total_kwh), 0) * 100)::numeric,
        2
    ) AS pct_comedor,
    ROUND(
        (SUM(energia_salones_kwh) / NULLIF(SUM(energia_total_kwh), 0) * 100)::numeric,
        2
    ) AS pct_salones,
    ROUND(
        (SUM(energia_laboratorios_kwh) / NULLIF(SUM(energia_total_kwh), 0) * 100)::numeric,
        2
    ) AS pct_laboratorios,
    ROUND(
        (SUM(energia_auditorios_kwh) / NULLIF(SUM(energia_total_kwh), 0) * 100)::numeric,
        2
    ) AS pct_auditorios,
    ROUND(
        (SUM(energia_oficinas_kwh) / NULLIF(SUM(energia_total_kwh), 0) * 100)::numeric,
        2
    ) AS pct_oficinas

FROM consumos
GROUP BY sede_id, sede, DATE(timestamp)
ORDER BY fecha DESC, sede_id;

COMMENT ON VIEW v_consumo_por_sector IS 'Energy consumption breakdown by campus sector';

-- ==============================================================================
-- VIEW: Hourly Patterns (Average by Hour of Day)
-- ==============================================================================
CREATE OR REPLACE VIEW v_patron_horario AS
SELECT
    sede_id,
    sede,
    hora,
    dia_nombre,
    es_fin_semana,

    COUNT(*) AS num_lecturas,
    ROUND(AVG(energia_total_kwh)::numeric, 2) AS energia_promedio_kwh,
    ROUND(AVG(potencia_total_kw)::numeric, 2) AS potencia_promedio_kw,
    ROUND(AVG(ocupacion_pct)::numeric, 1) AS ocupacion_promedio_pct

FROM consumos
GROUP BY sede_id, sede, hora, dia_nombre, es_fin_semana
ORDER BY sede_id, hora;

COMMENT ON VIEW v_patron_horario IS 'Average energy consumption patterns by hour and day';

-- ==============================================================================
-- VIEW: Campus Overview with Stats
-- ==============================================================================
CREATE OR REPLACE VIEW v_sedes_con_stats AS
SELECT
    s.*,
    COUNT(c.reading_id) AS total_lecturas,
    MIN(c.timestamp) AS primera_lectura,
    MAX(c.timestamp) AS ultima_lectura,
    ROUND(AVG(c.energia_total_kwh)::numeric, 2) AS energia_promedio_kwh,
    ROUND(SUM(c.energia_total_kwh)::numeric, 2) AS energia_total_historica_kwh,
    ROUND(SUM(c.co2_kg)::numeric, 2) AS co2_total_historico_kg
FROM sedes s
LEFT JOIN consumos c ON s.sede_id = c.sede_id
GROUP BY s.sede_id, s.sede, s.nombre_completo, s.ciudad, s.area_m2,
         s.num_estudiantes, s.num_empleados, s.num_edificios,
         s.tiene_residencias, s.tiene_laboratorios_pesados,
         s.altitud_msnm, s.temp_promedio_c, s.pct_comedores,
         s.pct_salones, s.pct_laboratorios, s.pct_auditorios,
         s.pct_oficinas, s.created_at;

COMMENT ON VIEW v_sedes_con_stats IS 'Campus overview with historical consumption statistics';

-- ==============================================================================
-- VIEW: Academic Period Summary
-- ==============================================================================
CREATE OR REPLACE VIEW v_consumo_por_periodo AS
SELECT
    sede_id,
    sede,
    año,
    periodo_academico,

    COUNT(*) AS num_lecturas,
    ROUND(AVG(energia_total_kwh)::numeric, 2) AS energia_promedio_kwh,
    ROUND(SUM(energia_total_kwh)::numeric, 2) AS energia_total_kwh,
    ROUND(AVG(ocupacion_pct)::numeric, 1) AS ocupacion_promedio_pct,

    MIN(DATE(timestamp)) AS fecha_inicio,
    MAX(DATE(timestamp)) AS fecha_fin

FROM consumos
WHERE periodo_academico IS NOT NULL
GROUP BY sede_id, sede, año, periodo_academico
ORDER BY año DESC, sede_id, periodo_academico;

COMMENT ON VIEW v_consumo_por_periodo IS 'Energy consumption summary by academic period';
