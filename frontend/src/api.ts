import axios from 'axios';

export const AUTH_URL: string = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/auth';
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

export async function login(email: string, password: string) {
  const { data } = await axios.post(`${AUTH_URL}/login`, { email, password });
  return data; // expecting { access_token }
}

export async function signup(email: string, password: string) {
  const { data } = await axios.post(`${AUTH_URL}/signup`, { email, password });
  return data; // expecting { access_token }
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
