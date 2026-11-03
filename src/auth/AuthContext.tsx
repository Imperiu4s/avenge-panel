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

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  /// Igaz, ha a munkamenet magától szűnt meg (nem a felhasználó lépett ki).
  sessionExpired: boolean;
  user: CurrentUserView | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  /// Jelszóváltás után a szerver új tokent ad - a munkamenet ezzel folytatódik.
  replaceToken: (token: string) => void;
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
  // Egyetlen igazságforrás: a token. A korábbi külön "isAuthenticated" állapot
  // bent ragadt igazon, miután a 401 törölte a tokent - ezért kapott az Admin
  // oldal minden gombja "Hiba (401)"-et a 8 órás munkamenet lejárta után.
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

  // A lejáratkor magától is kilépünk, ne csak a következő kéréskor derüljön ki.
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
      .then((me) => { if (!cancelled) setUser(me); })
      .catch(() => { /* a 401-et az esemény kezeli, a többi nem blokkoló */ });
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
      // A backend szándékosan nem árulja el, hogy az email vagy a jelszó volt
      // hibás (user enumeration elleni védelem) - ezt itt is így hagyjuk.
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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: token !== null,
        isAdmin: token !== null && decodeStaffToken(token).role === 'Admin',
        isLoading,
        error,
        sessionExpired,
        user,
        login,
        logout,
        replaceToken
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
