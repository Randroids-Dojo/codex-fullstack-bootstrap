import 'dotenv/config';

export const env = {
  PORT: Number(process.env.AUTH_PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  // Better-Auth specific
  BA_SECRET: process.env.BA_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret',

  // JWT options (kept for backward-compatibility with backend)
  ISSUER  : process.env.JWT_ISSUER   ?? 'better-auth-demo',
  AUDIENCE: process.env.JWT_AUDIENCE ?? 'fastapi-backend',

  PUBLIC_URL: process.env.PUBLIC_URL ?? `http://localhost:${process.env.AUTH_PORT || 4000}`,
};
