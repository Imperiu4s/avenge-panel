import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SessionsPage } from './pages/SessionsPage';
import { ResultPage } from './pages/ResultPage';
import { HomePage } from './pages/HomePage';
import { AccountPage } from './pages/AccountPage';
import { ChangelogsPage } from './pages/ChangelogsPage';
import { AdminPage } from './pages/AdminPage';
import { PlayerDownloadPage } from './pages/PlayerDownloadPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          {/* A vizsgált játékos oldala: nincs fiókja, a staff által generált kóddal tölt le. */}
          <Route path="/d/:code" element={<PlayerDownloadPage />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/changelogs" element={<ProtectedRoute><ChangelogsPage /></ProtectedRoute>} />
          <Route path="/panel" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/results/:resultId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}
