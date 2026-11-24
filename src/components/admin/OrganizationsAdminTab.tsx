import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { organizationsApi, type AdminOrganizationDetail, type AdminOrganizationRow } from '../../api/organizations';
import type { AdminSessionPage } from '../../api/types';
import { ROLE_LABELS } from '../../auth/permissions';
import { SUBSCRIPTION_STATUS_LABELS, formatDate, formatDateTime } from '../../store/format';
import { Icon } from '../Icon';
import { Skeleton } from '../motion';
import { formatSecond } from '../timeline';
import { AUDIT_ACTION_LABELS } from './auditLabels';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Várakozik',
  ClientConnected: 'Kliens csatlakozott',
  Scanning: 'Folyamatban',
  Completed: 'Sikeres',
  Interrupted: 'Megszakadt',
  Expired: 'Lejárt'
};

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'Nem egyértelmű'
};

function kindLabel(org: AdminOrganizationRow): string {
  if (org.isPlatform) return 'Platform';
  return org.isSubscription ? 'Előfizető' : 'Saját';
}

function OrganizationScans({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('');
  const [data, setData] = useState<AdminSessionPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      organizationsApi.sessions(id, { page, q: query.trim() || undefined, verdict: verdict || undefined })
        .then((d) => { if (alive) setData(d); })
        .catch((err) => { if (alive) setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a vizsgálatokat.'); });
    }, query ? 250 : 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [id, page, query, verdict]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className="card section-gap stagger-in" style={{ animationDelay: '120ms' }}>
      <div className="scans-head">
        <h2 className="card-title"><Icon name="history" size={18} /> Vizsgálatok</h2>
        <span className="muted small">{data ? `${data.total} találat` : ''}</span>
      </div>
      <div className="admin-filters">
        <input type="search" placeholder="Kód, Minecraft név, gépnév vagy staff..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} aria-label="Keresés" />
        <select value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(1); }} aria-label="Eredmény">
          <option value="">Minden eredmény</option>
          <option value="Unlegit">UNLEGIT</option>
          <option value="Inconclusive">Nem egyértelmű</option>
          <option value="Legit">LEGIT</option>
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr><th>Kód</th><th>Időpont</th><th>Staff</th><th>Játékos / gép</th><th className="align-right">Találat</th><th>Eredmény</th></tr>
          </thead>
          <tbody>
            {!data && Array.from({ length: 4 }, (_, i) => <tr key={`sk-${i}`}><td colSpan={6}><Skeleton width="100%" /></td></tr>)}
            {data?.items.map((s) => (
              <tr key={s.code}>
                <td className="mono">{s.resultIdHash ? <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link> : <>#{s.code}</>}</td>
                <td className="muted small">{formatSecond(s.createdAt)}</td>
                <td className="mono small">{s.createdByEmail ?? 'törölt felhasználó'}</td>
                <td className="small">{s.minecraftUsername ?? '-'}{s.hostname && <span className="muted"> · {s.hostname}</span>}</td>
                <td className="align-right mono">{s.verdict ? s.findingCount : '-'}</td>
                <td>
                  {s.verdict
                    ? <span className={`verdict-badge verdict-${s.verdict.toLowerCase()}`}>{VERDICT_LABELS[s.verdict]}</span>
                    : <span className={`status-badge status-${s.status.toLowerCase()}`}>{STATUS_LABELS[s.status] ?? s.status}</span>}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={6} className="muted empty-row">Nincs ilyen vizsgálat.</td></tr>}
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

function OrganizationDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [detail, setDetail] = useState<AdminOrganizationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    organizationsApi.detail(id)
      .then((d) => { if (alive) setDetail(d); })
      .catch((err) => { if (alive) setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a szervezetet.'); });
    return () => { alive = false; };
  }, [id]);

  const back = <button type="button" className="back-link org-back" onClick={onBack}><Icon name="arrow-right" size={15} className="flip-x" /> Vissza a szervezetekhez</button>;

  if (!detail) {
    return (
      <>
        {back}
        <section className="card">{error ? <p className="error-text">{error}</p> : <><Skeleton width="40%" /><Skeleton width="80%" style={{ marginTop: 12 }} /></>}</section>
      </>
    );
  }

  const { summary, owner, subscription, stats } = detail;
  const tiles = [
    { label: 'Vizsgálat összesen', value: stats.total },
    { label: 'Az elmúlt 30 napban', value: stats.last30Days },
    { label: 'LEGIT', value: stats.legit, tone: 'kpi-cool' },
    { label: 'UNLEGIT', value: stats.unlegit, tone: 'kpi-hot' },
    { label: 'Nem egyértelmű', value: stats.inconclusive },
    { label: 'Megszakadt', value: stats.interrupted }
  ];

  return (
    <>
      {back}
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="layers" size={18} /> {summary.name}</h2>
          <span className={`status-pill ${summary.hasAccess ? 'status-active' : 'status-ended'}`}>{kindLabel(summary)} · {summary.hasAccess ? 'van hozzáférése' : 'nincs hozzáférése'}</span>
        </div>
        <dl className="org-facts">
          <div><dt>Létrehozva</dt><dd>{formatDate(summary.createdAt)}</dd></div>
          <div><dt>Tagok</dt><dd>{summary.members}</dd></div>
          <div><dt>Utolsó vizsgálat</dt><dd>{summary.lastScanAt ? formatDateTime(summary.lastScanAt) : 'még nem volt'}</dd></div>
          <div><dt>PC Check plugin</dt><dd>{summary.pluginOwned ? `megvan · ${summary.activePluginKeys} aktív kulcs` : 'nincs megvéve'}</dd></div>
          {owner && <div><dt>Előfizető vásárló</dt><dd>{owner.email}{owner.minecraftUsername ? ` · ${owner.minecraftUsername}` : ''}{owner.isBanned ? ' · kitiltva' : ''}</dd></div>}
          {owner && <div><dt>Vásárlói fiók</dt><dd>regisztrált: {formatDate(owner.createdAt)} · utolsó belépés: {owner.lastLoginAt ? formatDateTime(owner.lastLoginAt) : '-'}</dd></div>}
          {subscription && (
            <div>
              <dt>Előfizetés</dt>
              <dd>
                {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
                {subscription.currentPeriodEnd ? ` · időszak vége: ${formatDate(subscription.currentPeriodEnd)}` : ''}
                {subscription.startedAt ? ` · indult: ${formatDate(subscription.startedAt)}` : ''}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <div className="kpi-grid section-gap">
        {tiles.map((tile, index) => (
          <div key={tile.label} className={`card kpi stagger-in ${tile.tone ?? ''}`} style={{ animationDelay: `${index * 40}ms` }}>
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
          </div>
        ))}
      </div>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <h2 className="card-title"><Icon name="users" size={18} /> Tagok</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>E-mail</th><th>Rang</th><th>Állapot</th><th>Utolsó belépés</th><th className="align-right">Vizsgálat</th></tr></thead>
            <tbody>
              {detail.members.map((m) => (
                <tr key={m.id}>
                  <td className="mono small">{m.email}{m.isPlatformAdmin && <span className="muted"> · platform admin</span>}</td>
                  <td>{ROLE_LABELS[m.role] ?? m.role}</td>
                  <td>{m.isActive ? <span className="status-pill status-active">Aktív</span> : <span className="status-pill status-ended">Kikapcsolva</span>}</td>
                  <td className="small muted">{m.lastLoginAt ? formatDateTime(m.lastLoginAt) : 'még nem'}</td>
                  <td className="align-right mono">{m.scans}</td>
                </tr>
              ))}
              {detail.members.length === 0 && <tr><td colSpan={5} className="muted empty-row">Nincs tagja.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <OrganizationScans id={id} />

      <section className="card section-gap stagger-in" style={{ animationDelay: '160ms' }}>
        <h2 className="card-title"><Icon name="key" size={18} /> Plugin-kulcsok</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Név</th><th>Kulcs</th><th>Létrehozva</th><th>Utoljára használva</th><th>Állapot</th></tr></thead>
            <tbody>
              {detail.pluginKeys.map((k) => (
                <tr key={k.prefix + k.createdAt}>
                  <td>{k.name}</td>
                  <td className="mono small">{k.prefix}</td>
                  <td className="small muted">{formatDateTime(k.createdAt)}</td>
                  <td className="small muted">{k.lastUsedAt ? formatDateTime(k.lastUsedAt) : 'még nem'}</td>
                  <td>{k.revokedAt ? <span className="status-pill status-ended">Visszavonva</span> : <span className="status-pill status-active">Aktív</span>}</td>
                </tr>
              ))}
              {detail.pluginKeys.length === 0 && <tr><td colSpan={5} className="muted empty-row">Nincs plugin-kulcs.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '200ms' }}>
        <h2 className="card-title"><Icon name="clock" size={18} /> Tevékenységnapló</h2>
        <p className="muted small">A szervezet legutóbbi 60 eseménye.</p>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Időpont</th><th>Ki</th><th>Mit</th></tr></thead>
            <tbody>
              {detail.audit.map((a, i) => (
                <tr key={`${a.createdAt}-${i}`}>
                  <td className="small muted">{formatSecond(a.createdAt)}</td>
                  <td className="mono small">{a.userEmail ?? '-'}</td>
                  <td className="small">{AUDIT_ACTION_LABELS[a.action] ?? a.action}</td>
                </tr>
              ))}
              {detail.audit.length === 0 && <tr><td colSpan={3} className="muted empty-row">Még nincs esemény.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function OrganizationsAdminTab() {
  const [rows, setRows] = useState<AdminOrganizationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(window.location.search).get('org'));

  const load = useCallback(() => {
    organizationsApi.list().then(setRows).catch((err) => setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a szervezeteket.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  function open(id: string | null) {
    setSelected(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('org', id);
    else url.searchParams.delete('org');
    window.history.replaceState(window.history.state, '', url.toString());
    window.scrollTo({ top: 0 });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((o) =>
      (kind === 'all' || (kind === 'subscription' ? o.isSubscription : !o.isSubscription))
      && (!q || o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q) || (o.ownerEmail ?? '').toLowerCase().includes(q)));
  }, [rows, query, kind]);

  if (selected) return <OrganizationDetail id={selected} onBack={() => open(null)} />;

  const subscribers = rows?.filter((o) => o.isSubscription) ?? [];

  return (
    <section className="card stagger-in">
      <div className="scans-head">
        <h2 className="card-title"><Icon name="layers" size={18} /> Szervezetek</h2>
        <span className="muted small">{rows ? `${rows.length} szervezet · ${subscribers.length} előfizető · ${subscribers.filter((o) => o.hasAccess).length} élő előfizetés` : ''}</span>
      </div>
      <p className="muted small">Az összes szervezet, az előfizetők saját szervezeteivel együtt. Egy sorra kattintva látod a tagjait, a vizsgálatait (az eredményekkel), az előfizetését és a plugin-kulcsait. Csak megtekintés, és minden megnyitás bekerül a saját tevékenységnaplódba.</p>
      <div className="admin-filters">
        <input type="search" placeholder="Név vagy előfizető e-mail..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Keresés" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Típus">
          <option value="all">Minden szervezet</option>
          <option value="subscription">Előfizetők</option>
          <option value="own">Saját / platform</option>
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="table-scroll">
        <table className="data-table org-table">
          <thead>
            <tr><th>Szervezet</th><th>Típus</th><th>Előfizetés</th><th className="align-right">Tagok</th><th className="align-right">Vizsgálat</th><th>Utolsó vizsgálat</th><th>Plugin</th></tr>
          </thead>
          <tbody>
            {!rows && Array.from({ length: 4 }, (_, i) => <tr key={`sk-${i}`}><td colSpan={7}><Skeleton width="100%" /></td></tr>)}
            {filtered.map((o) => (
              <tr key={o.id} className="org-row" tabIndex={0} onClick={() => open(o.id)} onKeyDown={(e) => { if (e.key === 'Enter') open(o.id); }}>
                <td>
                  <strong>{o.name}</strong>
                  {o.ownerEmail && <div className="mono small muted">{o.ownerEmail}</div>}
                </td>
                <td className="small">{kindLabel(o)}</td>
                <td className="small">
                  {o.isSubscription
                    ? <>{SUBSCRIPTION_STATUS_LABELS[o.subscriptionStatus ?? ''] ?? 'nincs'}{o.subscriptionEnd && <div className="muted">{formatDate(o.subscriptionEnd)}</div>}</>
                    : <span className="muted">nem kell</span>}
                </td>
                <td className="align-right mono">{o.members}</td>
                <td className="align-right mono">{o.scans}</td>
                <td className="small muted">{o.lastScanAt ? formatDateTime(o.lastScanAt) : '-'}</td>
                <td className="small">{o.pluginOwned ? `megvan${o.activePluginKeys ? ` · ${o.activePluginKeys} kulcs` : ''}` : <span className="muted">nincs</span>}</td>
              </tr>
            ))}
            {rows && filtered.length === 0 && <tr><td colSpan={7} className="muted empty-row">Nincs ilyen szervezet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
