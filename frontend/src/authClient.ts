import { createAuthClient } from 'better-auth/react';

export const auth = createAuthClient({
  baseUrl: import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/auth',
  mode: 'cookie',
});

export const {
  AuthProvider,
  useUser,
  useLogin,
  useSignup,
  useLogout,
  getAccessToken,
} = auth;
