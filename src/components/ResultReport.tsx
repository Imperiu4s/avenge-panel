import { Fragment, useState, type ReactNode } from 'react';
import type { FindingDto, ScanResultView } from '../api/types';
import { Icon, type IconName } from './Icon';
import { CountUp } from './motion';
import { MouseSoftwareSection } from './MouseSoftwareSection';
import { PrimaryHitCard } from './PrimaryHitCard';
import { ScanTimeline } from './ScanTimeline';
import { actionTone, beforeScan, eventTiming, formatSecond, parseEvents } from './timeline';

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'NEM EGYÉRTELMŰ'
};

const VERDICT_TEXT: Record<string, string> = {
  Legit: 'Nem volt komoly találat ezen a gépen.',
  Unlegit: 'Magas vagy kritikus súlyú találat, vagy kitiltott gép.',
  Inconclusive: 'Közepes súlyú találat. Nézd át a részleteket, és döntsd el.'
};

const ACCORDION_CATEGORIES: { category: FindingDto['category']; label: string; icon: IconName }[] = [
  { category: 'AltAccount', label: 'Másodfiókok', icon: 'users' },
  { category: 'RecordingSoftware', label: 'Felvevő szoftverek', icon: 'video' },
  { category: 'XrayTexturePack', label: 'X-ray textúracsomagok', icon: 'gamepad' },
  { category: 'VpnOrProxy', label: 'VPN / proxy', icon: 'globe' }
];

const TYPE_LABELS: Record<string, string> = {
  CheatSignature: 'Csalás',
  SuspiciousSavedFile: 'Gyanús fájl',
  SuspiciousDeletedFile: 'Törölt fájl',
  Injector: 'Injektor',
  VmSandbox: 'VM / sandbox',
  TamperAttempt: 'Nyomeltüntetés'
};

const SEVERITY_LABELS: Record<string, string> = {
  Critical: 'Kritikus',
  High: 'Magas',
  Medium: 'Közepes',
  Low: 'Alacsony',
  Info: 'Info'
};

const SEVERITY_ORDER: FindingDto['severity'][] = ['Critical', 'High', 'Medium', 'Low', 'Info'];

function groupByCategory(findings: FindingDto[]): Record<string, FindingDto[]> {
  return findings.reduce<Record<string, FindingDto[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});
}

function formatRelativeToNow(iso: string | null): string {
  if (!iso) return 'nincs adat';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return 'nincs adat';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'most';
  if (minutes < 60) return `${minutes} perce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} órája`;
  return `${Math.floor(hours / 24)} napja`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} mp`;
  return `${Math.floor(totalSeconds / 60)} p ${totalSeconds % 60} mp`;
}

interface Props {
  result: ScanResultView;
  aside?: ReactNode;
}

export function ResultReport({ result, aside }: Props) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);

  const grouped = groupByCategory(result.findings);
  const mouseFindings = grouped.MouseSoftware ?? [];
  const mouseProductCount = mouseFindings.filter((f) => f.details?.['Gyártó']).length;
  const mouseMacroCount = mouseFindings.filter((f) => f.details?.['Makró típusa']).length;
  const mainFindings = result.findings
    .filter((f) => f.category !== 'MouseSoftware' && !ACCORDION_CATEGORIES.some((a) => a.category === f.category))
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  const savedCount = (grouped.SuspiciousSavedFile ?? []).length;
  const deletedCount = (grouped.SuspiciousDeletedFile ?? []).length;
  const cheatCount = (grouped.CheatSignature ?? []).length + (grouped.Injector ?? []).length;
  const verdictKey = result.verdict.toLowerCase();

  function reveal(finding: FindingDto) {
    const index = mainFindings.indexOf(finding);
    if (index >= 0) {
      setExpandedFinding(index);
      window.setTimeout(() => {
        document.getElementById(`finding-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 30);
      return;
    }
    if (finding.category === 'MouseSoftware') {
      document.getElementById('mouse-software')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (ACCORDION_CATEGORIES.some((a) => a.category === finding.category)) {
      setOpenAccordion(finding.category);
      window.setTimeout(() => {
        document.getElementById(`accordion-${finding.category}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 30);
    }
  }

  return (
    <>
      <div className="result-top">
        <section className={`card verdict-card verdict-card-${verdictKey} stagger-in`}>
          <span className="verdict-print" aria-hidden="true">
            <Icon name="fingerprint" size={46} />
            <span className="verdict-print-scan" />
          </span>
          <div>
            <span className="eyebrow">Verdikt</span>
            <div className="verdict-stamp">{VERDICT_LABELS[result.verdict] ?? result.verdict}</div>
            <p className="muted">{VERDICT_TEXT[result.verdict]}</p>
          </div>
        </section>

        <section className="card stagger-in" style={{ animationDelay: '90ms' }}>
          <h2 className="card-title"><Icon name="cpu" size={18} /> A gép adatai</h2>
          <dl className="fact-grid">
            {result.minecraftUsername && (
              <div><dt>Minecraft név</dt><dd>{result.minecraftUsername}</dd></div>
            )}
            <div><dt>Gépnév</dt><dd>{result.system.hostname}</dd></div>
            <div><dt>Operációs rendszer</dt><dd>{result.system.osVersion}</dd></div>
            <div><dt>Lomtár utoljára ürítve</dt><dd>{formatRelativeToNow(result.system.recycleBinLastEmptiedAt)}</dd></div>
            <div><dt>Vizsgálat ideje</dt><dd>{formatSecond(result.createdAt)}</dd></div>
            <div><dt>Időtartam</dt><dd>{formatDuration(result.scanDurationMs)}</dd></div>
            <div><dt>Kliens verzió</dt><dd className="mono">{result.clientVersion}</dd></div>
          </dl>
        </section>
      </div>

      <PrimaryHitCard result={result} onReveal={reveal} />

      {aside}

      <div className="tally-row stagger-in" style={{ animationDelay: '150ms' }}>
        <div className={`tally ${cheatCount > 0 ? 'tally-hot' : ''}`}>
          <Icon name="bug" size={20} />
          <strong><CountUp value={cheatCount} duration={700} /></strong>
          <span>Csalásnyom</span>
        </div>
        <div className={`tally ${savedCount > 0 ? 'tally-warm' : ''}`}>
          <Icon name="file" size={20} />
          <strong><CountUp value={savedCount} duration={700} /></strong>
          <span>Gyanús fájl</span>
        </div>
        <div className={`tally ${deletedCount > 0 ? 'tally-warm' : ''}`}>
          <Icon name="trash" size={20} />
          <strong><CountUp value={deletedCount} duration={700} /></strong>
          <span>Törölt fájl nyoma</span>
        </div>
        <div className={`tally ${mouseMacroCount > 0 ? 'tally-hot' : ''}`}>
          <Icon name="activity" size={20} />
          <strong><CountUp value={mouseProductCount} duration={700} /></strong>
          <span>Egérprogram{mouseMacroCount > 0 ? `, ${mouseMacroCount} gyanús makró` : ''}</span>
        </div>
      </div>

      <section className="card section-gap stagger-in" style={{ animationDelay: '210ms' }}>
        <h2 className="card-title"><Icon name="search" size={18} /> Találatok</h2>
        <div className="table-scroll">
          <table className="data-table findings-table">
            <thead>
              <tr>
                <th>Típus</th>
                <th>Súly</th>
                <th>Részlet</th>
              </tr>
            </thead>
            <tbody>
              {mainFindings.map((f, i) => {
                const isExpanded = expandedFinding === i;
                return (
                  <Fragment key={i}>
                    <tr
                      id={`finding-${i}`}
                      className={`row-in finding-row ${isExpanded ? 'finding-row-open' : ''}`}
                      style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
                      onClick={() => setExpandedFinding(isExpanded ? null : i)}
                      title="Kattints a részletekért"
                    >
                      <td><span className="type-pill">{TYPE_LABELS[f.category] ?? f.category}</span></td>
                      <td><span className={`severity-badge severity-${f.severity.toLowerCase()}`}>{SEVERITY_LABELS[f.severity] ?? f.severity}</span></td>
                      <td className="mono small">
                        <span className="finding-row-text">{f.filePath ?? f.label}</span>
                        <span className={`finding-row-chevron ${isExpanded ? 'finding-row-chevron-open' : ''}`}>
                          <Icon name="arrow-right" size={12} />
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="finding-detail-row">
                        <td colSpan={3}>
                          <div className="finding-detail">
                            <p className="finding-detail-label">{f.label}</p>
                            <dl className="finding-detail-grid">
                              <dt>Forrás</dt>
                              <dd>{f.source}</dd>
                              {f.foundAt && (
                                <>
                                  <dt>Időpont</dt>
                                  <dd>{formatSecond(f.foundAt)}</dd>
                                </>
                              )}
                              {f.filePath && (
                                <>
                                  <dt>Elérési út</dt>
                                  <dd className="mono">{f.filePath}</dd>
                                </>
                              )}
                              {f.details &&
                                Object.entries(f.details)
                                  .filter(([key]) => key !== 'Események')
                                  .map(([key, value]) => (
                                    <Fragment key={key}>
                                      <dt>{key}</dt>
                                      <dd>{value}</dd>
                                    </Fragment>
                                  ))}
                              {f.fileHashSha256 && (
                                <>
                                  <dt>SHA-256</dt>
                                  <dd className="mono finding-detail-hash">{f.fileHashSha256}</dd>
                                </>
                              )}
                            </dl>
                            {parseEvents(f.details?.['Események']).length > 0 && (
                              <ol className="finding-events">
                                {parseEvents(f.details?.['Események']).map((event, index) => (
                                  <li key={`${event.time}-${index}`}>
                                    <time className="mono">{eventTiming(event).text}</time>
                                    <span className={`tl-action ${actionTone(event.action)}`}>{event.action}</span>
                                    <span className="finding-event-text">
                                      {event.text}
                                      <small> · {beforeScan(event.time, result.createdAt)} · {event.source}</small>
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {mainFindings.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted empty-row">Nincs találat ezekben a kategóriákban.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div id="mouse-software">
        <MouseSoftwareSection findings={mouseFindings} scanTime={result.createdAt} clientVersion={result.clientVersion} />
      </div>

      <ScanTimeline findings={result.findings} scanTime={result.createdAt} />

      <div className="accordion-grid">
        {ACCORDION_CATEGORIES.map(({ category, label, icon }, index) => {
          const items = grouped[category] ?? [];
          const isOpen = openAccordion === category;
          return (
            <div
              id={`accordion-${category}`}
              className={`card accordion-item stagger-in ${isOpen ? 'accordion-item-open' : ''}`}
              key={category}
              style={{ animationDelay: `${260 + index * 60}ms` }}
            >
              <button className="accordion-trigger" onClick={() => setOpenAccordion(isOpen ? null : category)} aria-expanded={isOpen}>
                <span className="accordion-icon"><Icon name={icon} size={19} /></span>
                <span className="accordion-label">{label}</span>
                <span className={`count-chip ${items.length > 0 ? 'count-chip-hot' : ''}`}>{items.length}</span>
                <span className="accordion-chevron"><Icon name="arrow-right" size={14} /></span>
              </button>
              <div className="accordion-panel-wrapper">
                <div className="accordion-panel-inner">
                  <div className="accordion-panel">
                    {items.length === 0 && <p className="muted small">Nincs találat ebben a kategóriában.</p>}
                    {items.map((f, i) => (
                      <div className="accordion-finding" key={i}>
                        <span className="mono small">{f.filePath ?? f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
