import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { generatePassword, ratePassword } from '../auth/password';
import { staffProfileApi } from '../api/profile';
import { ROLE_LABELS } from '../auth/permissions';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/motion';
import { Avatar, ProfileCustomizer } from '../components/ProfileCustomizer';

function formatDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString('hu-HU') : '-';
}

export function AccountPage() {
  const { user, replaceToken, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const strength = ratePassword(newPassword);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const inputType = showPasswords ? 'text' : 'password';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError('A két új jelszó nem egyezik.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      replaceToken(result.accessToken);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswords(false);
      setSaved(true);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof ApiError ? err.message : 'Nem sikerült módosítani a jelszót.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleGenerate() {
    const password = generatePassword();
    setNewPassword(password);
    setConfirmPassword(password);
    setShowPasswords(true);
    setSaved(false);
  }

  return (
    <main className="page page-narrow">
      <header className="page-head stagger-in">
        <span className="eyebrow">Beállítások</span>
        <h1>Fiók</h1>
        <p className="muted">A fiókod adatai, a profilképed, a témád és a jelszavad.</p>
      </header>

      <section className="card profile-card stagger-in" style={{ animationDelay: '80ms' }}>
        <Avatar url={user?.avatarUrl} name={user?.email ?? ''} className="profile-avatar" />
        <div className="profile-main">
          {user ? <strong className="profile-email">{user.email}</strong> : <Skeleton width={220} height={20} />}
          <span className={`role-chip ${user?.role === 'Owner' ? 'role-chip-owner' : ''}`}>
            {user?.role === 'Owner' && <Icon name="crown" size={12} />} {user ? ROLE_LABELS[user.role] ?? user.role : '...'}
          </span>
        </div>
        <dl className="profile-facts">
          <div><dt>Szervezet</dt><dd>{user?.organizationName || '-'}</dd></div>
          <div><dt>Fiók létrehozva</dt><dd>{formatDate(user?.createdAt)}</dd></div>
          <div><dt>Utolsó belépés</dt><dd>{formatDate(user?.lastLoginAt)}</dd></div>
        </dl>
      </section>

      <section className="card stagger-in section-gap-bottom" style={{ animationDelay: '120ms' }}>
        <h2 className="card-title"><Icon name="user" size={18} /> Megjelenés</h2>
        <ProfileCustomizer
          avatarUrl={user?.avatarUrl}
          name={user?.email ?? ''}
          theme={user?.theme}
          onUpload={async (image) => { await staffProfileApi.uploadAvatar(image); refreshUser(); }}
          onRemove={async () => { await staffProfileApi.removeAvatar(); refreshUser(); }}
          onTheme={async (key) => { await staffProfileApi.setTheme(key); }}
        />
      </section>

      <section className="card stagger-in" style={{ animationDelay: '150ms' }}>
        <h2 className="card-title"><Icon name="lock" size={18} /> Jelszó módosítása</h2>
        <p className="muted small">
          A módosítás után minden más eszközön automatikusan kijelentkezel, itt bent maradsz.
        </p>

        <form onSubmit={handleSubmit} className="password-form">
          <label className="field-label" htmlFor="current-password">Jelenlegi jelszó</label>
          <div className="input-with-action">
            <input
              id="current-password"
              type={inputType}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPasswords((v) => !v)}
              aria-label={showPasswords ? 'Jelszavak elrejtése' : 'Jelszavak megjelenítése'}
            >
              <Icon name={showPasswords ? 'eye-off' : 'eye'} size={18} />
            </button>
          </div>

          <div className="field-label-row">
            <label className="field-label" htmlFor="new-password">Új jelszó</label>
            <button type="button" className="text-action" onClick={handleGenerate}>
              <Icon name="dice" size={15} /> Véletlen jelszó
            </button>
          </div>
          <input
            id="new-password"
            type={inputType}
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setSaved(false); }}
          />
          <div className={`strength strength-${strength.score}`} aria-live="polite">
            <span className="strength-bars" aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="small">{strength.label}</span>
          </div>

          <label className="field-label" htmlFor="confirm-password">Új jelszó még egyszer</label>
          <input
            id="confirm-password"
            type={inputType}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {mismatch && <p className="error-text">A két új jelszó nem egyezik.</p>}

          {error && <p className="error-text error-in">{error}</p>}
          {saved && <p className="success-text"><Icon name="check" size={16} /> A jelszavad megváltozott.</p>}

          <button type="submit" className={`btn-primary btn-large ${isSaving ? 'is-loading' : ''}`} disabled={isSaving || mismatch}>
            {isSaving && <span className="btn-spinner" aria-hidden="true" />}
            {isSaving ? 'Mentés...' : 'Jelszó mentése'}
          </button>
        </form>
      </section>
    </main>
  );
}
