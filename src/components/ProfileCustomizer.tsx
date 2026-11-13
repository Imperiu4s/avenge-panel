import { useRef, useState, type ChangeEvent } from 'react';
import { ApiError } from '../api/client';
import { avatarSrc } from '../api/profile';
import { applyTheme, currentTheme, shrinkAvatar, THEMES } from '../theme';
import { Icon } from './Icon';

export function Avatar({ url, name, className }: { url: string | null | undefined; name: string; className?: string }) {
  const src = avatarSrc(url);
  const [failed, setFailed] = useState<string | null>(null);
  const initial = name.trim()[0]?.toUpperCase() ?? '•';
  return (
    <span className={`avatar ${className ?? ''}`} aria-hidden="true">
      {src && failed !== src ? <img src={src} alt="" onError={() => setFailed(src)} /> : initial}
    </span>
  );
}

interface ProfileCustomizerProps {
  avatarUrl: string | null | undefined;
  name: string;
  theme: string | null | undefined;
  onUpload: (image: Blob) => Promise<void>;
  onRemove: () => Promise<void>;
  onTheme: (key: string) => Promise<void>;
}

export function ProfileCustomizer({ avatarUrl, name, theme, onUpload, onRemove, onTheme }: ProfileCustomizerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(theme ?? currentTheme());
  const [syncedTheme, setSyncedTheme] = useState(theme);

  if (theme !== syncedTheme) {
    setSyncedTheme(theme);
    if (theme) setActive(theme);
  }

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    } finally {
      setBusy(null);
    }
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Képfájlt válassz (PNG, JPG, WEBP vagy GIF).');
      return;
    }
    run('upload', async () => {
      const image = await shrinkAvatar(file).catch(() => file);
      if (image.size > 1024 * 1024) throw new ApiError(400, 'A kép túl nagy, válassz kisebbet (legfeljebb 1 MB).');
      await onUpload(image);
    });
  }

  function chooseTheme(key: string) {
    setActive(key);
    applyTheme(key);
    run('theme', () => onTheme(key));
  }

  return (
    <div className="profile-custom">
      <div className="profile-custom-avatar">
        <Avatar url={avatarUrl} name={name} className="profile-avatar profile-avatar-large" />
        <div className="profile-custom-actions">
          <span className="field-label">Profilkép</span>
          <div className="profile-custom-buttons">
            <button type="button" className={`btn-secondary btn-tiny ${busy === 'upload' ? 'is-loading' : ''}`} onClick={() => input.current?.click()} disabled={busy !== null}>
              <Icon name="upload" size={13} /> {avatarUrl ? 'Csere' : 'Feltöltés'}
            </button>
            {avatarUrl && (
              <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => run('remove', onRemove)} disabled={busy !== null}>
                <Icon name="trash" size={13} /> Eltávolítás
              </button>
            )}
          </div>
          <small className="muted">Négyzetesre vágjuk, 256×256 pixelre kicsinyítve.</small>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={pick} />
        </div>
      </div>

      <div className="profile-custom-themes">
        <span className="field-label">Téma</span>
        <div className="theme-swatches" role="radiogroup" aria-label="Színtéma">
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active === t.key}
              className={`theme-swatch ${active === t.key ? 'is-active' : ''}`}
              onClick={() => chooseTheme(t.key)}
              disabled={busy === 'theme'}
              title={t.label}
            >
              <span className="theme-swatch-dot" style={{ background: `linear-gradient(145deg, ${t.hot}, ${t.signal} 55%, ${t.deep})` }} />
              <span className="theme-swatch-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="error-text error-in">{error}</p>}
    </div>
  );
}
