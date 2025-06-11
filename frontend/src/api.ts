import axios from 'axios';
import { auth } from './lib/auth';

export const AUTH_URL: string = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/api/auth';
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const api = axios.create({ baseURL: API_URL });

// Attach JWT from Better-Auth session automatically
api.interceptors.request.use(async (config) => {
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

// Manual calls until the client exposes helpers in a stable release

export async function login(email: string, password: string) {
  const { data } = await axios.post(
    `${AUTH_URL}/sign-in/email`,
    {
      email,
      password,
    },
    {
      withCredentials: true, // store session cookie (needed for /token)
    },
  );

  // After successful sign-in request a stateless JWT so that the frontend can
  // talk to the FastAPI backend without an additional round-trip.
  const tokenRes = await axios.get(`${AUTH_URL}/token`, {
    withCredentials: true, // required so the session cookie is sent
  });

  return {
    access_token: tokenRes.data.token ?? null,
    user        : data.user,
  };
}

export async function signup(email: string, password: string, name?: string) {
  try {
    const { data } = await axios.post(
      `${AUTH_URL}/sign-up/email`,
      {
        email,
        password,
        name: name ?? email.split('@')[0],
      },
      {
        withCredentials: true,
      },
    );

    const tokenRes = await axios.get(`${AUTH_URL}/token`, {
      withCredentials: true,
    });

    return {
      access_token: tokenRes.data.token ?? null,
      user        : data.user,
    };
  } catch (err: any) {
    // If the user already exists, fall back to the login flow so the UX is the
    // same as "sign-in".  Better-Auth returns 422 with code USER_ALREADY_EXISTS.
    if (axios.isAxiosError(err) && err.response?.status === 422) {
      const code = (err.response.data as any)?.code;
      if (code === 'USER_ALREADY_EXISTS') {
        return login(email, password);
      }
    }
    throw err;
  }
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
