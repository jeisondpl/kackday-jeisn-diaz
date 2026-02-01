import { readFile } from 'fs/promises';
import { join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Running seeds...');

    const seedFile = join(process.cwd(), 'db', 'seeds', '001_example_rules.sql');
    const sql = await readFile(seedFile, 'utf-8');

    await client.query(sql);
    console.log('  ✓ 001_example_rules.sql completed');
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
