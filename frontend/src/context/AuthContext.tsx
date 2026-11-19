import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../api/axios';
import type { User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Server neodpovídá (výpadek, síť) – uživatele kvůli tomu neodhlašujeme */
  offline: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Po změně údajů (jméno, ověření e-mailu) */
  updateUser: (patch: Partial<User>) => void;
  /** Po změně hesla server vydá nový token – starý přestal platit */
  replaceToken: (token: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  } catch {
    // soukromé okno apod. – přihlášení vydrží jen do obnovení stránky
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => readToken() !== null);
  const [offline, setOffline] = useState(false);

  const refreshUser = useCallback(
    () =>
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          setOffline(false);
        })
        .catch((err) => {
          // odhlásit jen když server přihlášení opravdu odmítl; výpadek serveru není důvod
          if (err?.response?.status === 401 || err?.response?.status === 404) {
            writeToken(null);
            setUser(null);
          } else {
            setOffline(true);
          }
        }),
    [],
  );

  useEffect(() => {
    if (readToken()) refreshUser().finally(() => setLoading(false));
    // axios dá vědět, když server přihlášení odmítne (vypršelo / změna hesla jinde)
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [refreshUser]);

  function login(token: string, newUser: User) {
    writeToken(token);
    setUser(newUser);
  }

  function logout() {
    writeToken(null);
    setUser(null);
  }

  const updateUser = (patch: Partial<User>) => setUser((u) => (u ? { ...u, ...patch } : u));
  const replaceToken = (token: string) => writeToken(token);

  return (
    <AuthContext.Provider value={{ user, loading, offline, login, logout, updateUser, replaceToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook patří k provideru; Fast Refresh tu jen udělá plný reload
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musí být použit uvnitř AuthProvider');
  }
  return context;
}
