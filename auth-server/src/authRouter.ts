import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from './env.js';
import { pool } from './db.js';

// Utility: issue JWT matching the contract stated in docs/PROJECT_PLAN.md
function generateToken(user: { sub: string; email?: string | null; name?: string | null }) {
  return jwt.sign(
    {
      sub: user.sub,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: env.ISSUER,
      audience: env.AUDIENCE,
    }
  );
}

export const authRouter = Router();

// POST /auth/signup
authRouter.post('/signup', async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ detail: 'email and password required' });
  }

  try {
    // Check if user exists first
    const exists = await pool.query('SELECT 1 FROM users WHERE sub=$1', [email]);
    if (exists.rowCount > 0) {
      return res.status(400).json({ detail: 'user exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    console.log('[auth] signup new user', email);
    await pool.query(
      'INSERT INTO users (sub, email, name, password_hash) VALUES ($1, $2, $3, $4)',
      [email, email, name ?? null, passwordHash]
    );

    const access_token = generateToken({ sub: email, email, name });
    return res.json({ access_token });
  } catch (err: any) {
    console.error('signup error', err);
    return res.status(500).json({ detail: 'internal error' });
  }
});

// POST /auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ detail: 'email and password required' });
  }

  try {
    const result = await pool.query('SELECT sub, email, name, password_hash FROM users WHERE sub=$1', [email]);
    if (result.rowCount === 0) {
      return res.status(400).json({ detail: 'invalid credentials' });
    }
    const user = result.rows[0] as {
      sub: string;
      email: string | null;
      name: string | null;
      password_hash: string;
    };

    const ok = await bcrypt.compare(password, user.password_hash);
    console.log('[auth] login', email, ok ? 'success' : 'invalid-password');
    if (!ok) {
      return res.status(400).json({ detail: 'invalid credentials' });
    }

    const access_token = generateToken(user);
    return res.json({ access_token });
  } catch (err: any) {
    console.error('login error', err);
    return res.status(500).json({ detail: 'internal error' });
  }
});
