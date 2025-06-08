import express from 'express';
import { betterAuth } from './better-auth.js';
import { env } from './env.js';

const app = express();

app.use(express.json());
app.use('/auth', betterAuth.router);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(env.PORT, () => {
  console.log(`Auth-server listening on ${env.PORT}`);
});
