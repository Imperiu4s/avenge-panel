import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, ApiError } from '../api/client';
import type { AdminUserView, SessionListItem, UserRole } from '../api/types';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Várakozik',
  ClientConnected: 'Kliens csatlakozott',
  Scanning: 'Vizsgálat folyamatban',
  Completed: 'Sikeres vizsgálat',
  Interrupted: 'Megszakadt',
  Expired: 'Lejárt'
};

export function AdminPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [userSessions, setUserSessions] = useState<SessionListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const result = await api.listAdminUsers();
      setUsers(result);
    } catch {
      setListError('Nem sikerült betölteni a felhasználókat.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      await api.createAdminUser({ email, password, role });
      setEmail('');
      setPassword('');
      setRole('Staff');
      await loadUsers();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? 'Ez az email cím már foglalt.'
          : err instanceof ApiError
            ? err.message
            : 'Nem sikerült létrehozni a felhasználót.';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRoleChange(user: AdminUserView, newRole: UserRole) {
    try {
      const updated = await api.updateAdminUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setListError('Nem sikerült módosítani a rangot.');
    }
  }

  async function handleToggleActive(user: AdminUserView) {
    try {
      const updated = await api.updateAdminUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      setListError('Nem sikerült módosítani az állapotot.');
    }
  }

  async function handleDelete(user: AdminUserView) {
    if (!window.confirm(`Biztosan törlöd a(z) ${user.email} felhasználót? Ez nem vonható vissza.`)) {
      return;
    }
    try {
      await api.deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült törölni a felhasználót.');
    }
  }

  async function handleViewSessions(user: AdminUserView) {
    setSelectedUser(user);
    setIsLoadingSessions(true);
    try {
      const result = await api.listAdminUserSessions(user.id);
      setUserSessions(result);
    } catch {
      setUserSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  return (
    <Layout>
      <div className="panel-header">
        <h1>Admin</h1>
        <p className="subtitle">Felhasználók, rangok és mások vizsgálat-előzményeinek kezelése a szervezetedben</p>
      </div>

      <div className="panel-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Felhasználók</h2>
          <div className="table-scroll">
            <table className="sessions-table admin-users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rang</th>
                  <th>Állapot</th>
                  <th>Utolsó belépés</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={selectedUser?.id === u.id ? 'row-selected' : ''}>
                    <td className="mono small">{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        className="role-select"
                      >
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'status-completed' : 'status-interrupted'}`}>
                        {u.isActive ? 'Aktív' : 'Inaktív'}
                      </span>
                    </td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('hu-HU') : '-'}</td>
                    <td className="admin-actions">
                      <button className="btn-secondary btn-tiny" onClick={() => handleViewSessions(u)}>
                        Előzmények
                      </button>
                      <button className="btn-secondary btn-tiny" onClick={() => handleToggleActive(u)}>
                        {u.isActive ? 'Deaktiválás' : 'Aktiválás'}
                      </button>
                      <button className="btn-secondary btn-tiny btn-danger" onClick={() => handleDelete(u)}>
                        Törlés
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">Nincs felhasználó.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {listError && <p className="error-text">{listError}</p>}
        </div>

        <div className="card generate-card">
          <h2>Új felhasználó</h2>
          <form onSubmit={handleCreate}>
            <label className="field-label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <label className="field-label">Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />

            <label className="field-label">Rang</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="role-select role-select-full">
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>

            <button className="btn-primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Létrehozás...' : 'Létrehozás'}
            </button>
            {createError && <p className="error-text">{createError}</p>}
          </form>
        </div>
      </div>

      {selectedUser && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>
            {selectedUser.email} vizsgálat-előzményei
          </h2>
          <div className="table-scroll">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Kód</th>
                  <th>Létrehozva</th>
                  <th>Állapot</th>
                  <th>Eredmény</th>
                </tr>
              </thead>
              <tbody>
                {userSessions.map((s) => (
                  <tr key={s.code}>
                    <td className="mono">
                      {s.resultIdHash ? (
                        <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link>
                      ) : (
                        <>#{s.code}</>
                      )}
                    </td>
                    <td>{new Date(s.createdAt).toLocaleString('hu-HU')}</td>
                    <td>
                      <span className={`status-badge status-${s.status.toLowerCase()}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td>
                      {s.verdict ? (
                        <span className={`verdict-badge verdict-${s.verdict.toLowerCase()}`}>{s.verdict}</span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoadingSessions && userSessions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">Ehhez a felhasználóhoz még nincs session.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
