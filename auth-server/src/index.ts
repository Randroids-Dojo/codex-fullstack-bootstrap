import express from 'express';
import cors from 'cors';

import { env } from './env.js';
import { auth } from './better-auth.js';
import { toNodeHandler } from 'better-auth/node';

async function bootstrap() {

  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
    })
  );
  app.use(express.json());

  app.get('/health', (_req: any, res: any) => res.json({ status: 'ok' }));

  // Mount Better Auth routes under /auth
  // Mount at root so handler sees the full basePath in the URL.
  app.use('/', toNodeHandler(auth.handler));

  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
