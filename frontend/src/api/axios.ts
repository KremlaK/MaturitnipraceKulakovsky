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

// Když server odpoví 401 (přihlášení vypršelo nebo bylo zneplatněno změnou hesla),
// odhlásíme uživatele a pošleme ho na přihlášení. Výjimkou jsou samotné přihlašovací požadavky.
const AUTH_FORMS = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    if (error.response?.status === 401 && !AUTH_FORMS.some((p) => url.startsWith(p))) {
      try {
        localStorage.removeItem('token');
      } catch {
        // nedostupné úložiště – nevadí
      }
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

// Vrátí chybovou hlášku z odpovědi backendu ({ error: '...' }), jinak fallback
export function getErrorMessage(err: unknown, fallback = 'Něco se pokazilo.'): string {
  if (isAxiosError<{ error?: string }>(err)) return err.response?.data?.error || fallback;
  return fallback;
}

export default api;