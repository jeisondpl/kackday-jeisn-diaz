import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Running migrations...');
    
    const migrationsDir = join(process.cwd(), 'db', 'migrations');
    const files = (await readdir(migrationsDir))
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`  Executing ${file}...`);
      const sql = await readFile(join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`  ✓ ${file} completed`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
