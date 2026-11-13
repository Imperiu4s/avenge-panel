import { useState } from 'react';
import { formatCps, formatMs, isHotKind, type MacroDetailView } from './mouseDetails';

const VISIBLE_STEPS = 14;

function stepTone(step: string): string {
  if (/kattintás|egérgomb .*(le|fel)$/i.test(step)) return 'macro-step-click';
  if (/^várakozás/i.test(step)) return 'macro-step-delay';
  if (/^egér /i.test(step)) return 'macro-step-move';
  if (/billenty/i.test(step)) return 'macro-step-key';
  return 'macro-step-other';
}

export function MacroCard({ macro }: { macro: MacroDetailView }) {
  const [showAll, setShowAll] = useState(false);
  const hot = isHotKind(macro.kind);
  const steps = showAll ? macro.steps : macro.steps.slice(0, VISIBLE_STEPS);

  const stats: [string, string][] = [];
  if (macro.clicks > 0) stats.push(['Kattintás', `${macro.clicks}`]);
  if (macro.minClickIntervalMs !== null) stats.push(['Két kattintás között legalább', formatMs(macro.minClickIntervalMs)]);
  if (macro.minDelayMs !== null) stats.push(['Legrövidebb várakozás', formatMs(macro.minDelayMs)]);
  if (macro.totalMs > 0) stats.push([macro.repeat ? 'Egy kör ideje' : 'Teljes idő', formatMs(macro.totalMs)]);
  stats.push(['Lépések', `${macro.steps.length}`]);

  return (
    <article className={`macro-card ${hot ? 'macro-card-hot' : ''}`}>
      <header className="macro-card-head">
        <div>
          <strong className="macro-card-name">{macro.name}</strong>
          {macro.kind && <span className={`type-pill ${hot ? 'type-pill-hot' : ''}`}>{macro.kind}</span>}
        </div>
        {macro.clicksPerSecond !== null && (
          <span className={`macro-cps ${hot ? 'macro-cps-hot' : ''}`}>
            <b>{formatCps(macro.clicksPerSecond)}</b> kattintás/mp
          </span>
        )}
      </header>

      <dl className="macro-meta">
        <div><dt>Gomb / indító</dt><dd>{macro.trigger ?? 'nincs gombhoz rendelve (vagy nem olvasható ki)'}</dd></div>
        <div><dt>Ismétlés</dt><dd>{macro.repeat ?? 'egyszer fut le'}</dd></div>
      </dl>

      <div className="macro-stats">
        {stats.map(([label, value]) => (
          <span key={label}><small>{label}</small><b>{value}</b></span>
        ))}
      </div>

      {macro.steps.length > 0 && (
        <ol className="macro-steps">
          {steps.map((step, i) => (
            <li key={`${i}-${step}`} className={stepTone(step)}>
              <span className="macro-step-index">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      )}
      {macro.steps.length > VISIBLE_STEPS && (
        <button className="text-action change-more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Kevesebb lépés' : `Mind a ${macro.steps.length} lépés`}
        </button>
      )}
      {macro.source && <small className="macro-source mono">{macro.source}</small>}
    </article>
  );
}
