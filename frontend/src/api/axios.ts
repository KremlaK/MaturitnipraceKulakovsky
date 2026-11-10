import axios, { isAxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Automaticky přidej token ke každému požadavku, pokud existuje
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Vrátí chybovou hlášku z odpovědi backendu ({ error: '...' }), jinak fallback
export function getErrorMessage(err: unknown, fallback = 'Něco se pokazilo.'): string {
  if (isAxiosError<{ error?: string }>(err)) return err.response?.data?.error || fallback;
  return fallback;
}

export default api;