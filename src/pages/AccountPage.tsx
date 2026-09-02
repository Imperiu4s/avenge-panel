import { Layout } from '../components/Layout';
import { getStoredToken } from '../api/client';
import { decodeStaffToken } from '../auth/jwt';

export function AccountPage() {
  const token = getStoredToken();
  const claims = token ? decodeStaffToken(token) : { userId: null, organizationId: null, role: null };

  return (
    <Layout>
      <h1 className="page-title">Account</h1>
      <p className="page-subtitle">A fiókod adatai és a munkamenet állapota.</p>

      <div className="card account-card">
        <ul className="info-list">
          <li><span>Szerepkör</span><span>{claims.role ?? 'ismeretlen'}</span></li>
          <li><span>Felhasználó azonosító</span><span className="mono small">{claims.userId ?? '—'}</span></li>
          <li><span>Szervezet azonosító</span><span className="mono small">{claims.organizationId ?? '—'}</span></li>
        </ul>
      </div>

      <div className="card account-card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>Jelszó módosítása</h2>
        <p className="muted small">Ez a funkció hamarosan elérhető lesz.</p>
        <div className="field-disabled-group">
          <div>
            <label className="field-label">Jelenlegi jelszó</label>
            <input type="password" disabled placeholder="••••••••" />
          </div>
          <div>
            <label className="field-label">Új jelszó</label>
            <input type="password" disabled placeholder="••••••••" />
          </div>
        </div>
        <button className="btn-primary" disabled style={{ maxWidth: 220 }}>Mentés</button>
      </div>
    </Layout>
  );
}
