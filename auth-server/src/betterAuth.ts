/*
 * Better-Auth bootstrap for the Express auth-server.
 *
 * This file wires up:
 *  – a Drizzle-ORM Postgres client (shared Pool with the rest of the app)
 *  – the official Drizzle adapter from Better-Auth
 *  – the built-in email/password provider (sign-up + sign-in)
 *  – the JWT plugin so downstream services can verify a Bearer token
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt } from 'better-auth/plugins/jwt';

import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from './env.js';
import * as schema from './schema.js';
import { pool } from './db.js';

// --- Database -------------------------------------------------------------

// Drizzle client reuses the global pg.Pool created in db.ts
const db = drizzle(pool, { schema });

// Adapter – gives Better-Auth persistence in Postgres via Drizzle.
const database = drizzleAdapter(db, {
  provider: 'pg',
  schema,
  // We already expose both singular and plural table names in schema.ts. Enabling
  // Drizzle's `usePlural` option causes double-pluralization for names that are
  // already plural (e.g. `jwks` → `jwkss`). This breaks the JWT plugin which
  // expects the model to be exactly `jwks`. Therefore we leave `usePlural` set
  // to the default (`false`).
  // usePlural: true,
  debugLogs: env.NODE_ENV !== 'production',
});

// --- Better-Auth instance --------------------------------------------------

export const auth = betterAuth({
  baseURL: env.PUBLIC_URL, // http://localhost:4000
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,

  database,

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
  },

  // Allow browser origin
  trustedOrigins: [env.PUBLIC_URL, 'http://localhost:3000'],

  plugins: [
    jwt({
      jwks: {
        // Generate an RSA key-pair so downstream services can verify tokens via JWKS.
        keyPairConfig: { alg: 'RS256', modulusLength: 2048 },
      },
      jwt: {
        issuer: env.ISSUER,
        audience: env.AUDIENCE,
        expirationTime: '15m',
      },
    }),
  ],

  // Disable internal CORS middleware; Express handles it.
  cors: { enabled: false },

  // Verbose logs in development, quieter in prod.
  logLevel: env.NODE_ENV === 'production' ? 'info' : 'debug',
});
