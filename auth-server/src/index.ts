import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import { betterAuth } from 'better-auth';
import { toNodeHandler } from 'better-auth/node';
import { Pool } from 'pg';

import { env } from './env.js';

async function bootstrap() {
  // ---------------------------------------------------------------------------
  // Optional database connection – Better-Auth falls back to in-memory adapter
  // if no database is supplied or the connection fails.
  // ---------------------------------------------------------------------------
  let database: Pool | undefined;
  try {
    const testPool = new Pool({ connectionString: env.DATABASE_URL });
    // Quick connection check – will throw if unreachable
    await testPool.query('SELECT 1');
    database = testPool;
    console.log('[auth-server] Connected to Postgres');
  } catch (err) {
    console.warn('[auth-server] Postgres not reachable – using memory adapter');
  }

  // ---------------------------------------------------------------------------
  // Better-Auth configuration
  // ---------------------------------------------------------------------------
  const auth = betterAuth({
    // Basic URLs
    baseURL : env.PUBLIC_URL,
    basePath: '/auth',

    // Secret used for session and JWT signing (HS256 for now)
    secret  : env.BA_SECRET,

    // Database adapter – Better-Auth will auto-detect Postgres via pg.Pool
    ...(database ? { database } : {}),

    // Enable classic email/password flow
    emailAndPassword: {
      enabled: true,
      // Allow public sign-up for the demo
      disableSignUp: false,
      minPasswordLength: 8,
    },

    // Enable stateless JWT so FastAPI can verify without hitting auth-server
    jwt: {
      enableJWT: true,
      algorithm: 'HS256',
      audience : env.AUDIENCE,
      issuer   : env.ISSUER,
      expiresIn: '15m',
    },

    // Development logging
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Run schema migrations on startup (idempotent)
  if (database) {
    try {
      const ctx = await auth.$context;
      await ctx.runMigrations();
      console.log('[auth-server] Migrations completed');
    } catch (err) {
      console.warn('[auth-server] Migration error – continuing without them:', (err as any)?.message ?? err);
    }
  }

  // ---------------------------------------------------------------------------
  // Express application
  // ---------------------------------------------------------------------------
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
      credentials: true,
    }),
  );

  // Mount Better-Auth *at root* – it already prefixes routes with `basePath`
  // (set to "/auth" above). Mounting again under "/auth" would duplicate
  // the segment and cause 404s like `/auth/auth/sign-in/email`.
  app.use(toNodeHandler(auth) as any);

  // Body-parser for any other routes (none at the moment but keep for future)
  app.use(express.json());

  app.get('/health', ((req, res) => {
    res.json({ status: 'ok' });
  }) as express.RequestHandler);

  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
