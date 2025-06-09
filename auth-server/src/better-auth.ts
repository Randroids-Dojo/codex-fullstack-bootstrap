import { betterAuth } from 'better-auth';

import { env } from './env.js';

// Central Better Auth instance configured for our service
export const auth = betterAuth({
  database: {
    provider: 'postgres',
    url: env.DATABASE_URL,
  },
  basePath: '/api/auth',
  jwt: {
    secret: env.JWT_SECRET,
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: env.ISSUER,
    audience: 'fastapi-backend',
  },
  cookies: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN ?? undefined,
  },
  providers: ['email-password'],
});
