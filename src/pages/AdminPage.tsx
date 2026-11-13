import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SignatureCatalogSection } from '../components/SignatureCatalogSection';
import { BannedHwidsSection } from '../components/BannedHwidsSection';
import { AdminAuditTab } from '../components/admin/AdminAuditTab';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminScansTab } from '../components/admin/AdminScansTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { StoreAdminTab } from '../components/admin/store/StoreAdminTab';
import { DiscordAdminTab } from '../components/admin/DiscordAdminTab';
import { useAuth } from '../auth/AuthContext';
import { Icon, type IconName } from '../components/Icon';
import { useCopyFeedback } from '../components/motion';
import { formatSecond } from '../components/timeline';
import { api, ApiError } from '../api/client';
import { generatePassword, ratePassword } from '../auth/password';
import type { AdminUserView, ClientReleaseView, UserRole } from '../api/types';

interface IssuedCredentials {
  title: string;
  email: string;
  password: string;
}

const ALL_TABS: { key: string; label: string; icon: IconName; platformOnly?: boolean }[] = [
  { key: 'overview', label: 'Áttekintés', icon: 'activity' },
  { key: 'users', label: 'Felhasználók', icon: 'users' },
  { key: 'scans', label: 'Vizsgálatok', icon: 'history' },
  { key: 'settings', label: 'Beállítások', icon: 'settings' },
  { key: 'audit', label: 'Napló', icon: 'clock' },
  { key: 'signatures', label: 'Csalásjelek', icon: 'bug', platformOnly: true },
  { key: 'bans', label: 'Kitiltott gépek', icon: 'ban' },
  { key: 'store', label: 'Áruház', icon: 'cart', platformOnly: true },
  { key: 'discord', label: 'Discord', icon: 'message', platformOnly: true }
];

function formatSize(bytes: number): string {
  return `${(bytes / 1048576).toFixed(0)} MB`;
}

export function AdminPage() {
  const { user } = useAuth();
  const TABS = ALL_TABS.filter((t) => !t.platformOnly || user?.isPlatformAdmin);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab')! : 'overview';
  const scansUser = searchParams.get('user') ?? '';

  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Staff');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  const [release, setRelease] = useState<ClientReleaseView | null>(null);
  const [isReleaseLoaded, setIsReleaseLoaded] = useState(false);

  const { copiedKey, copy } = useCopyFeedback();
  const strength = ratePassword(password);

  function openTab(key: string, extra: Record<string, string> = {}) {
    setSearchParams({ tab: key, ...extra });
  }

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

  async function handleSignOut(user: AdminUserView) {
    if (!window.confirm(`${user.email} minden eszközön kijelentkezik. A jelszava nem változik. Folytatod?`)) return;
    try {
      await api.signOutAdminUser(user.id);
      setListNotice(`${user.email} kijelentkeztetve.`);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült kijelentkeztetni.');
    }
  }

  async function handlePurgeUser(user: AdminUserView) {
    if (!window.confirm(`Törlöd ${user.email} ÖSSZES vizsgálatát az eredményekkel együtt? Ez nem vonható vissza.`)) return;
    try {
      const { deleted } = await api.purgeAdminHistory({ userId: user.id });
      setListNotice(`${user.email}: ${deleted} vizsgálat törölve.`);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült törölni az előzményeket.');
    }
  }

  async function handleDelete(user: AdminUserView) {
    const confirmed = window.confirm(
      `Biztosan törlöd a(z) ${user.email} felhasználót? Ez nem vonható vissza.\n\n` +
      'A vizsgálatai megmaradnak a szervezet előzményeiben; ha azokat is törölnéd, előbb az "Előzmények törlése" gombot használd.'
    );
    if (!confirmed) return;
    try {
      await api.deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült törölni a felhasználót.');
    }
  }

  return (
    <main className="page">
      <header className="page-head stagger-in">
        <span className="eyebrow">Adminisztráció</span>
        <h1>Admin Panel</h1>
        <p className="muted">
          {user?.isPlatformAdmin
            ? 'Felhasználók, vizsgálatok, beállítások, napló, csalásjelek, kitiltott gépek és az áruház.'
            : 'Felhasználók, vizsgálatok, beállítások, napló és kitiltott gépek.'}
        </p>
      </header>

      <nav className="admin-tabs stagger-in" aria-label="Admin fülek" style={{ animationDelay: '40ms' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab ${tab === t.key ? 'admin-tab-active' : ''}`}
            onClick={() => openTab(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            <Icon name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <AdminOverviewTab onOpenTab={(key) => openTab(key)} />}

      {tab === 'scans' && <AdminScansTab users={users} initialUserId={scansUser} />}

      {tab === 'settings' && <AdminSettingsTab />}

      {tab === 'audit' && <AdminAuditTab />}

      {tab === 'signatures' && <SignatureCatalogSection />}

      {tab === 'bans' && <BannedHwidsSection />}

      {tab === 'store' && <StoreAdminTab />}
      {tab === 'discord' && <DiscordAdminTab />}

      {tab === 'users' && (
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
                    <tr key={u.id} className="row-in" style={{ animationDelay: `${i * 40}ms` }}>
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
                      <td className="muted small">{u.lastLoginAt ? formatSecond(u.lastLoginAt) : '-'}</td>
                      <td className="admin-actions">
                        <button className="btn-ghost btn-tiny" onClick={() => openTab('scans', { user: u.id })}>Vizsgálatai</button>
                        <button className="btn-ghost btn-tiny btn-danger" onClick={() => handlePurgeUser(u)}>Előzmények törlése</button>
                        <button className="btn-ghost btn-tiny" onClick={() => handleResetPassword(u)}>Új jelszó</button>
                        <button className="btn-ghost btn-tiny" onClick={() => handleSignOut(u)}>Kijelentkeztetés</button>
                        <button className="btn-ghost btn-tiny" onClick={() => handleToggleActive(u)}>
                          {u.isActive ? 'Deaktiválás' : 'Aktiválás'}
                        </button>
                        <button className="btn-ghost btn-tiny btn-danger" onClick={() => handleDelete(u)}>Fiók törlése</button>
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
            {listNotice && <p className="notice-text">{listNotice}</p>}
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
                  <div><dt>Kiadva</dt><dd>{formatSecond(release.publishedAt)}</dd></div>
                </dl>
              ) : (
                <p className="muted small">{isReleaseLoaded ? 'Még nincs kiadott kliens a szerveren.' : 'Betöltés...'}</p>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
