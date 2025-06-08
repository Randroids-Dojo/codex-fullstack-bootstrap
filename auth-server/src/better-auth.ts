import { createBetterAuth } from 'better-auth';
import { env } from './env.js';

export const betterAuth = createBetterAuth({
  db: { url: env.DATABASE_URL, driver: 'postgres' },
  redis: { url: env.REDIS_URL },
  jwt: {
    secret: env.JWT_SECRET,
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: env.ISSUER,
    audience: 'fastapi-backend',
  },
  providers: ['email-password'],
});
