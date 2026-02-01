import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'uptc_energia',
  user: process.env.POSTGRES_USER || 'uptc_admin',
  password: process.env.POSTGRES_PASSWORD || 'uptc_password',
});

// CSV file paths (parent directory of project)
const CSV_DIR = path.resolve(process.cwd(), '..');
const SEDES_CSV = path.join(CSV_DIR, 'sedes_uptc.csv');
const CONSUMOS_CSV = path.join(CSV_DIR, 'consumos_uptc.csv');

/**
 * Parse boolean values from CSV
 */
function parseBoolean(value) {
  if (value === '' || value === null || value === undefined) return null;
  return value === 'True' || value === 'true' || value === '1' || value === 1;
}

/**
 * Parse numeric values, handling missing/empty values
 */
function parseNumeric(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse integer values
 */
function parseInt(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number.parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Load sedes from CSV
 */
async function loadSedes() {
  console.log('\n=== Loading Sedes ===');
  console.log(`Reading from: ${SEDES_CSV}`);

  const records = [];
  const parser = fs
    .createReadStream(SEDES_CSV)
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const record of parser) {
    records.push(record);
  }

  console.log(`Parsed ${records.length} sedes from CSV`);

  let inserted = 0;
  let updated = 0;

  for (const record of records) {
    const query = `
      INSERT INTO sedes (
        sede_id, sede, nombre_completo, ciudad,
        area_m2, num_estudiantes, num_empleados, num_edificios,
        tiene_residencias, tiene_laboratorios_pesados,
        altitud_msnm, temp_promedio_c,
        pct_comedores, pct_salones, pct_laboratorios,
        pct_auditorios, pct_oficinas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (sede_id) DO UPDATE SET
        sede = EXCLUDED.sede,
        nombre_completo = EXCLUDED.nombre_completo,
        ciudad = EXCLUDED.ciudad,
        area_m2 = EXCLUDED.area_m2,
        num_estudiantes = EXCLUDED.num_estudiantes,
        num_empleados = EXCLUDED.num_empleados,
        num_edificios = EXCLUDED.num_edificios,
        tiene_residencias = EXCLUDED.tiene_residencias,
        tiene_laboratorios_pesados = EXCLUDED.tiene_laboratorios_pesados,
        altitud_msnm = EXCLUDED.altitud_msnm,
        temp_promedio_c = EXCLUDED.temp_promedio_c,
        pct_comedores = EXCLUDED.pct_comedores,
        pct_salones = EXCLUDED.pct_salones,
        pct_laboratorios = EXCLUDED.pct_laboratorios,
        pct_auditorios = EXCLUDED.pct_auditorios,
        pct_oficinas = EXCLUDED.pct_oficinas
      RETURNING (xmax = 0) AS inserted
    `;

    const values = [
      record.sede_id,
      record.sede,
      record.nombre_completo,
      record.ciudad,
      Number.parseInt(record.area_m2, 10),
      Number.parseInt(record.num_estudiantes, 10),
      Number.parseInt(record.num_empleados, 10),
      Number.parseInt(record.num_edificios, 10),
      parseBoolean(record.tiene_residencias),
      parseBoolean(record.tiene_laboratorios_pesados),
      Number.parseInt(record.altitud_msnm, 10),
      parseFloat(record.temp_promedio_c),
      parseFloat(record.pct_comedores),
      parseFloat(record.pct_salones),
      parseFloat(record.pct_laboratorios),
      parseFloat(record.pct_auditorios),
      parseFloat(record.pct_oficinas),
    ];

    try {
      const result = await pool.query(query, values);
      if (result.rows[0].inserted) {
        inserted++;
      } else {
        updated++;
      }
    } catch (error) {
      console.error(`Error loading sede ${record.sede_id}:`, error.message);
    }
  }

  console.log(`✓ Sedes loaded: ${inserted} inserted, ${updated} updated`);
}

/**
 * Load consumos from CSV in batches
 */
async function loadConsumos() {
  console.log('\n=== Loading Consumos ===');
  console.log(`Reading from: ${CONSUMOS_CSV}`);

  const BATCH_SIZE = 2000;
  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  const parser = fs
    .createReadStream(CONSUMOS_CSV)
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  async function processBatch(records) {
    if (records.length === 0) return;

    const query = `
      INSERT INTO consumos (
        reading_id, timestamp, sede, sede_id,
        energia_total_kwh, energia_comedor_kwh, energia_salones_kwh,
        energia_laboratorios_kwh, energia_auditorios_kwh, energia_oficinas_kwh,
        potencia_total_kw, agua_litros, temperatura_exterior_c, ocupacion_pct,
        hora, dia_semana, dia_nombre, mes, trimestre, año, periodo_academico,
        es_fin_semana, es_festivo, es_semana_parciales, es_semana_finales, co2_kg
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (sede_id, timestamp) DO UPDATE SET
        energia_total_kwh = EXCLUDED.energia_total_kwh,
        energia_comedor_kwh = EXCLUDED.energia_comedor_kwh,
        energia_salones_kwh = EXCLUDED.energia_salones_kwh,
        energia_laboratorios_kwh = EXCLUDED.energia_laboratorios_kwh,
        energia_auditorios_kwh = EXCLUDED.energia_auditorios_kwh,
        energia_oficinas_kwh = EXCLUDED.energia_oficinas_kwh,
        potencia_total_kw = EXCLUDED.potencia_total_kw,
        agua_litros = EXCLUDED.agua_litros,
        temperatura_exterior_c = EXCLUDED.temperatura_exterior_c,
        ocupacion_pct = EXCLUDED.ocupacion_pct,
        co2_kg = EXCLUDED.co2_kg
      RETURNING (xmax = 0) AS inserted
    `;

    for (const record of records) {
      const values = [
        Number.parseInt(record.reading_id, 10),
        record.timestamp,
        record.sede,
        record.sede_id,
        parseNumeric(record.energia_total_kwh),
        parseNumeric(record.energia_comedor_kwh),
        parseNumeric(record.energia_salones_kwh),
        parseNumeric(record.energia_laboratorios_kwh),
        parseNumeric(record.energia_auditorios_kwh),
        parseNumeric(record.energia_oficinas_kwh),
        parseNumeric(record.potencia_total_kw),
        parseNumeric(record.agua_litros),
        parseNumeric(record.temperatura_exterior_c),
        parseNumeric(record.ocupacion_pct),
        Number.parseInt(record.hora, 10),
        Number.parseInt(record.dia_semana, 10),
        record.dia_nombre,
        Number.parseInt(record.mes, 10),
        Number.parseInt(record.trimestre, 10),
        Number.parseInt(record.año, 10),
        record.periodo_academico || null,
        parseBoolean(record.es_fin_semana),
        parseBoolean(record.es_festivo),
        parseBoolean(record.es_semana_parciales),
        parseBoolean(record.es_semana_finales),
        parseNumeric(record.co2_kg),
      ];

      try {
        const result = await pool.query(query, values);
        if (result.rows[0].inserted) {
          totalInserted++;
        } else {
          totalUpdated++;
        }
      } catch (error) {
        totalErrors++;
        if (totalErrors <= 5) {
          console.error(
            `Error loading reading ${record.reading_id}:`,
            error.message
          );
        }
      }

      totalProcessed++;
      if (totalProcessed % 10000 === 0) {
        console.log(`  Progress: ${totalProcessed.toLocaleString()} records processed`);
      }
    }
  }

  for await (const record of parser) {
    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  // Process remaining records
  if (batch.length > 0) {
    await processBatch(batch);
  }

  console.log(`✓ Consumos loaded: ${totalProcessed.toLocaleString()} total`);
  console.log(`  - ${totalInserted.toLocaleString()} inserted`);
  console.log(`  - ${totalUpdated.toLocaleString()} updated`);
  if (totalErrors > 0) {
    console.log(`  - ${totalErrors.toLocaleString()} errors`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  UPTC Energy Data Loader              ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    // Test database connection
    console.log('\nTesting database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected');

    // Load data
    await loadSedes();
    await loadConsumos();

    // Update statistics
    console.log('\nUpdating database statistics...');
    await pool.query('ANALYZE sedes');
    await pool.query('ANALYZE consumos');
    console.log('✓ Statistics updated');

    // Summary
    console.log('\n=== Summary ===');
    const sedesCount = await pool.query('SELECT COUNT(*) FROM sedes');
    const consumosCount = await pool.query('SELECT COUNT(*) FROM consumos');
    const dateRange = await pool.query(
      'SELECT MIN(timestamp) as min_date, MAX(timestamp) as max_date FROM consumos'
    );

    console.log(`Sedes in database: ${sedesCount.rows[0].count}`);
    console.log(`Consumos in database: ${Number(consumosCount.rows[0].count).toLocaleString()}`);
    console.log(
      `Date range: ${dateRange.rows[0].min_date} to ${dateRange.rows[0].max_date}`
    );

    console.log('\n✓ Data loading completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
