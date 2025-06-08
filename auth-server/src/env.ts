import 'dotenv/config';

export const env = {
  PORT: Number(process.env.AUTH_PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  ISSUER: 'better-auth-demo',
  AUDIENCE: 'fastapi-backend',
};
