import { createAuthClient } from "better-auth/react";

// Better-Auth requires an absolute base URL when the auth server runs on a
// different origin than the front-end. We expose the value through Vite env
// variables so it can be configured per-environment (dev, prod, CI …).
const baseURL = (
  // Injected at build time by Vite when the variable starts with `VITE_`.
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:3001/api/auth"
) as string;

export const authClient = createAuthClient({
  baseURL,
  // Forward cookies (sessions) across origins in development.
  credentials: "include",
  // Throw on HTTP errors (4xx/5xx) so .signIn.email rejects on bad creds
  throw: true,
});
