import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AuditEntryView, AuditPage } from '../../api/types';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  'session.create': 'Kódot generált',
  'session.claim': 'A játékos csatlakozott',
  'result.submit': 'Eredmény beérkezett',
  'result.view': 'Megnyitotta az eredményt',
  'result.share': 'Megosztó linket készített',
  'result.share_view': 'Megosztó linken megnyitották',
  'result.share_revoke': 'Megosztó linket visszavont',
  'share.revoke_all': 'Minden megosztó linket visszavont',
  'session.delete': 'Vizsgálatot törölt',
  'session.delete_many': 'Több vizsgálatot törölt',
  'history.purge': 'Előzményeket törölt',
  'history.retention': 'Automatikus törlés (megőrzési idő)',
  'settings.update': 'Beállításokat módosított',
  'user.create': 'Felhasználót hozott létre',
  'user.update': 'Felhasználót módosított',
  'user.delete': 'Felhasználót törölt',
  'user.reset_password': 'Új jelszót állított be',
  'user.sign_out': 'Kijelentkeztetett mindenhonnan',
  'hwid.ban': 'Gépet tiltott ki'
};

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Mind' },
  { value: 'session.', label: 'Vizsgálatok' },
  { value: 'result.', label: 'Eredmények' },
  { value: 'result.share', label: 'Megosztás' },
  { value: 'history.', label: 'Törlések' },
  { value: 'user.', label: 'Felhasználók' },
  { value: 'settings.', label: 'Beállítások' },
  { value: 'hwid.', label: 'Tiltások' }
];

const SETTING_LABELS: Record<string, string> = {
  OrganizationName: 'név',
  SessionCodeMinutes: 'kód érvényessége (perc)',
  RetentionDays: 'automatikus törlés (nap)',
  ShareLinksEnabled: 'megosztó linkek',
  StaffCanShare: 'Staff megoszthat',
  StaffCanDeleteOwnScans: 'Staff törölhet',
  StaffSeesOnlyOwnScans: 'Staff csak a sajátját látja'
};

function actor(entry: AuditEntryView): string {
  if (entry.userEmail) return entry.userEmail;
  if (entry.action === 'session.claim' || entry.action === 'result.submit') return 'játékos (kliens)';
  if (entry.action === 'result.share_view') return 'megosztó linkkel';
  return 'rendszer';
}

/// A napló részleteiből a lényeg, olvasható formában (pl. hány vizsgálat törlődött).
function summary(entry: AuditEntryView): string | null {
  if (!entry.details) return null;
  try {
    const data = JSON.parse(entry.details) as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof data.deleted === 'number') parts.push(`${data.deleted} törölve`);
    if (typeof data.revoked === 'number') parts.push(`${data.revoked} visszavonva`);
    if (typeof data.days === 'number') parts.push(`${data.days} napnál régebbiek`);
    if (typeof data.olderThanDays === 'number') parts.push(`${data.olderThanDays} napnál régebbiek`);
    if (typeof data.verdict === 'string') parts.push(`csak ${data.verdict}`);
    if (data.onlyUnfinished === true) parts.push('csak befejezetlenek');
    if (data.all === true) parts.push('az összes');
    if (typeof data.clientVersion === 'string') parts.push(`kliens ${data.clientVersion}`);
    if (typeof data.expiresAt === 'string') parts.push(`lejár ${formatSecond(data.expiresAt)}`);
    if (entry.action === 'settings.update') {
      const show = (value: unknown) => (typeof value === 'boolean' ? (value ? 'be' : 'ki') : String(value));
      const changed = Object.entries(data)
        .filter(([key, value]) => SETTING_LABELS[key] && value && typeof value === 'object')
        .map(([key, value]) => {
          const change = value as { from?: unknown; to?: unknown };
          return `${SETTING_LABELS[key]}: ${show(change.from)} → ${show(change.to)}`;
        });
      if (changed.length > 0) parts.push(changed.join(', '));
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  } catch {
    return null;
  }
}

export function AdminAuditTab() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await api.listAdminAudit(page, PAGE_SIZE, filter));
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <section className="card stagger-in">
      <h2 className="card-title"><Icon name="clock" size={18} /> Tevékenységnapló</h2>
      <p className="muted small">Ki, mikor, mit csinált a szervezetben, másodpercre. A naplót nem lehet törölni.</p>
      <div className="timeline-filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-chip ${filter === f.value ? 'filter-chip-active' : ''}`}
            onClick={() => { setFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="table-scroll">
        <table className="data-table audit-table">
          <thead>
            <tr>
              <th>Időpont</th>
              <th>Ki</th>
              <th>Mit csinált</th>
              <th>Mire</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !data &&
              Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={5}><Skeleton width="100%" /></td></tr>)}
            {data?.items.map((entry) => (
              <tr key={entry.id}>
                <td className="mono small">{formatSecond(entry.createdAt)}</td>
                <td className="mono small">{actor(entry)}</td>
                <td>
                  {ACTION_LABELS[entry.action] ?? entry.action}
                  {summary(entry) && <small className="muted audit-summary">{summary(entry)}</small>}
                </td>
                <td className="mono small">{entry.target ?? '-'}</td>
                <td className="mono small muted">{entry.ipAddress ?? '-'}</td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={5} className="muted empty-row">Nincs bejegyzés.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn-ghost btn-tiny" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Előző</button>
        <span className="mono small pager-page">{page} / {totalPages}</span>
        <button className="btn-ghost btn-tiny" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Következő</button>
      </div>
    </section>
  );
}
