import { t } from '../../i18n';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AuditEntryView, AuditPage } from '../../api/types';
import { Icon } from '../Icon';
import { AUDIT_ACTION_LABELS } from './auditLabels';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';

const PAGE_SIZE = 50;


const FILTERS: { value: string; label: string }[] = [
  { value: '', label: t('Mind') },
  { value: 'session.', label: t('Vizsgálatok') },
  { value: 'result.', label: t('Eredmények') },
  { value: 'result.share', label: t('Megosztás') },
  { value: 'history.', label: t('Törlések') },
  { value: 'user.', label: t('Felhasználók') },
  { value: 'settings.', label: t('Beállítások') },
  { value: 'hwid.', label: t('Tiltások') },
  { value: 'plugin.', label: 'Plugin' },
  { value: 'platform.', label: 'Platform' }
];

const SETTING_LABELS: Record<string, string> = {
  OrganizationName: t('név'),
  SessionCodeMinutes: t('kód érvényessége (perc)'),
  RetentionDays: t('automatikus törlés (nap)'),
  ShareLinksEnabled: t('megosztó linkek'),
  StaffCanShare: t('Staff megoszthat'),
  StaffCanDeleteOwnScans: t('Staff törölhet'),
  StaffSeesOnlyOwnScans: t('Staff csak a sajátját látja')
};

function actor(entry: AuditEntryView): string {
  if (entry.userEmail) return entry.userEmail;
  if (entry.action === 'session.claim' || entry.action === 'result.submit') return t('játékos (kliens)');
  if (entry.action === 'result.share_view') return t('megosztó linkkel');
  return 'rendszer';
}

function summary(entry: AuditEntryView): string | null {
  if (!entry.details) return null;
  try {
    const data = JSON.parse(entry.details) as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof data.deleted === 'number') parts.push(t('{0} törölve', data.deleted));
    if (typeof data.revoked === 'number') parts.push(t('{0} visszavonva', data.revoked));
    if (typeof data.days === 'number') parts.push(t('{0} napnál régebbiek', data.days));
    if (typeof data.olderThanDays === 'number') parts.push(t('{0} napnál régebbiek', data.olderThanDays));
    if (typeof data.verdict === 'string') parts.push(t('csak {0}', data.verdict));
    if (data.onlyUnfinished === true) parts.push('csak befejezetlenek');
    if (data.all === true) parts.push(t('az összes'));
    if (typeof data.clientVersion === 'string') parts.push(t('kliens {0}', data.clientVersion));
    if (typeof data.organization === 'string') parts.push(data.organization);
    if (typeof data.reason === 'string') parts.push(({ 'subscription-expired': t('lejárt előfizetés'), 'account-deleted': t('törölt vásárlói fiók'), admin: t('kézzel') } as Record<string, string>)[data.reason] ?? data.reason);
    if (typeof data.channel === 'string') parts.push(`#${data.channel}`);
    if (typeof data.Subject === 'string') parts.push(data.Subject);
    if (typeof data.code === 'string') parts.push(`#${data.code}`);
    if (typeof data.expiresAt === 'string') parts.push(t('lejár {0}', formatSecond(data.expiresAt)));
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
      <h2 className="card-title"><Icon name="clock" size={18} />{' '}{t('Tevékenységnapló')}</h2>
      <p className="muted small">{t('Ki, mikor, mit csinált a szervezetben, másodpercre. A naplót nem lehet törölni.')}</p>
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
              <th>{t('Időpont')}</th>
              <th>{t('Ki')}</th>
              <th>{t('Mit csinált')}</th>
              <th>{t('Mire')}</th>
              <th>{t('IP')}</th>
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
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  {summary(entry) && <small className="muted audit-summary">{summary(entry)}</small>}
                </td>
                <td className="mono small">{entry.target ?? '-'}</td>
                <td className="mono small muted">{entry.ipAddress ?? '-'}</td>
              </tr>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={5} className="muted empty-row">{t('Nincs bejegyzés.')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn-ghost btn-tiny" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('Előző')}</button>
        <span className="mono small pager-page">{page} / {totalPages}</span>
        <button className="btn-ghost btn-tiny" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('Következő')}</button>
      </div>
    </section>
  );
}
