import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var ${name}`);
  }
  return v;
}

export const env = {
  PORT: Number(process.env.AUTH_PORT ?? 4000),

  // External URLs
  PUBLIC_URL: process.env.PUBLIC_URL ?? `http://localhost:${process.env.AUTH_PORT ?? 4000}`,

  // Adapter connection strings
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL ?? '',

  // Better-Auth secret for HS256 signing
  BA_SECRET: required('BA_SECRET'),

  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
