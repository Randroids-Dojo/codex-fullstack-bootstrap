import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import { betterAuth } from 'better-auth';
import { toNodeHandler } from 'better-auth/node';
// JWT plugin – provides `/token` & `/jwks` endpoints and attaches helpers
// that allow clients to request a self-contained JWT for stateless auth.
import { jwt as jwtPlugin } from 'better-auth/plugins';
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
    // All Better-Auth routes will live under `/api/auth/*` so that both the
    // backend and the frontend have a stable prefix to rely on.
    baseURL : env.PUBLIC_URL,
    // All Better-Auth endpoints will start with `/api/auth/*`.
    // We therefore set basePath accordingly **and mount the handler at the
    // Express root** (see further below).  Do NOT mount again under
    // `/api/auth`, otherwise you’ll end up with `/api/auth/api/auth/...`.
    basePath: '/api/auth',

    // Secret used for session and JWT signing (HS256 for now)
    secret  : env.BETTER_AUTH_SECRET,

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
      handler(level: string, message: string, data?: unknown) {
        // Suppress noisy NOT_FOUND errors (usually favicon or robots.txt)
        if (message === 'Error' && (data as any)?.message === 'NOT_FOUND') return;
        // Basic passthrough
        // eslint-disable-next-line no-console
        console.log(`[${level}] ${message}`, data ?? '');
      },
    },

    // ---------------------------------------------------------------------
    // Security – explicitly allow the SPA origin so Better-Auth will accept
    // requests carrying credentials (Origin header validation).
    // ---------------------------------------------------------------------
    trustedOrigins: [env.FRONTEND_ORIGIN],

    // ---------------------------------------------------------------------
    // Plugins
    // ---------------------------------------------------------------------
    plugins: [
      jwtPlugin({
        jwt: {
          issuer   : env.ISSUER,
          audience : env.AUDIENCE,
          expirationTime: '15m',
        },
        jwks: {
          keyPairConfig: { alg: 'RS256', modulusLength: 2048 },
        },
      }),
    ],
  });

  // Run schema migrations on startup (idempotent)
  if (database) {
    try {
      const ctx = await auth.$context;
      await ctx.runMigrations();
      console.log('[auth-server] Migrations completed');

      // -------------------------------------------------------------------
      // Ensure JWKS matches configured algorithm (RS256).  If an old key set
      // is present (e.g. EdDSA from previous dev runs) signing will fail with
      // "Invalid key for this operation, its asymmetricKeyType must be rsa".
      // A simple fix in development is to purge existing keys so the JWT
      // plugin regenerates fresh RSA keys on first request.
      // -------------------------------------------------------------------
      if (database) {
        try {
          await database.query('DELETE FROM jwks');
          // eslint-disable-next-line no-console
          console.log('[auth-server] Purged stale JWKS');
        } catch (err) {
          // Table might not exist on first migration run – ignore.
        }
      }
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
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );

  // Mount Better-Auth *at the Express root*.  The library will automatically
  // prefix its own routes with the `basePath` we set above ("/api/auth").
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
