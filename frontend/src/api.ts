import axios from 'axios';

// Better-Auth server is mounted at /auth on port 4000 by default. All built-in
// endpoints (sign-in, sign-up, etc.) live **under** that base path, so we only
// need to append the specific action here.
export const AUTH_URL: string =
  import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/auth';
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as any;
  }
  return config;
});

/**
 * Sign-in using Better-Auth’s email-password endpoint.
 *
 * POST   /auth/sign-in/email
 * body   { email, password }
 * resp   { token: string, user: {...} }
 */
export async function login(email: string, password: string) {
  const { data } = await axios.post(`${AUTH_URL}/sign-in/email`, {
    email,
    password,
  });

  // For backwards compatibility the frontend expects an `access_token`. We map
  // the returned `token` field to that shape so existing components remain
  // unchanged.
  return { access_token: data.token, user: data.user };
}

/**
 * Sign-up using Better-Auth’s email-password endpoint.
 *
 * POST   /auth/sign-up/email
 * body   { name, email, password }
 * resp   { token: string, user: {...} }
 */
export async function signup(email: string, password: string) {
  // Use the local-part of the email as a default name. Real UI could collect a
  // proper name but this keeps the demo minimal.
  const defaultName = email.split('@')[0];

  const { data } = await axios.post(`${AUTH_URL}/sign-up/email`, {
    name: defaultName,
    email,
    password,
  });

  return { access_token: data.token, user: data.user };
}

export async function fetchMe() {
  const { data } = await api.get('/me');
  return data;
}

export async function fetchCounter() {
  const { data } = await api.get('/counter');
  return data;
}

export async function incrementCounter() {
  const { data } = await api.post('/counter/increment');
  return data;
}
