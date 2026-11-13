import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!user) {
    return <main className="page"><p className="muted">Betöltés...</p></main>;
  }
  if (!isAdmin) {
    return <Navigate to="/panel" replace />;
  }
  return <>{children}</>;
}
