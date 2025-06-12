import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

// Minimal table definitions Better-Auth expects. We only care about types
// needed by the library, not actual columns (Kysely uses `unknown` for JSON).

export interface Database {
  ba_users: {
    id: string;
    email: string | null;
    email_verified: Date | null;
    created_at: Date;
    updated_at: Date;
  };
  ba_sessions: {
    id: string;
    user_id: string;
    expires: Date;
    created_at: Date;
    ip: string | null;
    user_agent: string | null;
  };
  ba_verification_tokens: {
    identifier: string;
    token: string;
    expires: Date;
  };
}

/**
 * Build a Kysely instance backed by pg Pool.
 */
export function createDb(connectionString: string) {
  const dialect = new PostgresDialect({
    pool: new pg.Pool({ connectionString })
  });
  return new Kysely<Database>({ dialect });
}
