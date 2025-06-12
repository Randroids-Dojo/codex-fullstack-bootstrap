import express, { RequestHandler } from 'express';
import cors from 'cors';

import { betterAuth } from 'better-auth';
import { toNodeHandler } from 'better-auth/node';
import { createDb } from './kysely.js';

import { env } from './env.js';

async function bootstrap() {
  // Build Kysely instance (Postgres) and hand it to Better-Auth. This avoids
  // the flaky built-in Postgres adapter issues.
  const db = createDb(env.DATABASE_URL);

  // Pass a Better-Auth database adapter instead of the raw Kysely instance.
  // The helper returns a closure that Better-Auth calls during initialisation.
  const auth = betterAuth({
    baseURL: env.PUBLIC_URL,
    // We mount the handler under /auth in Express, so keep Better-Auth
    // endpoints relative.
    secret: env.BA_SECRET,

    database: {
      db,
      type: 'postgres',
      // Turn on adapter-level debug logs in non-production environments so we
      // can inspect the generated SQL easily.
      debugLogs: env.NODE_ENV === 'production' ? false : true,
    },

    providers: {
      emailPassword: {
        enabled: true,
        enableSignUp: true,
        requireEmailVerification: false,
      },
    },

    jwt: {
      enableJWT: true,
      algorithm: 'HS256',
      audience: 'fastapi-backend',
      issuer: 'better-auth-demo',
      expiresIn: '15m',
    },

    logLevel: env.NODE_ENV === 'production' ? 'info' : 'debug',
  });

  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
    })
  );

  // Mount Better-Auth handler BEFORE body-parser. We wrap the Node handler so
  // we can attach the `next` callback expected by Express typings.
  const nodeHandlerRaw = toNodeHandler(auth);
  const nodeHandler: RequestHandler = (req, res, next) => {
    Promise.resolve(nodeHandlerRaw(req, res)).catch(next);
  };

  app.use('/auth', nodeHandler);

  app.use(express.json());

  const health: RequestHandler = (_req, res) => {
    res.json({ status: 'ok' });
  };
  app.get('/health', health);

  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
