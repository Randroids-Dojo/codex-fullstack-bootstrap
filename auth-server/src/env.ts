import 'dotenv/config';

export const env = {
  // ---------------------------------------------------------------------------
  // Generic service config
  // ---------------------------------------------------------------------------
  PORT: Number(process.env.AUTH_PORT || 4000),

  // ---------------------------------------------------------------------------
  // Database – Better-Auth will wrap the pg.Pool with Kysely automatically.
  // ---------------------------------------------------------------------------
  DATABASE_URL: process.env.DATABASE_URL!,

  // ---------------------------------------------------------------------------
  // Better-Auth secrets & URLs
  // ---------------------------------------------------------------------------
  // Keep the variable name identical to the one used in the public docs to
  // avoid onboarding confusion: `BETTER_AUTH_SECRET`.
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ?? process.env.BA_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret',

  PUBLIC_URL: process.env.PUBLIC_URL ?? `http://localhost:${process.env.AUTH_PORT || 4000}`,

  // URL that the browser/SPA is served from (for CORS)
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  // ---------------------------------------------------------------------------
  // (Optional) Legacy JWT bridge – still supported by the backend for now but
  // disabled by default.  Can be safely removed once the backend fully
  // migrates to cookie-based session validation.
  // ---------------------------------------------------------------------------
  ISSUER  : process.env.JWT_ISSUER   ?? 'better-auth-demo',
  AUDIENCE: process.env.JWT_AUDIENCE ?? 'fastapi-backend',
};
