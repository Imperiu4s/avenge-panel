import { t } from '../i18n';
import type { FindingDto, ScanResultView } from '../api/types';
import { Icon } from './Icon';
import { HIT_KIND_LABELS, isSignal, rankHits, type PrimaryHit } from './primaryHit';
import { relationToGame } from './minecraftSessions';
import { beforeScan, formatSecond } from './timeline';

const SEVERITY_LABELS: Record<string, string> = {
  Critical: t('Kritikus'),
  High: t('Magas'),
  Medium: t('Közepes'),
  Low: t('Alacsony'),
  Info: 'Info'
};

const MAX_OTHERS = 4;

interface Props {
  result: ScanResultView;
  onReveal: (finding: FindingDto) => void;
}

export function PrimaryHitCard({ result, onReveal }: Props) {
  const ranked = rankHits(result.findings, result.createdAt);
  const signals = ranked.filter(isSignal);
  const primary = signals[0] ?? null;
  const others = signals.slice(1);
  const cheatCount = signals.filter((h) => h.kind === 'cheat').length;
  const clickerCount = signals.filter((h) => h.kind === 'autoclicker').length;
  const faint = primary ? null : ranked[0] ?? null;
  const relation = primary ? relationToGame(primary.when, result.minecraftSessions) : null;

  if (!primary) {
    return (
      <section className="card primary-hit primary-hit-clean stagger-in" style={{ animationDelay: '120ms' }}>
        <div className="primary-hit-head">
          <h2 className="card-title"><Icon name="target" size={18} />{' '}{t('Mire jelzett')}</h2>
        </div>
        <p className="primary-hit-none">
          <Icon name="check" size={18} />{' '}{t('Nem talált csalást vagy autoclickert ezen a gépen.')}</p>
        {faint && (
          <p className="muted small primary-hit-faint">{t('Leggyengébb nyom, ami nem számít jelzésnek:')}{' '}{faint.name}
            {' '}({SEVERITY_LABELS[faint.finding.severity]?.toLowerCase()}).
          </p>
        )}
      </section>
    );
  }

  return (
    <section className={`card primary-hit primary-hit-${primary.kind} stagger-in`} style={{ animationDelay: '120ms' }}>
      <div className="primary-hit-head">
        <h2 className="card-title"><Icon name="target" size={18} />{' '}{t('Mire jelzett')}</h2>
        <div className="primary-hit-counts">
          <span className={cheatCount > 0 ? 'hit-count hit-count-cheat' : 'hit-count'}>{cheatCount}{' '}{t('csalás')}</span>
          <span className={clickerCount > 0 ? 'hit-count hit-count-autoclicker' : 'hit-count'}>{clickerCount}{' '}{t('autoclicker')}</span>
        </div>
      </div>

      <div className="primary-hit-main">
        <span className={`hit-kind hit-kind-${primary.kind}`}>{HIT_KIND_LABELS[primary.kind]}</span>
        <div className="primary-hit-body">
          <p className="primary-hit-name">{primary.name}</p>
          <p className="primary-hit-label">{primary.finding.label}</p>
          <dl className="primary-hit-facts">
            <div>
              <dt>{t('Súly')}</dt>
              <dd>
                <span className={`severity-badge severity-${primary.finding.severity.toLowerCase()}`}>
                  {SEVERITY_LABELS[primary.finding.severity]}
                </span>
              </dd>
            </div>
            {primary.reason && (
              <div className="primary-hit-wide">
                <dt>{t('Miért')}</dt>
                <dd>{primary.reason}</dd>
              </div>
            )}
            {primary.finding.filePath && (
              <div className="primary-hit-wide">
                <dt>{t('Hol')}</dt>
                <dd className="mono">{primary.finding.filePath}</dd>
              </div>
            )}
            {primary.downloadedFrom && (
              <div className="primary-hit-wide">
                <dt>{t('Letöltve innen')}</dt>
                <dd className="mono">{primary.downloadedFrom}</dd>
              </div>
            )}
            {primary.when && (
              <div>
                <dt>{primary.whenLabel}</dt>
                <dd>
                  <span className="mono">{formatSecond(primary.when)}</span>
                  <small> · {beforeScan(primary.when, result.createdAt)}</small>
                </dd>
              </div>
            )}
            {relation && (
              <div className="primary-hit-wide">
                <dt>{t('A Minecrafthez képest')}</dt>
                <dd className={relation.during ? 'mc-relation mc-during' : 'mc-relation'}>
                  {relation.during && <Icon name="alert" size={14} />} {relation.text}
                </dd>
              </div>
            )}
            <div>
              <dt>{t('Forrás')}</dt>
              <dd>{primary.finding.source}</dd>
            </div>
          </dl>
          <button type="button" className="btn-ghost btn-tiny primary-hit-reveal" onClick={() => onReveal(primary.finding)}>{t('Részletek és idővonal')}{' '}<Icon name="arrow-right" size={13} />
          </button>
        </div>
      </div>

      {others.length > 0 && (
        <div className="primary-hit-others">
          <span className="primary-hit-others-title">{t('Ezen kívül még')}</span>
          <ul>
            {others.slice(0, MAX_OTHERS).map((hit, index) => (
              <OtherHit key={`${hit.finding.label}-${index}`} hit={hit} sessions={result.minecraftSessions} onReveal={onReveal} />
            ))}
          </ul>
          {others.length > MAX_OTHERS && (
            <p className="muted small">{t('és további')}{' '}{others.length - MAX_OTHERS}{' '}{t('jelzés a találatok között.')}</p>
          )}
        </div>
      )}
    </section>
  );
}

function OtherHit({ hit, sessions, onReveal }: { hit: PrimaryHit; sessions: ScanResultView['minecraftSessions']; onReveal: (finding: FindingDto) => void }) {
  const relation = relationToGame(hit.when, sessions);
  return (
    <li>
      <button type="button" className="primary-hit-other" onClick={() => onReveal(hit.finding)}>
        <span className={`hit-kind hit-kind-small hit-kind-${hit.kind}`}>{HIT_KIND_LABELS[hit.kind]}</span>
        <span className="primary-hit-other-name">{hit.name}</span>
        <span className={`severity-badge severity-${hit.finding.severity.toLowerCase()}`}>
          {SEVERITY_LABELS[hit.finding.severity]}
        </span>
        {relation?.during && <span className="mc-chip">{t('a játék mellett')}</span>}
      </button>
    </li>
  );
}
