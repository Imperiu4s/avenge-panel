import { t as tr } from '../i18n';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SignatureCatalogSection } from '../components/SignatureCatalogSection';
import { AdminAuditTab } from '../components/admin/AdminAuditTab';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminScansTab } from '../components/admin/AdminScansTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { StoreAdminTab } from '../components/admin/store/StoreAdminTab';
import { DiscordAdminTab } from '../components/admin/DiscordAdminTab';
import { LegalAdminTab } from '../components/admin/LegalAdminTab';
import { RolesAdminTab } from '../components/admin/RolesAdminTab';
import { ThemesAdminTab } from '../components/admin/ThemesAdminTab';
import { TicketsAdminTab } from '../components/admin/TicketsAdminTab';
import { PluginAdminTab } from '../components/admin/PluginAdminTab';
import { OrganizationsAdminTab } from '../components/admin/OrganizationsAdminTab';
import { supportAdminApi } from '../api/support';
import { useAuth } from '../auth/AuthContext';
import { canAny, ROLE_LABELS } from '../auth/permissions';
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

const ALL_TABS: { key: string; label: string; icon: IconName; perms: string[] }[] = [
  { key: 'overview', label: tr('Áttekintés'), icon: 'activity', perms: ['admin.overview'] },
  { key: 'users', label: tr('Felhasználók'), icon: 'users', perms: ['users.view', 'users.create'] },
  { key: 'roles', label: tr('Rangok'), icon: 'crown', perms: ['roles.manage'] },
  { key: 'scans', label: tr('Vizsgálatok'), icon: 'history', perms: ['admin.scans'] },
  { key: 'settings', label: tr('Beállítások'), icon: 'settings', perms: ['settings.view', 'settings.edit', 'sharelinks.manage'] },
  { key: 'audit', label: tr('Napló'), icon: 'clock', perms: ['audit.view'] },
  { key: 'signatures', label: tr('Csalásjelek'), icon: 'bug', perms: ['signatures.view', 'platform.signatures'] },
  { key: 'organizations', label: tr('Szervezetek'), icon: 'layers', perms: ['platform.organizations'] },
  { key: 'store', label: tr('Áruház'), icon: 'cart', perms: ['platform.store'] },
  { key: 'discord', label: 'Discord', icon: 'message', perms: ['platform.discord'] },
  { key: 'legal', label: tr('Jogi'), icon: 'scale', perms: ['platform.legal'] },
  { key: 'themes', label: tr('Témák'), icon: 'star', perms: ['platform.theme'] },
  { key: 'tickets', label: tr('Ticketek'), icon: 'message', perms: ['platform.tickets'] },
  { key: 'plugin', label: 'Plugin', icon: 'package', perms: ['pluginkeys.manage'] }
];

const ROLE_OPTIONS: UserRole[] = ['Staff', 'Admin', 'Owner'];

function formatSize(bytes: number): string {
  return `${(bytes / 1048576).toFixed(0)} MB`;
}

export function AdminPage() {
  const { user, can } = useAuth();
  const TABS = ALL_TABS.filter((t) => canAny(user, t.perms));
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab')! : TABS[0]?.key ?? '';
  const isOwner = user?.role === 'Owner';
  const canListUsers = canAny(user, ['users.view', 'admin.scans', 'scans.purge']);
  const assignable = ROLE_OPTIONS.filter((r) => r === 'Staff' || (r === 'Admin' && can('users.role')) || (r === 'Owner' && isOwner));
  const scansUser = searchParams.get('user') ?? '';

  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(canListUsers);
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
  const [waitingTickets, setWaitingTickets] = useState(0);
  const canTickets = can('platform.tickets');

  useEffect(() => {
    if (!canTickets) return;
    let alive = true;
    const load = () => supportAdminApi.summary().then((s) => { if (alive) setWaitingTickets(s.waiting); }).catch(() => undefined);
    load();
    const timer = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [canTickets, tab]);
  const [isReleaseLoaded, setIsReleaseLoaded] = useState(false);

  const { copiedKey, copy } = useCopyFeedback();
  const strength = ratePassword(password);

  function openTab(key: string, extra: Record<string, string> = {}) {
    setSearchParams({ tab: key, ...extra });
  }

  const loadUsers = useCallback(async () => {
    if (!canListUsers) return;
    setIsLoading(true);
    setListError(null);
    try {
      setUsers(await api.listAdminUsers());
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setListError(tr('Nem sikerült betölteni a felhasználókat.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [canListUsers]);

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
      setIssued({ title: tr('Fiók létrehozva'), email: created.email, password });
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRole('Staff');
      await loadUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      const message =
        err instanceof ApiError && err.status === 409
          ? tr('Ez az email cím már foglalt.')
          : err instanceof ApiError
            ? err.message
            : tr('Nem sikerült létrehozni a felhasználót.');
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
      setListError(err instanceof ApiError ? err.message : tr('Nem sikerült módosítani a rangot.'));
    }
  }

  async function handleToggleActive(user: AdminUserView) {
    try {
      const updated = await api.updateAdminUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tr('Nem sikerült módosítani az állapotot.'));
    }
  }

  async function handleResetPassword(user: AdminUserView) {
    if (!window.confirm(tr('Új, véletlen jelszót kap a(z) {0} fiók, és minden eszközön kijelentkezik. Folytatod?', user.email))) {
      return;
    }
    const newPassword = generatePassword();
    try {
      await api.resetAdminUserPassword(user.id, newPassword);
      setIssued({ title: tr('Új jelszó beállítva'), email: user.email, password: newPassword });
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tr('Nem sikerült új jelszót beállítani.'));
    }
  }

  async function handleSignOut(user: AdminUserView) {
    if (!window.confirm(tr('{0} minden eszközön kijelentkezik. A jelszava nem változik. Folytatod?', user.email))) return;
    try {
      await api.signOutAdminUser(user.id);
      setListNotice(`${user.email} kijelentkeztetve.`);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tr('Nem sikerült kijelentkeztetni.'));
    }
  }

  async function handlePurgeUser(user: AdminUserView) {
    if (!window.confirm(tr('Törlöd {0} ÖSSZES vizsgálatát az eredményekkel együtt? Ez nem vonható vissza.', user.email))) return;
    try {
      const { deleted } = await api.purgeAdminHistory({ userId: user.id });
      setListNotice(tr('{0}: {1} vizsgálat törölve.', user.email, deleted));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tr('Nem sikerült törölni az előzményeket.'));
    }
  }

  async function handleDelete(user: AdminUserView) {
    const confirmed = window.confirm(
      tr('Biztosan törlöd a(z) {0} felhasználót? Ez nem vonható vissza.\n\n', user.email) +
      tr('A vizsgálatai megmaradnak a szervezet előzményeiben; ha azokat is törölnéd, előbb az "Előzmények törlése" gombot használd.')
    );
    if (!confirmed) return;
    try {
      await api.deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : tr('Nem sikerült törölni a felhasználót.'));
    }
  }

  return (
    <main className="page">
      <header className="page-head stagger-in">
        <span className="eyebrow">{tr('Adminisztráció')}</span>
        <h1>{tr('Admin Panel')}</h1>
        <p className="muted">
          {user ? tr('{0} rangod szerint {1} terület érhető el.', ROLE_LABELS[user.role] ?? user.role, TABS.length) : tr('Betöltés...')}
        </p>
      </header>

      <nav className="admin-tabs stagger-in" aria-label={tr('Admin fülek')} style={{ animationDelay: '40ms' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab ${tab === t.key ? 'admin-tab-active' : ''}`}
            onClick={() => openTab(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            <Icon name={t.icon} size={15} /> {t.label}
            {t.key === 'tickets' && waitingTickets > 0 && <span className="admin-tab-badge">{waitingTickets}</span>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <AdminOverviewTab onOpenTab={(key) => openTab(key)} />}

      {tab === 'scans' && <AdminScansTab users={users} initialUserId={scansUser} />}

      {tab === 'roles' && <RolesAdminTab />}

      {tab === 'settings' && <AdminSettingsTab onOpenRoles={can('roles.manage') ? () => openTab('roles') : undefined} />}

      {tab === 'audit' && <AdminAuditTab />}

      {tab === 'signatures' && <SignatureCatalogSection canEdit={can('platform.signatures')} />}


      {tab === 'store' && <StoreAdminTab />}
      {tab === 'discord' && <DiscordAdminTab />}
      {tab === 'legal' && <LegalAdminTab />}
      {tab === 'themes' && <ThemesAdminTab />}
      {tab === 'tickets' && <TicketsAdminTab />}
      {tab === 'plugin' && <PluginAdminTab />}
      {tab === 'organizations' && <OrganizationsAdminTab />}

      {tab === 'users' && (
        <div className="panel-grid">
          <section className="card stagger-in" style={{ animationDelay: '60ms' }}>
            <h2 className="card-title"><Icon name="users" size={18} />{' '}{tr('Felhasználók')}</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{tr('Email')}</th>
                    <th>{tr('Rang')}</th>
                    <th>{tr('Állapot')}</th>
                    <th>{tr('Utolsó belépés')}</th>
                    <th>{tr('Műveletek')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isSelf = u.id === user?.id;
                    const locked = u.role === 'Owner' && !isOwner;
                    const canChangeRole = can('users.role') && !isSelf && !locked;
                    return (
                      <tr key={u.id} className="row-in" style={{ animationDelay: `${i * 40}ms` }}>
                        <td className="mono small">{u.email}{isSelf && <span className="muted">{' '}{tr('(te)')}</span>}</td>
                        <td>
                          {canChangeRole ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                              className="role-select"
                              aria-label={tr('{0} rangja', u.email)}
                            >
                              {[...new Set([...assignable, u.role])].map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                            </select>
                          ) : (
                            <span className={`role-chip ${u.role === 'Owner' ? 'role-chip-owner' : ''}`}>
                              {u.role === 'Owner' && <Icon name="crown" size={12} />} {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${u.isActive ? 'status-completed' : 'status-interrupted'}`}>
                            {u.isActive ? tr('Aktív') : tr('Inaktív')}
                          </span>
                        </td>
                        <td className="muted small">{u.lastLoginAt ? formatSecond(u.lastLoginAt) : '-'}</td>
                        <td className="admin-actions">
                          {can('admin.scans') && <button className="btn-ghost btn-tiny" onClick={() => openTab('scans', { user: u.id })}>{tr('Vizsgálatai')}</button>}
                          {can('scans.purge') && <button className="btn-ghost btn-tiny btn-danger" onClick={() => handlePurgeUser(u)}>{tr('Előzmények törlése')}</button>}
                          {!isSelf && !locked && can('users.password') && <button className="btn-ghost btn-tiny" onClick={() => handleResetPassword(u)}>{tr('Új jelszó')}</button>}
                          {!isSelf && !locked && can('users.signout') && <button className="btn-ghost btn-tiny" onClick={() => handleSignOut(u)}>{tr('Kijelentkeztetés')}</button>}
                          {!isSelf && !locked && can('users.deactivate') && (
                            <button className="btn-ghost btn-tiny" onClick={() => handleToggleActive(u)}>
                              {u.isActive ? tr('Deaktiválás') : tr('Aktiválás')}
                            </button>
                          )}
                          {!isSelf && !locked && can('users.delete') && <button className="btn-ghost btn-tiny btn-danger" onClick={() => handleDelete(u)}>{tr('Fiók törlése')}</button>}
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted empty-row">{tr('Nincs felhasználó.')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {listNotice && <p className="notice-text">{listNotice}</p>}
            {listError && <p className="error-text">{listError}</p>}
          </section>

          <div className="side-stack">
            {can('users.create') && (
              <section className="card generate-card stagger-in" style={{ animationDelay: '120ms' }}>
                <h2 className="card-title"><Icon name="plus" size={18} />{' '}{tr('Új felhasználó')}</h2>
                <form onSubmit={handleCreate}>
                  <label className="field-label" htmlFor="new-user-email">{tr('Email')}</label>
                  <input
                    id="new-user-email"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <div className="field-label-row">
                    <label className="field-label" htmlFor="new-user-password">{tr('Jelszó')}</label>
                    <button type="button" className="text-action" onClick={handleGeneratePassword}>
                      <Icon name="dice" size={15} />{' '}{tr('Véletlen jelszó')}</button>
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
                      aria-label={showPassword ? tr('Jelszó elrejtése') : tr('Jelszó megjelenítése')}
                    >
                      <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                  <div className={`strength strength-${strength.score}`} aria-live="polite">
                    <span className="strength-bars" aria-hidden="true"><i /><i /><i /><i /></span>
                    <span className="small">{strength.label}</span>
                  </div>

                  <label className="field-label" htmlFor="new-user-role">{tr('Rang')}</label>
                  <select
                    id="new-user-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="role-select role-select-full"
                  >
                    {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                  </select>

                  <button className={`btn-primary btn-block ${isCreating ? 'is-loading' : ''}`} type="submit" disabled={isCreating}>
                    {isCreating && <span className="btn-spinner" aria-hidden="true" />}
                    {isCreating ? tr('Létrehozás...') : tr('Fiók létrehozása')}
                  </button>
                  {createError && <p className="error-text error-in">{createError}</p>}
                </form>
              </section>
            )}

            {issued && (
              <section className="card credentials-card" key={`${issued.email}-${issued.password}`}>
                <div className="credentials-head">
                  <h2 className="card-title"><Icon name="check" size={18} /> {issued.title}</h2>
                  <button className="icon-button" onClick={() => setIssued(null)} aria-label={tr('Bezárás')}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <p className="muted small">{tr('Add át ezeket az adatokat. A jelszó többé nem jeleníthető meg.')}</p>
                <dl className="credentials-list">
                  <div><dt>{tr('Email')}</dt><dd className="mono">{issued.email}</dd></div>
                  <div><dt>{tr('Jelszó')}</dt><dd className="mono">{issued.password}</dd></div>
                </dl>
                <button
                  className="btn-secondary btn-block"
                  onClick={() => copy('credentials', tr('Email: {0}\nJelszó: {1}\nBelépés: {2}/login', issued.email, issued.password, window.location.origin))}
                >
                  <Icon name={copiedKey === 'credentials' ? 'check' : 'copy'} size={16} />
                  {copiedKey === 'credentials' ? tr('Másolva') : tr('Belépési adatok másolása')}
                </button>
              </section>
            )}

            <section className="card release-card stagger-in" style={{ animationDelay: '180ms' }}>
              <h2 className="card-title"><Icon name="download" size={18} />{' '}{tr('Kliens kiadás')}</h2>
              {release ? (
                <dl className="credentials-list">
                  <div><dt>{tr('Verzió')}</dt><dd className="mono">{tr('v')}{release.version}</dd></div>
                  <div><dt>{tr('Méret')}</dt><dd className="mono">{formatSize(release.sizeBytes)}</dd></div>
                  <div><dt>{tr('Kiadva')}</dt><dd>{formatSecond(release.publishedAt)}</dd></div>
                </dl>
              ) : (
                <p className="muted small">{isReleaseLoaded ? tr('Még nincs kiadott kliens a szerveren.') : tr('Betöltés...')}</p>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
