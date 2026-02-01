/**
 * Database Migration Script
 * Runs all SQL migration files in order
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from '../src/shared/infrastructure/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

async function runMigrations() {
  const pool = getPool();
  console.log('🔄 Starting database migrations...\n');

  try {
    // Read all migration files
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('⚠️  No migration files found in', MIGRATIONS_DIR);
      return;
    }

    console.log(`Found ${sqlFiles.length} migration file(s):\n`);

    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`📄 Running: ${file}`);

      const sql = await fs.readFile(filePath, 'utf-8');

      try {
        await pool.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;
