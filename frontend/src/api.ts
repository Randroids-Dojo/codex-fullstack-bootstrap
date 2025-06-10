import axios from 'axios';

export const AUTH_URL: string = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/api/auth';
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

async function exchangeJwt(sessionToken: string) {
  // Better-Auth exposes the JWT endpoint at `/token` (v1.2.x). The old
  // `/jwt/token` path is deprecated and returns 404. Swap to the correct path.
  const { data } = await axios.get(
    `${AUTH_URL}/token`,
    {
      withCredentials: true,
    }
  );
  return data.token as string;
}

export async function login(email: string, password: string) {
  // Step 1: sign-in — returns session token
  const { data } = await axios.post(`${AUTH_URL}/sign-in/email`, {
    email,
    password,
  });

  const sessionToken: string = data.token;

  // Step 2: exchange for JWT
  const jwt = await exchangeJwt(sessionToken);
  return { access_token: jwt, session_token: sessionToken };
}

export async function signup(email: string, password: string) {
  const { data } = await axios.post(`${AUTH_URL}/sign-up/email`, {
    email,
    password,
    name: email.split('@')[0],
  });

  const sessionToken: string = data.token;
  const jwt = await exchangeJwt(sessionToken);
  return { access_token: jwt, session_token: sessionToken };
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
