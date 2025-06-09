import axios from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

// Backend currently does NOT require authentication for counter endpoints.
// If/when we migrate the FastAPI backend to Better Auth as well, an auth
// header/interceptor will be added here.

export async function fetchCounter() {
  const { data } = await api.get('/counter');
  return data;
}

export async function incrementCounter() {
  const { data } = await api.post('/counter/increment');
  return data;
}
