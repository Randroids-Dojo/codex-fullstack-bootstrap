import express from 'express';
import cors from 'cors';

import { env } from './env.js';
import { authRouter } from './auth.js';

async function bootstrap() {
  const app = express();

  // Simple request logger with response status
  app.use((req, res, next) => {
    console.log(`[auth-server] ► ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
      console.log(
        `[auth-server] ◄ ${req.method} ${req.originalUrl} → ${res.statusCode}`,
      );
    });
    next();
  });

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      credentials: true,
    })
  );
  // Mount Better Auth first so its body parser gets raw stream
  app.use('/api', authRouter);

  // JSON parser for any additional custom routes _after_ Better Auth
  app.use(express.json());

  app.get('/health', (_req: any, res: any) => res.json({ status: 'ok' }));

  app.get('/debug/ping', (_req: any, res: any) => res.json({ pong: true }));

  // Global error handler – logs stack then returns 500 JSON
  // (Better Auth already sends its own JSON; this is for unexpected errors.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('[auth-server] unhandled error', err);
    res.status(500).json({ detail: 'internal error' });
  });

  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
