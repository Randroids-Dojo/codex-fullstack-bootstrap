import { betterAuth } from 'better-auth';
import { toNodeHandler } from 'better-auth/node';
import { Pool } from 'pg';

import { env } from './env.js';

// ---------------------------------------------------------------------------
// PostgreSQL connection pool handed directly to Better Auth
// ---------------------------------------------------------------------------

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const auth = betterAuth({
  database: pool, // Better Auth detects Postgres from pg Pool

  providers: {
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // TODO set true in production
    },
  },

  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },

  // Verbose logs so we can trace signup/sign-in flow through Better Auth
  logLevel: 'debug',

  basePath: '/auth',
});

export const authRouter = toNodeHandler(auth);
