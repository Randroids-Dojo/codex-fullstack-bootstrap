import express from 'express';
import cors from 'cors';

import { env } from './env.js';
import { initDb } from './db.js';
import { authRouter } from './authRouter.js';

async function bootstrap() {
  // Initialise database (create tables if missing)
  await initDb();

  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
    })
  );
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Mount auth routes under /auth
  app.use('/auth', authRouter);

  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
