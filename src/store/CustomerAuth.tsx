import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import {
  clearCustomerToken,
  CUSTOMER_EXPIRED_EVENT,
  getCustomerToken,
  storeApi,
  storeCustomerToken,
  type CustomerMe
} from '../api/store';

interface CustomerAuthValue {
  isLoggedIn: boolean;
  me: CustomerMe | null;
  isLoadingMe: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, acceptTerms: boolean) => Promise<void>;
  logout: () => void;
  replaceToken: (token: string) => void;
  refresh: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function readToken(): string | null {
  const token = getCustomerToken();
  if (token && tokenExpired(token)) {
    clearCustomerToken();
    return null;
  }
  return token;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [me, setMe] = useState<CustomerMe | null>(null);
  const [isLoadingMe, setIsLoadingMe] = useState(false);

  const logout = useCallback(() => {
    clearCustomerToken();
    setToken(null);
    setMe(null);
  }, []);

  useEffect(() => {
    window.addEventListener(CUSTOMER_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(CUSTOMER_EXPIRED_EVENT, logout);
  }, [logout]);

  const refresh = useCallback(async () => {
    if (!getCustomerToken()) return;
    setIsLoadingMe(true);
    try {
      setMe(await storeApi.me());
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) throw err;
    } finally {
      setIsLoadingMe(false);
    }
  }, []);

  useEffect(() => {
    if (token) refresh().catch(() => undefined);
  }, [token, refresh]);

  const replaceToken = useCallback((next: string) => {
    storeCustomerToken(next);
    setToken(next);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await storeApi.login(email, password);
    replaceToken(result.token);
  }, [replaceToken]);

  const register = useCallback(async (email: string, password: string, displayName: string, acceptTerms: boolean) => {
    const result = await storeApi.register(email, password, displayName, acceptTerms);
    replaceToken(result.token);
  }, [replaceToken]);

  return (
    <CustomerAuthContext.Provider value={{ isLoggedIn: token !== null, me, isLoadingMe, login, register, logout, replaceToken, refresh }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomer(): CustomerAuthValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomer csak CustomerAuthProvider-en belül használható.');
  return ctx;
}
