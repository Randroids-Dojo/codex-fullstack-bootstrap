import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Better Auth client settings
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Resolve Better Auth base URL.
// Older examples used `/auth` while the refactor mounts at `/api`. If the env
// variable still contains the legacy suffix we rewrite it to the correct one
// so the front-end keeps working until developers update their `.env` files.
// ---------------------------------------------------------------------------

let AUTH_BASE = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:4000/api/auth';
// No further rewrite; we assume correct value provided.

interface UserSession {
  sub: string;
  email?: string | null;
  name?: string | null;
  id?: string | number;
  // any other fields Better Auth may return
}

interface AuthContextShape {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

// Helper to fetch current session from Better Auth and normalise the response.
async function fetchSession(): Promise<UserSession | null> {
  try {
    const { data } = await axios.get(`${AUTH_BASE}/get-session`, {
      withCredentials: true,
    });
    // Session response shape is { data: { user: {...}, sessionId: string, ... } } or null
    if (!data?.data) return null;
    if (data.data.user) return data.data.user;
    // Fallback: Better Auth <1.2 responded with user fields at root
    return data.data as UserSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const sessionUser = await fetchSession();
    setUser(sessionUser);
    setLoading(false);
  };

  useEffect(() => {
    // Initial session check on mount
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refresh();
    // Only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signup = async (email: string, password: string) => {
    setError(null);
    await axios.post(
      `${AUTH_BASE}/sign-up/email`,
      { email, password },
      { withCredentials: true }
    );
    await refresh();
  };

  const login = async (email: string, password: string) => {
    setError(null);
    await axios.post(
      `${AUTH_BASE}/sign-in/email`,
      { email, password },
      { withCredentials: true }
    );
    await refresh();
  };

  const logout = async () => {
    setError(null);
    await axios.post(
      `${AUTH_BASE}/sign-out`,
      {},
      { withCredentials: true }
    );
    setUser(null);
  };

  const value: AuthContextShape = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
