import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AdminOverviewView, DailyCount } from '../../api/types';
import { Icon } from '../Icon';
import { CountUp, Skeleton } from '../motion';
import { formatSecond } from '../timeline';

interface Props {
  onOpenTab: (tab: string) => void;
}

const SERIES: { key: keyof Pick<DailyCount, 'legit' | 'inconclusive' | 'unlegit'>; label: string }[] = [
  { key: 'legit', label: 'Legit' },
  { key: 'inconclusive', label: 'Nem egyértelmű' },
  { key: 'unlegit', label: 'Unlegit' }
];

function dayLabel(date: string): string {
  const [, month, day] = date.split('-');
  return `${Number(month)}.${Number(day)}.`;
}

export function AdminOverviewTab({ onOpenTab }: Props) {
  const [overview, setOverview] = useState<AdminOverviewView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAdminOverview().then(setOverview).catch(() => setError('Nem sikerült betölteni az áttekintést.'));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!overview) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 6 }, (_, i) => <div className="card kpi" key={i}><Skeleton width="50%" height={30} /><Skeleton width="70%" /></div>)}
      </div>
    );
  }

  const maxDay = Math.max(1, ...overview.daily.map((d) => d.scans));
  const tiles: { label: string; value: number; tone?: string; hint?: string; tab?: string }[] = [
    { label: 'Befejezett vizsgálat', value: overview.completed, hint: `${overview.unfinished} befejezetlen kód`, tab: 'scans' },
    { label: 'Unlegit', value: overview.unlegit, tone: 'kpi-hot', tab: 'scans' },
    { label: 'Nem egyértelmű', value: overview.inconclusive, tone: 'kpi-warm', tab: 'scans' },
    { label: 'Legit', value: overview.legit, tone: 'kpi-cool', tab: 'scans' },
    { label: 'Elmúlt 24 óra', value: overview.last24Hours, hint: `7 nap: ${overview.last7Days} · 30 nap: ${overview.last30Days}` },
    { label: 'Felhasználó', value: overview.users, hint: `${overview.activeUsers} aktív · ${overview.admins} admin`, tab: 'users' },
    { label: 'Aktív megosztó link', value: overview.activeShareLinks, tab: 'settings' },
    { label: 'Kitiltott gép', value: overview.bannedHwids, tab: 'bans' }
  ];

  return (
    <>
      <div className="kpi-grid">
        {tiles.map((tile, index) => (
          <button
            type="button"
            key={tile.label}
            className={`card kpi stagger-in ${tile.tone ?? ''} ${tile.tab ? 'kpi-link' : ''}`}
            style={{ animationDelay: `${index * 40}ms` }}
            onClick={() => tile.tab && onOpenTab(tile.tab)}
            disabled={!tile.tab}
          >
            <strong><CountUp value={tile.value} duration={700} /></strong>
            <span>{tile.label}</span>
            {tile.hint && <small>{tile.hint}</small>}
          </button>
        ))}
      </div>

      <div className="panel-grid section-gap">
        <section className="card stagger-in" style={{ animationDelay: '120ms' }}>
          <div className="chart-head">
            <h2 className="card-title"><Icon name="activity" size={18} /> Vizsgálatok naponta, az elmúlt 14 napban</h2>
            <ul className="chart-legend" aria-label="Jelmagyarázat">
              {SERIES.map((series) => (
                <li key={series.key}><i className={`swatch swatch-${series.key}`} aria-hidden="true" />{series.label}</li>
              ))}
            </ul>
          </div>
          <div className="day-chart" role="img" aria-label="Napi vizsgálatok eredmény szerint">
            <span className="day-chart-max mono">{maxDay}</span>
            <div className="day-chart-plot">
              {overview.daily.map((day) => (
                <div className="day-col" key={day.date} tabIndex={0}>
                  <div className="day-bar" style={{ height: `${(day.scans / maxDay) * 100}%` }}>
                    {SERIES.map((series) =>
                      day[series.key] > 0 ? (
                        <span key={series.key} className={`day-seg swatch-${series.key}`} style={{ flexGrow: day[series.key] }} />
                      ) : null
                    )}
                  </div>
                  <span className="day-label mono">{dayLabel(day.date)}</span>
                  <span className="day-tip" role="tooltip">
                    <strong>{day.date.replaceAll('-', '. ')}.</strong>
                    <span>{day.scans} vizsgálat</span>
                    {SERIES.map((series) => (
                      <span key={series.key}><i className={`swatch swatch-${series.key}`} aria-hidden="true" />{series.label}: {day[series.key]}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card stagger-in" style={{ animationDelay: '180ms' }}>
          <h2 className="card-title"><Icon name="users" size={18} /> Ki mennyit vizsgált</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th className="align-right">Vizsgálat</th>
                  <th className="align-right">Unlegit</th>
                  <th>Utolsó</th>
                </tr>
              </thead>
              <tbody>
                {overview.staff.map((s) => (
                  <tr key={s.userId}>
                    <td className="mono small">{s.email}</td>
                    <td className="align-right mono">{s.scans}</td>
                    <td className="align-right mono">{s.unlegit}</td>
                    <td className="muted small">{s.lastScanAt ? formatSecond(s.lastScanAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
