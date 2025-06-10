import { createAuthClient } from 'better-auth/react';

export const auth = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/api/auth',
});

// Convenience wrappers used around the app
export async function emailSignIn(email: string, password: string) {
  const res: any = await auth.signIn.email({ email, password });
  const { token: sessionToken } = res;
  // NOTE: The Better-Auth client currently generates the path `/jwt/get-token`,
  // but the server (v1.2.8) exposes the JWT endpoint at `/token`.
  // Calling `auth.jwt.getToken()` therefore results in a 404.
  // Until the mismatch is resolved upstream, we hit the endpoint directly via
  // `auth.$fetch`.
  const { data } = await auth.$fetch('/token', {
    method: 'GET',
    headers: { Authorization: `Bearer ${sessionToken}` },
    credentials: 'include',
  });
  return { jwt: data.token as string, sessionToken };
}

export async function emailSignUp(email: string, password: string) {
  const res: any = await auth.signUp.email({ email, password, name: email.split('@')[0] });
  const { token: sessionToken } = res;
  const { data } = await auth.$fetch('/token', {
    method: 'GET',
    headers: { Authorization: `Bearer ${sessionToken}` },
    credentials: 'include',
  });
  return { jwt: data.token as string, sessionToken };
}
