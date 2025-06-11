import { createAuthClient } from '@better-auth/client';

// Factory then client (createAuthClient returns a builder function)
const buildClient = createAuthClient();

export const auth = buildClient({
  baseURL: import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/api/auth',
  storage: 'local',
});

export type BetterAuthClient = typeof auth;
