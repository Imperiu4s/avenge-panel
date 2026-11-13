import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { AdminShareLinkView, OrganizationSettingsView } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';

const RETENTION_OPTIONS = [
  { value: 0, label: 'Soha (minden megmarad)' },
  { value: 7, label: '7 nap után' },
  { value: 14, label: '14 nap után' },
  { value: 30, label: '30 nap után' },
  { value: 60, label: '60 nap után' },
  { value: 90, label: '90 nap után' },
  { value: 180, label: '180 nap után' },
  { value: 365, label: '1 év után' }
];

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'Nem egyértelmű'
};

type Toggles = Pick<OrganizationSettingsView, 'shareLinksEnabled'>;

const TOGGLES: { key: keyof Toggles; title: string; text: string }[] = [
  {
    key: 'shareLinksEnabled',
    title: 'Megosztó linkek',
    text: 'Az eredményekhez bejelentkezés nélkül megnyitható, 3 napig érvényes link kérhető. Kikapcsolva minden kiadott link azonnal megszűnik.'
  }
];

export function AdminSettingsTab({ onOpenRoles }: { onOpenRoles?: () => void }) {
  const { refreshUser, can } = useAuth();
  const canView = can('settings.view') || can('settings.edit');
  const canEdit = can('settings.edit');
  const canLinks = can('sharelinks.manage');
  const [settings, setSettings] = useState<OrganizationSettingsView | null>(null);
  const [draft, setDraft] = useState<OrganizationSettingsView | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [links, setLinks] = useState<AdminShareLinkView[]>([]);

  const loadLinks = useCallback(() => {
    if (!canLinks) return;
    api.listAdminShareLinks().then(setLinks).catch(() => setLinks([]));
  }, [canLinks]);

  useEffect(() => {
    if (canView) {
      api.getAdminSettings()
        .then((s) => { setSettings(s); setDraft(s); })
        .catch(() => setError('Nem sikerült betölteni a beállításokat.'));
    }
    loadLinks();
  }, [loadLinks, canView]);

  if (canView && (!draft || !settings)) {
    return error ? <p className="error-text">{error}</p> : <div className="card"><Skeleton width="60%" /><Skeleton width="90%" style={{ marginTop: 12 }} /></div>;
  }

  const isDirty = JSON.stringify(settings) !== JSON.stringify(draft);

  function update<K extends keyof OrganizationSettingsView>(key: K, value: OrganizationSettingsView[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setNotice(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setIsSaving(true);
    setError(null);
    try {
      const saved = await api.updateAdminSettings({
        organizationName: draft.organizationName,
        sessionCodeMinutes: draft.sessionCodeMinutes,
        retentionDays: draft.retentionDays,
        shareLinksEnabled: draft.shareLinksEnabled,
        staffCanShare: draft.staffCanShare,
        staffCanDeleteOwnScans: draft.staffCanDeleteOwnScans,
        staffSeesOnlyOwnScans: draft.staffSeesOnlyOwnScans
      });
      setSettings(saved);
      setDraft(saved);
      setNotice('Beállítások mentve.');
      refreshUser();
      loadLinks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevoke(link: AdminShareLinkView) {
    if (!window.confirm('Visszavonod ezt a linket? Aki megkapta, többé nem tudja megnyitni.')) return;
    await api.revokeAdminShareLink(link.id).catch(() => undefined);
    loadLinks();
  }

  async function handleRevokeAll() {
    if (!window.confirm('Minden aktív megosztó link azonnal megszűnik. Folytatod?')) return;
    try {
      const { deleted } = await api.revokeAllAdminShareLinks();
      setNotice(`${deleted} link visszavonva.`);
      loadLinks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült visszavonni a linkeket.');
    }
  }

  return (
    <>
      {draft && settings && (
        <form className="card settings-card stagger-in" onSubmit={handleSave}>
          <h2 className="card-title"><Icon name="settings" size={18} /> Szervezet beállításai</h2>

          <div className="settings-grid">
            <label>
              <span className="field-label">Szervezet neve</span>
              <input value={draft.organizationName} maxLength={80} onChange={(e) => update('organizationName', e.target.value)} disabled={!canEdit} />
              <small className="muted">A megosztott eredményeken is ez látszik.</small>
            </label>
            <label>
              <span className="field-label">A kód érvényessége (perc)</span>
              <input
                type="number"
                min={5}
                max={120}
                value={draft.sessionCodeMinutes}
                onChange={(e) => update('sessionCodeMinutes', Number(e.target.value))}
                disabled={!canEdit}
              />
              <small className="muted">Ennyi ideje van a játékosnak beírni a 6 számjegyű kódot (5-120).</small>
            </label>
            <label>
              <span className="field-label">Vizsgálatok automatikus törlése</span>
              <select value={draft.retentionDays} onChange={(e) => update('retentionDays', Number(e.target.value))} disabled={!canEdit}>
                {RETENTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                {!RETENTION_OPTIONS.some((o) => o.value === draft.retentionDays) && (
                  <option value={draft.retentionDays}>{draft.retentionDays} nap után</option>
                )}
              </select>
              <small className="muted">Óránként fut; a régebbi vizsgálatok az eredményükkel együtt törlődnek.</small>
            </label>
          </div>

          <div className="toggle-list">
            {TOGGLES.map((toggle) => (
              <label className="toggle-row" key={toggle.key}>
                <span className="toggle-text">
                  <strong>{toggle.title}</strong>
                  <small>{toggle.text}</small>
                </span>
                <input
                  type="checkbox"
                  className="switch"
                  checked={draft[toggle.key]}
                  onChange={(e) => update(toggle.key, e.target.checked)}
                  disabled={!canEdit}
                />
              </label>
            ))}
          </div>

          <p className="settings-roles-hint muted small">
            <Icon name="crown" size={14} />
            <span>Hogy a Staff és az Admin rang mit láthat és mit tehet (megosztás, törlés, mások vizsgálatai, felhasználók kezelése...), azt a Tulajdonos a Rangok fülön állítja be.</span>
            {onOpenRoles && <button type="button" className="btn-ghost btn-tiny" onClick={onOpenRoles}>Rangok</button>}
          </p>

          <div className="settings-actions">
            <span className="muted small">Utoljára módosítva: {formatSecond(settings.updatedAt)} · a megosztó link {settings.shareLinkDays} napig érvényes</span>
            <button type="submit" className={`btn-primary ${isSaving ? 'is-loading' : ''}`} disabled={!canEdit || !isDirty || isSaving}>
              {isSaving && <span className="btn-spinner" aria-hidden="true" />}
              {isSaving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
          {notice && <p className="notice-text">{notice}</p>}
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      {canLinks && (
        <section className="card section-gap stagger-in" style={{ animationDelay: '80ms' }}>
          <div className="scans-head">
            <h2 className="card-title"><Icon name="share" size={18} /> Aktív megosztó linkek</h2>
            <button type="button" className="btn-ghost btn-tiny btn-danger" disabled={links.length === 0} onClick={handleRevokeAll}>
              Összes visszavonása
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vizsgálat</th>
                  <th>Készítette</th>
                  <th>Készült</th>
                  <th>Lejár</th>
                  <th className="align-right">Megnyitás</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td className="mono">
                      {link.resultIdHash ? <Link to={`/results/${link.resultIdHash}`}>#{link.sessionCode}</Link> : `#${link.sessionCode ?? '?'}`}
                      {link.verdict && <span className={`verdict-badge verdict-${link.verdict.toLowerCase()} verdict-inline`}>{VERDICT_LABELS[link.verdict]}</span>}
                    </td>
                    <td className="mono small">{link.createdByEmail ?? '-'}</td>
                    <td className="muted small">{formatSecond(link.createdAt)}</td>
                    <td className="muted small">{formatSecond(link.expiresAt)}</td>
                    <td className="align-right mono">{link.viewCount}</td>
                    <td><button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => handleRevoke(link)}>Visszavonás</button></td>
                  </tr>
                ))}
                {links.length === 0 && (
                  <tr><td colSpan={6} className="muted empty-row">Nincs aktív megosztó link.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
