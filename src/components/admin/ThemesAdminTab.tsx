import { useEffect, useState, type CSSProperties } from 'react';
import { ApiError } from '../../api/client';
import { siteApi } from '../../api/profile';
import { applySiteTheme, previewSiteTheme, savedSiteTheme, SITE_THEMES, useSiteTheme, type SiteTheme, type SiteThemeKey } from '../../theme';
import { Icon } from '../Icon';

function ThemePreview({ theme }: { theme: SiteTheme }) {
  const style = {
    '--pv-signal': theme.signal,
    '--pv-hot': theme.hot,
    '--pv-deep': theme.deep,
    '--pv-grip-a': theme.grip[0],
    '--pv-grip-b': theme.grip[2],
    '--pv-btn-a': theme.button[0],
    '--pv-btn-b': theme.button[2]
  } as CSSProperties;
  return (
    <div className={`theme-preview theme-preview-${theme.key}`} style={style} aria-hidden="true">
      <span className="theme-preview-particles" />
      <span className="theme-preview-nav">
        <i className="theme-preview-logo" />
        <i className="theme-preview-link" />
        <i className="theme-preview-link" />
        <i className="theme-preview-grip" />
      </span>
      <span className="theme-preview-card">
        <i className="theme-preview-line" />
        <i className="theme-preview-line theme-preview-line-short" />
        <i className="theme-preview-button" />
      </span>
      <span className="theme-preview-ground" />
    </div>
  );
}

export function ThemesAdminTab() {
  const current = useSiteTheme();
  const [saved, setSaved] = useState<SiteThemeKey>(savedSiteTheme());
  const [busy, setBusy] = useState<SiteThemeKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previewing = current.key !== saved;

  useEffect(() => () => previewSiteTheme(null), []);

  async function activate(key: SiteThemeKey) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const result = await siteApi.setTheme(key);
      applySiteTheme(result.theme);
      setSaved(result.theme as SiteThemeKey);
      setNotice(`Kész: mostantól mindenki a(z) ${SITE_THEMES.find((t) => t.key === key)?.label ?? key} témát látja.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült beállítani a témát.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="star" size={18} /> Az oldal témája</h2>
          <span className="muted small">Mindenkinek egyszerre vált: vásárlóknak, staffnak és látogatóknak</span>
        </div>
        <p className="muted small">
          Az <strong>Előnézet</strong> csak nálad, ebben a böngészőben kapcsolja be a témát, így körülnézhetsz az oldalon. A <strong>Bekapcsolás mindenkinek</strong> azonnal átállítja az avenge.hu-t.
        </p>
        {previewing && (
          <div className="theme-preview-banner">
            <Icon name="eye" size={15} />
            <span>Előnézet: <strong>{current.label}</strong>. Csak te látod.</span>
            <button type="button" className="btn-primary btn-tiny" onClick={() => activate(current.key)} disabled={busy !== null}>Bekapcsolás mindenkinek</button>
            <button type="button" className="btn-ghost btn-tiny" onClick={() => previewSiteTheme(null)}>Vissza</button>
          </div>
        )}
      </section>

      <div className="theme-grid section-gap">
        {SITE_THEMES.map((theme, i) => {
          const isSaved = theme.key === saved;
          const isShown = theme.key === current.key;
          return (
            <article key={theme.key} className={`card theme-card stagger-in ${isSaved ? 'theme-card-active' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
              <ThemePreview theme={theme} />
              <div className="theme-card-head">
                <h3>{theme.label}</h3>
                {isSaved ? <span className="status-pill status-active">Aktív</span> : isShown ? <span className="status-pill status-pending">Előnézet</span> : null}
              </div>
              <p className="muted small">{theme.tagline}</p>
              <span className="theme-card-swatches">
                {theme.swatches.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <div className="theme-card-actions">
                <button type="button" className="btn-ghost btn-tiny" onClick={() => previewSiteTheme(theme.key)} disabled={isShown}>
                  <Icon name="eye" size={13} /> Előnézet
                </button>
                <button
                  type="button"
                  className={`btn-primary btn-tiny ${busy === theme.key ? 'is-loading' : ''}`}
                  onClick={() => activate(theme.key)}
                  disabled={busy !== null || isSaved}
                >
                  {isSaved ? 'Bekapcsolva' : 'Bekapcsolás mindenkinek'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
      {error && <p className="error-text error-in">{error}</p>}
    </>
  );
}
