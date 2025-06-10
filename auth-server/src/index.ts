import express from 'express';
import cors from 'cors';

import { env } from './env.js';
import { initDb } from './db.js';
import { auth } from './betterAuth.js';
import { toNodeHandler } from 'better-auth/node';

async function bootstrap() {
  // Create core tables if they don't exist yet (users, accounts, sessions, etc.)
  await initDb();

  const app = express();

  // 1) CORS – must run before Better-Auth to satisfy preflight
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());

  app.use(
    cors({
      origin(origin, cb) {
        // allow requests with no origin like mobile apps or curl
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'set-auth-jwt'],
      exposedHeaders: ['set-auth-jwt'],
    })
  );

  // 2) Mount Better-Auth under /api
  app.use(toNodeHandler(auth));
  app.use(express.json());

  // Simple health-check
  app.get('/health', (_req: express.Request, res: express.Response) => res.json({ status: 'ok' }));

  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
