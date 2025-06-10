import 'dotenv/config';

export const env = {
  PORT: Number(process.env.AUTH_PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? process.env.JWT_SECRET!,
  PUBLIC_URL: process.env.PUBLIC_URL ?? 'http://localhost:4000',
  ISSUER: process.env.JWT_ISSUER ?? 'better-auth-demo',
  AUDIENCE: process.env.JWT_AUDIENCE ?? 'fastapi-backend',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
