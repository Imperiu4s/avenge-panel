import { useState } from 'react';
import type { FindingDto } from '../api/types';
import { Icon } from './Icon';
import {
  actionTone,
  beforeScan,
  changeTiming,
  eventTiming,
  formatSecond,
  parseChanges,
  parseEvents,
  type TimedChange
} from './timeline';

// A detektor (client: MouseSoftwareDetector) és a szerver (MouseSoftwareComparison) közös
// megállapodása: a találat fajtáját a Details kulcsai jelölik. A "Változások" a fájlszintű
// idővonal, a "Tartalmi változások" a gombonkénti/makrónkénti különbség, a "Gombkiosztás" a
// jelenlegi kiosztás (profil, gomb, művelet) - mind tabulátorral tagolt sorok.

const SEVERITY_LABELS: Record<string, string> = {
  Critical: 'Kritikus',
  High: 'Magas',
  Medium: 'Közepes',
  Low: 'Alacsony',
  Info: 'Info'
};

const SEVERITY_RANK: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 };

const KIND_ORDER: Record<string, number> = { Gomb: 0, Makró: 1, Profil: 2, Beállítás: 3, Összesítés: 4 };

function detail(finding: FindingDto, key: string): string | null {
  return finding.details?.[key] ?? null;
}

function splitLines(value: string | null): string[] {
  return value ? value.split('\n').filter(Boolean) : [];
}

function splitNames(value: string | null): string[] {
  return value ? value.split(', ').filter(Boolean) : [];
}

interface Binding {
  profile: string;
  button: string;
  action: string;
}

function parseBindings(value: string | null): Binding[] {
  return splitLines(value).flatMap((line) => {
    const [profile, button, action] = line.split('\t');
    return button && action ? [{ profile: profile ?? '', button, action }] : [];
  });
}

/** A 2.1.0 előtti kliensek még nem nézték az egérprogramokat: náluk a hiány nem jelent semmit. */
function checksMouseSoftware(clientVersion: string): boolean {
  const [major, minor] = clientVersion.split('.').map(Number);
  return major > 2 || (major === 2 && minor >= 1);
}

function ChangeList({ changes, scanTime, limit = 12 }: { changes: TimedChange[]; scanTime: string; limit?: number }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...changes].sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9));
  const visible = showAll ? sorted : sorted.slice(0, limit);

  return (
    <>
      <ul className="change-list">
        {visible.map((change, i) => {
          const timing = changeTiming(change);
          return (
            <li key={`${change.text}-${i}`} className={`change-item change-${change.kind === 'Gomb' || change.kind === 'Makró' ? 'hot' : 'calm'}`}>
              <span className="change-kind">{change.kind}</span>
              <div className="change-body">
                <p>{change.text}</p>
                <small>
                  <span className={`timing-badge timing-${timing.tone}`}>{timing.badge}</span>
                  {timing.text}
                  {change.exact && ` · ${beforeScan(change.exact, scanTime)}`}
                </small>
                {change.basis && <small className="change-basis">{change.basis}{change.file ? ` · ${change.file}` : ''}</small>}
              </div>
            </li>
          );
        })}
      </ul>
      {sorted.length > limit && (
        <button className="text-action change-more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Kevesebb' : `Mind a ${sorted.length} változás`}
        </button>
      )}
    </>
  );
}

function ProductCard({
  product,
  macros,
  change,
  scanTime
}: {
  product: FindingDto;
  macros: FindingDto[];
  change: FindingDto | undefined;
  scanTime: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const state = detail(product, 'Állapot') ?? '';
  const activeProfiles = splitNames(detail(product, 'Aktív profil'));
  const profiles = splitNames(detail(product, 'Profilok'));
  const macroNames = splitNames(detail(product, 'Makrók'));
  const warnings = splitLines(detail(product, 'Figyelmeztetések'));
  const notes = splitLines(detail(product, 'Megjegyzések'));
  const folders = splitLines(detail(product, 'Mappák'));
  const timeline = parseEvents(detail(product, 'Változások'));
  const contentChanges = parseChanges(detail(product, 'Tartalmi változások'));
  const bindings = parseBindings(detail(product, 'Gombkiosztás'));
  const compareChanges = change ? parseChanges(detail(change, 'Tartalmi változások')) : [];
  const bundled = detail(product, 'Gyári makrók');
  const started = detail(product, 'Indult');
  const lastRun = detail(product, 'Utolsó futás');
  const suspiciousNames = new Set(macros.map((m) => detail(m, 'Makró neve')));
  const bindingProfiles = [...new Set(bindings.map((b) => b.profile))];

  const facts: [string, string][] = [];
  if (detail(product, 'Verzió')) facts.push(['Verzió', detail(product, 'Verzió')!]);
  if (started) facts.push(['Most futó példány indult', formatSecond(started)]);
  if (lastRun) facts.push(['Utolsó futás', formatSecond(lastRun)]);
  if (detail(product, 'Futtatások száma')) facts.push(['Futtatások száma', detail(product, 'Futtatások száma')!]);
  if (bundled) facts.push(['Gyári mintamakrók', `${bundled} db (nem számítanak)`]);
  if (detail(product, 'Felderítve')) facts.push(['Honnan tudjuk', detail(product, 'Felderítve')!]);

  const latestContent = contentChanges.find((c) => c.exact);

  return (
    <div className={`mouse-card ${isOpen ? 'mouse-card-open' : ''}`}>
      <button className="mouse-card-head" onClick={() => setIsOpen((v) => !v)} aria-expanded={isOpen}>
        <span className={`mouse-state mouse-state-${state === 'Fut' ? 'run' : state === 'Csak nyomok' ? 'trace' : 'idle'}`}>
          <i aria-hidden="true" /> {state}
        </span>
        <span className="mouse-card-title">
          <strong>{product.label}</strong>
          <small>{detail(product, 'Típus')} · {detail(product, 'Gyártó')}</small>
        </span>
        <span className="mouse-card-summary">
          {activeProfiles.length > 0 && <span>Aktív profil: <b>{activeProfiles.join(', ')}</b></span>}
          {bindings.length > 0 && <span>{bindings.length} gombkiosztás</span>}
          {macroNames.length > 0 && <span className={macros.length > 0 ? 'mouse-hot' : ''}>{macroNames.length} makró</span>}
          {contentChanges.length > 0 && <span className="mouse-hot">{contentChanges.length} tartalmi változás</span>}
          {latestContent?.exact
            ? <span>Utolsó átállítás: <b>{formatSecond(latestContent.exact)}</b></span>
            : timeline.length > 0 && <span>Utolsó változás: {beforeScan(timeline[0].time, scanTime)}</span>}
        </span>
        {product.severity !== 'Info' && (
          <span className={`severity-badge severity-${product.severity.toLowerCase()}`}>
            {SEVERITY_LABELS[product.severity] ?? product.severity}
          </span>
        )}
        <span className="accordion-chevron"><Icon name="arrow-right" size={14} /></span>
      </button>

      <div className="accordion-panel-wrapper">
        <div className="accordion-panel-inner">
          <div className="mouse-card-body">
            {warnings.length > 0 && (
              <ul className="mouse-warnings">
                {warnings.map((w) => <li key={w}><Icon name="alert" size={15} /> {w}</li>)}
              </ul>
            )}

            {contentChanges.length > 0 && (
              <div className="mouse-block">
                <h4>Pontosan mi változott</h4>
                <ChangeList changes={contentChanges} scanTime={scanTime} />
              </div>
            )}

            {change && (
              <div className="mouse-compare">
                <h4><Icon name="history" size={15} /> Az előző vizsgálat óta ({formatSecond(detail(change, 'Előző vizsgálat') ?? scanTime)})</h4>
                {compareChanges.length > 0
                  ? <ChangeList changes={compareChanges} scanTime={scanTime} limit={8} />
                  : <p className="muted small">{change.label}</p>}
              </div>
            )}

            <div className="mouse-columns">
              <div>
                {bindings.length > 0 && (
                  <>
                    <h4>Gombkiosztás most</h4>
                    {bindingProfiles.map((profile) => (
                      <div className="binding-group" key={profile || 'nincs'}>
                        {profile && <span className={`binding-profile ${activeProfiles.includes(profile) ? 'binding-profile-active' : ''}`}>{profile}</span>}
                        <table className="binding-table">
                          <tbody>
                            {bindings.filter((b) => b.profile === profile).map((b) => (
                              <tr key={`${b.profile}-${b.button}`}>
                                <td className="mono">{b.button}</td>
                                <td className={suspiciousNames.has(b.action) || macroNames.includes(b.action) ? 'mouse-hot' : ''}>{b.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </>
                )}

                <h4>Profilok</h4>
                {profiles.length === 0 && <p className="muted small">Nem olvasható ki a programból.</p>}
                <div className="mouse-chips">
                  {profiles.map((p) => (
                    <span key={p} className={activeProfiles.includes(p) ? 'mouse-chip mouse-chip-active' : 'mouse-chip'}>{p}</span>
                  ))}
                </div>

                <h4>Makrók</h4>
                {macroNames.length === 0 && <p className="muted small">Nem találtunk saját makrót.</p>}
                <div className="mouse-chips">
                  {macroNames.map((m) => (
                    <span key={m} className={suspiciousNames.has(m) ? 'mouse-chip mouse-chip-hot' : 'mouse-chip'}>{m}</span>
                  ))}
                </div>
                {macros.map((m) => (
                  <div className="mouse-macro" key={m.label}>
                    <strong>{detail(m, 'Makró neve')}</strong>
                    <span className="type-pill">{detail(m, 'Makró típusa')}</span>
                    <small>
                      {[
                        detail(m, 'Kattintások') && `${detail(m, 'Kattintások')} kattintás`,
                        detail(m, 'Legkisebb késleltetés') && `legkisebb késleltetés: ${detail(m, 'Legkisebb késleltetés')}`,
                        detail(m, 'Egérmozgatások') && `${detail(m, 'Egérmozgatások')} egérmozgatás`,
                        detail(m, 'Ismétlődik') && 'ismétlődik'
                      ].filter(Boolean).join(' · ')}
                    </small>
                  </div>
                ))}

                {notes.map((n) => <p className="muted small mouse-note" key={n}>{n}</p>)}

                <dl className="mouse-facts">
                  {facts.map(([key, value]) => (
                    <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
                {folders.length > 0 && (
                  <details className="mouse-folders">
                    <summary>Mappák ({folders.length})</summary>
                    {folders.map((f) => <div className="mono small" key={f}>{f}</div>)}
                  </details>
                )}
              </div>

              <div>
                <h4>Idővonal (másodpercre, az elmúlt 30 napból)</h4>
                {timeline.length === 0 && <p className="muted small">Nem látszik változás ebben az időszakban.</p>}
                {timeline.length > 0 && (
                  <ol className="mouse-timeline">
                    {timeline.map((item, i) => {
                      const timing = eventTiming(item);
                      return (
                        <li key={`${item.time}-${i}`}>
                          <span className={`tl-action ${actionTone(item.action)}`}>{item.action}</span>
                          <div>
                            <p>{item.text}</p>
                            <small>{timing.text} · {beforeScan(item.time, scanTime)}{item.source ? ` · ${item.source}` : ''}</small>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MouseSoftwareSection({
  findings,
  scanTime,
  clientVersion
}: {
  findings: FindingDto[];
  scanTime: string;
  clientVersion: string;
}) {
  const devices = findings.filter((f) => detail(f, 'VID'));
  const products = findings
    .filter((f) => detail(f, 'Gyártó'))
    .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || a.label.localeCompare(b.label, 'hu'));
  const macros = findings.filter((f) => detail(f, 'Makró típusa'));
  const changes = findings.filter((f) => detail(f, 'Kapcsolódó program'));
  const productNames = new Set(products.map((p) => p.label));

  const orphanMacros = macros.filter((m) => !productNames.has(detail(m, 'Program') ?? ''));
  const removed = changes.filter((c) => !productNames.has(detail(c, 'Kapcsolódó program') ?? ''));

  return (
    <section className="card section-gap stagger-in" style={{ animationDelay: '240ms' }}>
      <h2 className="card-title"><Icon name="activity" size={18} /> Egérprogramok és makrók</h2>

      {devices.length > 0 && (
        <div className="mouse-devices">
          {devices.map((d) => (
            <span className="mouse-device" key={d.label} title={`VID ${detail(d, 'VID')}, PID ${detail(d, 'PID')}`}>
              <strong>{detail(d, 'Eszköz')}</strong>
              <small>{detail(d, 'Eszköz gyártója')}</small>
            </span>
          ))}
        </div>
      )}

      {removed.map((c) => (
        <p className="mouse-removed" key={c.label}>
          <Icon name="alert" size={16} /> {c.label}
        </p>
      ))}

      {products.length === 0 && orphanMacros.length === 0 && (
        <p className="muted empty-row">
          {checksMouseSoftware(clientVersion)
            ? 'Nem találtunk egérprogramot ezen a gépen.'
            : 'Ez a vizsgálat régebbi klienssel készült, ami még nem nézte az egérprogramokat.'}
        </p>
      )}

      <div className="mouse-list">
        {products.map((product) => (
          <ProductCard
            key={product.label}
            product={product}
            macros={macros.filter((m) => detail(m, 'Program') === product.label)}
            change={changes.find((c) => detail(c, 'Kapcsolódó program') === product.label)}
            scanTime={scanTime}
          />
        ))}
      </div>

      {orphanMacros.length > 0 && (
        <div className="mouse-loose">
          <h4>Különálló makró-fájlok</h4>
          {orphanMacros.map((m) => (
            <div className="mouse-macro" key={m.label}>
              <strong>{detail(m, 'Makró neve')}</strong>
              <span className="type-pill">{detail(m, 'Makró típusa')}</span>
              <small className="mono">{detail(m, 'Fájl')}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
