import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  api,
  ApiError,
  clearStoredToken,
  getStoredToken,
  SESSION_EXPIRED_EVENT,
  storeToken
} from '../api/client';
import type { CurrentUserView } from '../api/types';
import { disconnectScanHub } from '../realtime/scanHub';
import { decodeStaffToken } from './jwt';
import { can as userCan, canOpenAdmin } from './permissions';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  can: (permission: string) => boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean;
  user: CurrentUserView | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  replaceToken: (token: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isExpired(token: string): boolean {
  const { expiresAt } = decodeStaffToken(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

function readValidToken(): string | null {
  const token = getStoredToken();
  return token && !isExpired(token) ? token : null;
}

function hasExpiredStoredToken(): boolean {
  const token = getStoredToken();
  return token !== null && isExpired(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readValidToken);
  const [sessionExpired, setSessionExpired] = useState(hasExpiredStoredToken);
  const [user, setUser] = useState<CurrentUserView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expireSession = useCallback(() => {
    clearStoredToken();
    disconnectScanHub();
    setToken(null);
    setUser(null);
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    if (!token) clearStoredToken();
  }, [token]);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
  }, [expireSession]);

  useEffect(() => {
    if (!token) return;
    const { expiresAt } = decodeStaffToken(token);
    if (expiresAt === null) return;
    const timer = window.setTimeout(expireSession, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [token, expireSession]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      storeToken(result.accessToken);
      setToken(result.accessToken);
      setSessionExpired(false);
      return true;
    } catch (e) {
      let message = 'Nem sikerült bejelentkezni. Próbáld újra.';
      if (e instanceof ApiError && e.status === 401) message = 'Hibás email vagy jelszó.';
      if (e instanceof ApiError && e.status === 429) message = e.message;
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    disconnectScanHub();
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  }, []);

  const replaceToken = useCallback((next: string) => {
    storeToken(next);
    setToken(next);
  }, []);

  const refreshUser = useCallback(() => {
    api.me().then(setUser).catch(() => { });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: token !== null,
        isAdmin: token !== null && canOpenAdmin(user),
        can: (permission: string) => token !== null && userCan(user, permission),
        isLoading,
        error,
        sessionExpired,
        user,
        login,
        logout,
        replaceToken,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth csak AuthProvider-en belül használható.');
  }
  return ctx;
}
