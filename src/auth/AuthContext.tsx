import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api, clearStoredToken, getStoredToken, storeToken, ApiError } from '../api/client';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredToken() !== null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      storeToken(result.accessToken);
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      // A backend szándékosan nem árulja el, hogy az email vagy a jelszó volt
      // hibás (user enumeration elleni védelem) - ezt itt is így hagyjuk.
      const message = e instanceof ApiError && e.status === 401
        ? 'Hibás email vagy jelszó.'
        : 'Nem sikerült bejelentkezni. Próbáld újra.';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, error, login, logout }}>
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
