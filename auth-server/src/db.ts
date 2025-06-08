import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({ connectionString: env.DATABASE_URL });

// Ensure the users table exists with the columns we need. We run the DDL once on
// startup – simple and acceptable for a demo. In production use migrations.
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      sub TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      name TEXT,
      password_hash TEXT NOT NULL
    );
  `);

  // In case the table already exists but was created before password_hash column
  // was introduced, make sure the column exists (no-op if it does).
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
}

export { pool };
