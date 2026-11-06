import { useMemo, useState } from 'react';
import type { FindingDto } from '../api/types';
import { Icon } from './Icon';
import { actionTone, beforeScan, eventTiming, parseEvents, type TimelineEvent } from './timeline';

// A teljes vizsgálat egyetlen, másodpercre pontos idővonalon: minden találat eseményei
// ("Események") és az egérprogramok változásai ("Változások") időrendben, a találat nevével.

interface Entry extends TimelineEvent {
  finding: string;
  severity: string;
}

const FILTERS: { key: string; label: string; match: (e: Entry) => boolean }[] = [
  { key: 'all', label: 'Mind', match: () => true },
  { key: 'run', label: 'Indítások', match: (e) => /elindítva/i.test(e.action) },
  { key: 'file', label: 'Fájlműveletek', match: (e) => /létrehozva|módosít|átnevezve|letöltve|tartalom/i.test(e.action) },
  { key: 'delete', label: 'Törlések', match: (e) => /törölve|lomtárba|eltávolította/i.test(e.action) },
  { key: 'mouse', label: 'Egér: gomb, makró, profil', match: (e) => /gomb|makró|profil|beállítás/i.test(e.action) },
  { key: 'defender', label: 'Defender', match: (e) => /defender/i.test(e.action) }
];

const PAGE = 60;

export function ScanTimeline({ findings, scanTime }: { findings: FindingDto[]; scanTime: string }) {
  const [filter, setFilter] = useState('all');
  const [visible, setVisible] = useState(PAGE);

  const entries = useMemo<Entry[]>(() => {
    const all = findings.flatMap((f) =>
      [...parseEvents(f.details?.['Események']), ...parseEvents(f.details?.['Változások'])].map((e) => ({
        ...e,
        finding: f.label,
        severity: f.severity
      }))
    );
    const seen = new Set<string>();
    return all
      .filter((e) => {
        const key = `${e.time}|${e.action}|${e.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [findings]);

  if (entries.length === 0) {
    return null;
  }

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const filtered = entries.filter(active.match);

  return (
    <section className="card section-gap stagger-in" style={{ animationDelay: '200ms' }}>
      <h2 className="card-title"><Icon name="clock" size={18} /> Idővonal</h2>
      <p className="muted small">
        Minden esemény másodpercre, a legfrissebbel kezdve. A „pontos” jelzésűeket a Windows rögzítette (NTFS-napló,
        Prefetch, Lomtár, Defender); a fájlok saját dátuma utólag átírható, az NTFS-napló nem.
      </p>

      <div className="timeline-filters">
        {FILTERS.map((f) => {
          const count = entries.filter(f.match).length;
          return count > 0 || f.key === 'all' ? (
            <button
              key={f.key}
              className={`filter-chip ${filter === f.key ? 'filter-chip-active' : ''}`}
              onClick={() => { setFilter(f.key); setVisible(PAGE); }}
            >
              {f.label} <span>{count}</span>
            </button>
          ) : null;
        })}
      </div>

      <ol className="scan-timeline">
        {filtered.slice(0, visible).map((e, i) => {
          const timing = eventTiming(e);
          return (
            <li key={`${e.time}-${i}`} className={`scan-timeline-item scan-timeline-${e.severity.toLowerCase()}`}>
              <time className="scan-timeline-time mono">{timing.text}</time>
              <span className={`tl-action ${actionTone(e.action)}`}>{e.action}</span>
              <div className="scan-timeline-body">
                <p>{e.text}</p>
                <small>
                  {e.finding} · {beforeScan(e.time, scanTime)}{e.source ? ` · ${e.source}` : ''}
                  {timing.tone !== 'exact' && <span className={`timing-badge timing-${timing.tone}`}>{timing.badge}</span>}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
      {filtered.length > visible && (
        <button className="btn-ghost btn-tiny timeline-more" onClick={() => setVisible((v) => v + PAGE)}>
          Még {Math.min(PAGE, filtered.length - visible)} esemény ({filtered.length - visible} van hátra)
        </button>
      )}
    </section>
  );
}
