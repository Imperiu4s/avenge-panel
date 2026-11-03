import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SignatureCatalogSection } from '../components/SignatureCatalogSection';
import { BannedHwidsSection } from '../components/BannedHwidsSection';
import { Icon } from '../components/Icon';
import { useCopyFeedback } from '../components/motion';
import { api, ApiError } from '../api/client';
import { generatePassword, ratePassword } from '../auth/password';
import type { AdminUserView, ClientReleaseView, SessionListItem, UserRole } from '../api/types';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Várakozik',
  ClientConnected: 'Kliens csatlakozott',
  Scanning: 'Vizsgálat folyamatban',
  Completed: 'Sikeres vizsgálat',
  Interrupted: 'Megszakadt',
  Expired: 'Lejárt'
};

interface IssuedCredentials {
  title: string;
  email: string;
  password: string;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1048576).toFixed(0)} MB`;
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Staff');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [userSessions, setUserSessions] = useState<SessionListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const [release, setRelease] = useState<ClientReleaseView | null>(null);
  const [isReleaseLoaded, setIsReleaseLoaded] = useState(false);

  const { copiedKey, copy } = useCopyFeedback();
  const strength = ratePassword(password);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      setUsers(await api.listAdminUsers());
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setListError('Nem sikerült betölteni a felhasználókat.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    api.getLatestRelease()
      .then(setRelease)
      .catch(() => setRelease(null))
      .finally(() => setIsReleaseLoaded(true));
  }, [loadUsers]);

  function handleGeneratePassword() {
    setPassword(generatePassword());
    setShowPassword(true);
    setCreateError(null);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      const created = await api.createAdminUser({ email, password, role });
      // A jelszó csak most látszik utoljára: a szerver már csak a hash-t tárolja.
      setIssued({ title: 'Fiók létrehozva', email: created.email, password });
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRole('Staff');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
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
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült módosítani a rangot.');
    }
  }

  async function handleToggleActive(user: AdminUserView) {
    try {
      const updated = await api.updateAdminUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült módosítani az állapotot.');
    }
  }

  async function handleResetPassword(user: AdminUserView) {
    if (!window.confirm(`Új, véletlen jelszót kap a(z) ${user.email} fiók, és minden eszközön kijelentkezik. Folytatod?`)) {
      return;
    }
    const newPassword = generatePassword();
    try {
      await api.resetAdminUserPassword(user.id, newPassword);
      setIssued({ title: 'Új jelszó beállítva', email: user.email, password: newPassword });
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült új jelszót beállítani.');
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
      setUserSessions(await api.listAdminUserSessions(user.id));
    } catch {
      setUserSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  return (
    <main className="page">
      <header className="page-head stagger-in">
        <span className="eyebrow">Adminisztráció</span>
        <h1>Admin Panel</h1>
        <p className="muted">Felhasználók, csalásjelek és kitiltott gépek kezelése.</p>
      </header>

      <div className="panel-grid">
        <section className="card stagger-in" style={{ animationDelay: '60ms' }}>
          <h2 className="card-title"><Icon name="users" size={18} /> Felhasználók</h2>
          <div className="table-scroll">
            <table className="data-table">
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
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`row-in ${selectedUser?.id === u.id ? 'row-selected' : ''}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="mono small">{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        className="role-select"
                        aria-label={`${u.email} rangja`}
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
                    <td className="muted small">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('hu-HU') : '-'}</td>
                    <td className="admin-actions">
                      <button className="btn-ghost btn-tiny" onClick={() => handleViewSessions(u)}>Előzmények</button>
                      <button className="btn-ghost btn-tiny" onClick={() => handleResetPassword(u)}>Új jelszó</button>
                      <button className="btn-ghost btn-tiny" onClick={() => handleToggleActive(u)}>
                        {u.isActive ? 'Deaktiválás' : 'Aktiválás'}
                      </button>
                      <button className="btn-ghost btn-tiny btn-danger" onClick={() => handleDelete(u)}>Törlés</button>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted empty-row">Nincs felhasználó.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {listError && <p className="error-text">{listError}</p>}
        </section>

        <div className="side-stack">
          <section className="card generate-card stagger-in" style={{ animationDelay: '120ms' }}>
            <h2 className="card-title"><Icon name="plus" size={18} /> Új felhasználó</h2>
            <form onSubmit={handleCreate}>
              <label className="field-label" htmlFor="new-user-email">Email</label>
              <input
                id="new-user-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="field-label-row">
                <label className="field-label" htmlFor="new-user-password">Jelszó</label>
                <button type="button" className="text-action" onClick={handleGeneratePassword}>
                  <Icon name="dice" size={15} /> Véletlen jelszó
                </button>
              </div>
              <div className="input-with-action">
                <input
                  id="new-user-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
              <div className={`strength strength-${strength.score}`} aria-live="polite">
                <span className="strength-bars" aria-hidden="true"><i /><i /><i /><i /></span>
                <span className="small">{strength.label}</span>
              </div>

              <label className="field-label" htmlFor="new-user-role">Rang</label>
              <select
                id="new-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="role-select role-select-full"
              >
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>

              <button className={`btn-primary btn-block ${isCreating ? 'is-loading' : ''}`} type="submit" disabled={isCreating}>
                {isCreating && <span className="btn-spinner" aria-hidden="true" />}
                {isCreating ? 'Létrehozás...' : 'Fiók létrehozása'}
              </button>
              {createError && <p className="error-text error-in">{createError}</p>}
            </form>
          </section>

          {issued && (
            <section className="card credentials-card" key={`${issued.email}-${issued.password}`}>
              <div className="credentials-head">
                <h2 className="card-title"><Icon name="check" size={18} /> {issued.title}</h2>
                <button className="icon-button" onClick={() => setIssued(null)} aria-label="Bezárás">
                  <Icon name="x" size={16} />
                </button>
              </div>
              <p className="muted small">Add át ezeket az adatokat. A jelszó többé nem jeleníthető meg.</p>
              <dl className="credentials-list">
                <div><dt>Email</dt><dd className="mono">{issued.email}</dd></div>
                <div><dt>Jelszó</dt><dd className="mono">{issued.password}</dd></div>
              </dl>
              <button
                className="btn-secondary btn-block"
                onClick={() => copy('credentials', `Email: ${issued.email}\nJelszó: ${issued.password}\nBelépés: ${window.location.origin}/login`)}
              >
                <Icon name={copiedKey === 'credentials' ? 'check' : 'copy'} size={16} />
                {copiedKey === 'credentials' ? 'Másolva' : 'Belépési adatok másolása'}
              </button>
            </section>
          )}

          <section className="card release-card stagger-in" style={{ animationDelay: '180ms' }}>
            <h2 className="card-title"><Icon name="download" size={18} /> Kliens kiadás</h2>
            {release ? (
              <dl className="credentials-list">
                <div><dt>Verzió</dt><dd className="mono">v{release.version}</dd></div>
                <div><dt>Méret</dt><dd className="mono">{formatSize(release.sizeBytes)}</dd></div>
                <div><dt>Kiadva</dt><dd>{new Date(release.publishedAt).toLocaleString('hu-HU')}</dd></div>
              </dl>
            ) : (
              <p className="muted small">{isReleaseLoaded ? 'Még nincs kiadott kliens a szerveren.' : 'Betöltés...'}</p>
            )}
          </section>
        </div>
      </div>

      {selectedUser && (
        <section className="card section-gap" key={selectedUser.id}>
          <h2 className="card-title"><Icon name="history" size={18} /> {selectedUser.email} vizsgálatai</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kód</th>
                  <th>Létrehozva</th>
                  <th>Állapot</th>
                  <th>Eredmény</th>
                </tr>
              </thead>
              <tbody>
                {userSessions.map((s, i) => (
                  <tr key={s.code} className="row-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="mono">
                      {s.resultIdHash ? <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link> : <>#{s.code}</>}
                    </td>
                    <td className="muted">{new Date(s.createdAt).toLocaleString('hu-HU')}</td>
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
                    <td colSpan={4} className="muted empty-row">Ehhez a felhasználóhoz még nincs vizsgálat.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SignatureCatalogSection />
      <BannedHwidsSection />
    </main>
  );
}
