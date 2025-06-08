import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { env } from './env.js';

interface User {
  email: string;
  passwordHash: string;
  name?: string;
}

// In-memory user store – good enough for demo purposes.
const users = new Map<string, User>();

function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.email,
      email: user.email,
      name: user.name ?? null,
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      audience: env.AUDIENCE,
      issuer: env.ISSUER,
    }
  );
}

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? '*',
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/auth/signup', async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ detail: 'email and password required' });
  }

  if (users.has(email)) {
    return res.status(400).json({ detail: 'user exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { email, passwordHash, name };
  users.set(email, user);

  const access_token = generateToken(user);
  return res.json({ access_token });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ detail: 'email and password required' });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(400).json({ detail: 'invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(400).json({ detail: 'invalid credentials' });
  }

  const access_token = generateToken(user);
  return res.json({ access_token });
});

app.listen(env.PORT, () => {
  console.log(`Auth-server listening on ${env.PORT}`);
});
