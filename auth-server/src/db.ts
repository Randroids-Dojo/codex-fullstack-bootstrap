import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: env.DATABASE_URL });

// ---------------------------------------------------------------- utility --

/**
 * Create the core Better-Auth tables if they don't exist.  We keep the SQL in
 * one place so local `docker compose up` works without a separate migration
 * step.  In production you SHOULD use proper migrations (e.g. drizzle-kit or
 * Alembic on the Python side).
 */
export async function initDb() {
  // USERS --------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ACCOUNTS -----------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      password TEXT,
      scope TEXT,
      refresh_token TEXT,
      access_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider_id, account_id)
    );
  `);

  // SESSIONS -----------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sessions_user_expires_idx ON sessions(user_id, expires_at);
  `);

  // VERIFICATION TOKENS -----------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // JWKS (for JWT plugin) ---------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jwks (
      id TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
