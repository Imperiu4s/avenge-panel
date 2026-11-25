import { t } from '../../i18n';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { AdminSessionPage, AdminUserView, ScanVerdict } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  Pending: t('Várakozik'),
  ClientConnected: t('Kliens csatlakozott'),
  Scanning: t('Folyamatban'),
  Completed: t('Sikeres'),
  Interrupted: t('Megszakadt'),
  Expired: t('Lejárt')
};

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: t('Nem egyértelmű')
};

const AGE_OPTIONS = [
  { value: 0, label: t('bármikor') },
  { value: 7, label: t('7 napnál régebbi') },
  { value: 14, label: t('14 napnál régebbi') },
  { value: 30, label: t('30 napnál régebbi') },
  { value: 90, label: t('90 napnál régebbi') },
  { value: 180, label: t('180 napnál régebbi') },
  { value: 365, label: t('1 évnél régebbi') }
];

interface Props {
  users: AdminUserView[];
  initialUserId?: string;
  onChanged?: () => void;
}

export function AdminScansTab({ users, initialUserId = '', onChanged }: Props) {
  const { can } = useAuth();
  const canDelete = can('scans.delete.all');
  const canPurge = can('scans.purge');
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState(initialUserId);
  const [verdict, setVerdict] = useState<ScanVerdict | ''>('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminSessionPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [purgeUser, setPurgeUser] = useState('');
  const [purgeAge, setPurgeAge] = useState(30);
  const [purgeVerdict, setPurgeVerdict] = useState<ScanVerdict | ''>('');
  const [purgeUnfinished, setPurgeUnfinished] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => setUserId(initialUserId), [initialUserId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await api.listAdminSessions({ page, pageSize: PAGE_SIZE, userId, verdict, status, q: query }));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) setError(t('Nem sikerült betölteni a vizsgálatokat.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, userId, verdict, status, query]);

  useEffect(() => {
    const timer = window.setTimeout(load, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  useEffect(() => setSelected(new Set()), [page, userId, verdict, status, query]);

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const allSelected = items.length > 0 && items.every((s) => selected.has(s.code));

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((s) => s.code)));
  }

  async function deleteCodes(codes: string[]) {
    if (codes.length === 0) return;
    const text = codes.length === 1 ? t('a #{0} vizsgálatot', codes[0]) : t('{0} vizsgálatot', codes.length);
    if (!window.confirm(t('Törlöd {0} az eredményekkel és a megosztó linkekkel együtt? Ez nem vonható vissza.', text))) return;
    try {
      const { deleted } = await api.deleteAdminSessions(codes);
      setNotice(t('{0} vizsgálat törölve.', deleted));
      setSelected(new Set());
      onChanged?.();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült törölni.'));
    }
  }

  function describePurge(): string {
    const parts: string[] = [];
    const who = users.find((u) => u.id === purgeUser);
    parts.push(who ? t('{0} vizsgálatai', who.email) : t('mindenki vizsgálatai'));
    const age = AGE_OPTIONS.find((o) => o.value === purgeAge);
    if (purgeAge > 0 && age) parts.push(age.label);
    if (purgeVerdict) parts.push(t('csak {0}', VERDICT_LABELS[purgeVerdict]));
    if (purgeUnfinished) parts.push(t('csak a befejezetlenek (lejárt / megszakadt kódok)'));
    return parts.join(', ');
  }

  async function handlePurge(e: FormEvent) {
    e.preventDefault();
    const hasFilter = Boolean(purgeUser) || purgeAge > 0 || Boolean(purgeVerdict) || purgeUnfinished;
    if (!hasFilter) {
      setError(t('Adj meg legalább egy feltételt, vagy használd az összes előzmény törlését lent.'));
      return;
    }
    if (!window.confirm(t('Törlés: {0}. Ez nem vonható vissza. Folytatod?', describePurge()))) return;
    await runPurge({
      userId: purgeUser || undefined,
      olderThanDays: purgeAge > 0 ? purgeAge : undefined,
      verdict: purgeVerdict || undefined,
      onlyUnfinished: purgeUnfinished
    });
  }

  async function handlePurgeAll() {
    const answer = window.prompt(t('A szervezet ÖSSZES vizsgálata törlődik, minden staffé. A megerősítéshez írd be: TÖRLÉS'));
    if (answer?.trim().toUpperCase() !== 'TÖRLÉS') return;
    await runPurge({ all: true });
  }

  async function runPurge(body: Parameters<typeof api.purgeAdminHistory>[0]) {
    setIsPurging(true);
    setError(null);
    try {
      const { deleted } = await api.purgeAdminHistory(body);
      setNotice(t('{0} vizsgálat törölve.', deleted));
      onChanged?.();
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Nem sikerült törölni.'));
    } finally {
      setIsPurging(false);
    }
  }

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="history" size={18} />{' '}{t('Összes vizsgálat')}</h2>
          <span className="muted small">{data ? t('{0} találat', data.total) : ''}</span>
        </div>

        <div className="admin-filters">
          <input
            type="search"
            placeholder={t('Kód, eredmény, Minecraft név, gépnév vagy staff...')}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label={t('Keresés')}
          />
          <select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} aria-label={t('Staff')}>
            <option value="">{t('Minden staff')}</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
          <select value={verdict} onChange={(e) => { setVerdict(e.target.value as ScanVerdict | ''); setPage(1); }} aria-label={t('Eredmény')}>
            <option value="">{t('Minden eredmény')}</option>
            <option value="Unlegit">{t('UNLEGIT')}</option>
            <option value="Inconclusive">{t('Nem egyértelmű')}</option>
            <option value="Legit">{t('LEGIT')}</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('Állapot')}>
            <option value="">{t('Minden állapot')}</option>
            <option value="Completed">{t('Sikeres')}</option>
            <option value="unfinished">{t('Befejezetlen')}</option>
          </select>
        </div>

        {canDelete && (
          <div className="bulk-bar">
            <span className="muted small">{selected.size > 0 ? t('{0} kijelölve', selected.size) : t('Jelöld ki, amit törölni szeretnél.')}</span>
            <button
              type="button"
              className="btn-ghost btn-tiny btn-danger"
              disabled={selected.size === 0}
              onClick={() => deleteCodes([...selected])}
            >
              <Icon name="trash" size={14} />{' '}{t('Kijelöltek törlése')}</button>
          </div>
        )}

        {notice && <p className="notice-text">{notice}</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="table-scroll">
          <table className="data-table admin-scans-table">
            <thead>
              <tr>
                <th className="check-col">
                  {canDelete && <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('Összes kijelölése ezen az oldalon')} />}
                </th>
                <th>{t('Kód')}</th>
                <th>{t('Időpont')}</th>
                <th>{t('Staff')}</th>
                <th>{t('Játékos / gép')}</th>
                <th className="align-right">{t('Találat')}</th>
                <th>{t('Eredmény')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 &&
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`sk-${i}`}><td colSpan={8}><Skeleton width="100%" /></td></tr>
                ))}
              {items.map((s, i) => (
                <tr key={s.code} className={`row-in ${selected.has(s.code) ? 'row-selected' : ''}`} style={{ animationDelay: `${Math.min(i, 15) * 25}ms` }}>
                  <td className="check-col">
                    {canDelete && <input type="checkbox" checked={selected.has(s.code)} onChange={() => toggle(s.code)} aria-label={t('#{0} kijelölése', s.code)} />}
                  </td>
                  <td className="mono">
                    {s.resultIdHash ? <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link> : <>#{s.code}</>}
                  </td>
                  <td className="muted small">{formatSecond(s.createdAt)}</td>
                  <td className="mono small">{s.createdByEmail ?? t('törölt felhasználó')}</td>
                  <td className="small">
                    {s.minecraftUsername ?? '-'}
                    {s.hostname && <span className="muted"> · {s.hostname}</span>}
                  </td>
                  <td className="align-right mono">{s.verdict ? s.findingCount : '-'}</td>
                  <td>
                    {s.verdict ? (
                      <span className={`verdict-badge verdict-${s.verdict.toLowerCase()}`}>{VERDICT_LABELS[s.verdict]}</span>
                    ) : (
                      <span className={`status-badge status-${s.status.toLowerCase()}`}>{STATUS_LABELS[s.status] ?? s.status}</span>
                    )}
                  </td>
                  <td>
                    {canDelete && (
                      <button type="button" className="icon-button row-delete" onClick={() => deleteCodes([s.code])} aria-label={t('#{0} törlése', s.code)} title={t('Törlés')}>
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={8} className="muted empty-row">{t('Nincs ilyen vizsgálat.')}</td></tr>
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

      {canPurge && (
        <section className="card section-gap stagger-in" style={{ animationDelay: '80ms' }}>
          <h2 className="card-title"><Icon name="trash" size={18} />{' '}{t('Előzmények tömeges törlése')}</h2>
          <p className="muted small">{t('A feltételek együtt érvényesek. A törölt vizsgálatok az eredményükkel és a megosztó linkjeikkel együtt tűnnek el; a tevékenységnaplóban megmarad, ki és mikor törölte.')}</p>
          <form className="purge-form" onSubmit={handlePurge}>
            <label>
              <span className="field-label">{t('Kié')}</span>
              <select value={purgeUser} onChange={(e) => setPurgeUser(e.target.value)}>
                <option value="">{t('Mindenkié')}</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">{t('Mikori')}</span>
              <select value={purgeAge} onChange={(e) => setPurgeAge(Number(e.target.value))}>
                {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">{t('Eredmény')}</span>
              <select value={purgeVerdict} onChange={(e) => setPurgeVerdict(e.target.value as ScanVerdict | '')}>
                <option value="">{t('Bármilyen')}</option>
                <option value="Legit">{t('Csak LEGIT')}</option>
                <option value="Inconclusive">{t('Csak nem egyértelmű')}</option>
                <option value="Unlegit">{t('Csak UNLEGIT')}</option>
              </select>
            </label>
            <label className="check-label">
              <input type="checkbox" checked={purgeUnfinished} onChange={(e) => setPurgeUnfinished(e.target.checked)} />{t('Csak a befejezetlenek (lejárt, fel nem használt vagy megszakadt kódok)')}</label>
            <div className="purge-actions">
              <button type="submit" className="btn-secondary" disabled={isPurging}>
                <Icon name="trash" size={15} /> {isPurging ? t('Törlés...') : t('Törlés a feltételek szerint')}
              </button>
              <button type="button" className="btn-ghost btn-danger" onClick={handlePurgeAll} disabled={isPurging}>{t('Összes előzmény törlése')}</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
