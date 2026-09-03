import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { FindingDto, ScanResultView } from '../api/types';
import { Layout } from '../components/Layout';
import { Icon, type IconName } from '../components/Icon';

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'NEM EGYÉRTELMŰ'
};

// Jobb oldali, lenyitható szekciók - csak "identitás/média" jellegű
// kategóriák, pontosan a referencia-képek szerint (Alts / Recording Software
// / XRay Texture Packs). A többi kategória (cheat-jel, gyanús fájlok, stb.)
// a bal oldali kártya "Details" gombja mögötti modálban jelenik meg - lásd
// MODAL_TYPE_LABELS.
const ACCORDION_CATEGORIES: { category: FindingDto['category']; label: string; icon: IconName }[] = [
  { category: 'AltAccount', label: 'Alts', icon: 'users' },
  { category: 'RecordingSoftware', label: 'Recording Software', icon: 'video' },
  { category: 'XrayTexturePack', label: 'XRay Texture Packs', icon: 'gamepad' },
  { category: 'VpnOrProxy', label: 'VPN / Proxy', icon: 'globe' }
];

const MODAL_TYPE_LABELS: Record<string, string> = {
  CheatSignature: 'Cheat',
  SuspiciousSavedFile: 'Suspicious Files',
  SuspiciousDeletedFile: 'Suspicious Files',
  Injector: 'Injector',
  VmSandbox: 'VM / Sandbox',
  TamperAttempt: 'Tamper'
};

function groupByCategory(findings: FindingDto[]): Record<string, FindingDto[]> {
  return findings.reduce<Record<string, FindingDto[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});
}

function formatRelativeToNow(iso: string | null): string {
  if (!iso) return '-';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return '-';
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (minutes <= 0) return `${seconds}s ago`;
  return `${minutes}m, ${seconds}s ago`;
}

export function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<ScanResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [leftView, setLeftView] = useState<'result' | 'info'>('result');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!resultId) return;
    setIsLoading(true);
    setError(null);
    api.getScanResult(resultId)
      .then(setResult)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) {
          setError('Ez a vizsgálat nem a te szervezetedhez tartozik.');
        } else if (e instanceof ApiError && e.status === 404) {
          setError('Nincs ilyen Result ID.');
        } else {
          setError('Nem sikerült betölteni az eredményt.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [resultId]);

  if (isLoading) {
    return (
      <Layout>
        <p className="muted">Betöltés...</p>
      </Layout>
    );
  }

  if (error || !result) {
    return (
      <Layout>
        <Link to="/panel" className="back-link">&larr; Vissza a Panelre</Link>
        <p className="error-text">{error ?? 'Ismeretlen hiba.'}</p>
      </Layout>
    );
  }

  const grouped = groupByCategory(result.findings);
  const modalFindings = result.findings.filter(
    (f) => !ACCORDION_CATEGORIES.some((a) => a.category === f.category)
  );
  const savedCount = (grouped.SuspiciousSavedFile ?? []).length;
  const deletedCount = (grouped.SuspiciousDeletedFile ?? []).length;
  const cheatCount = (grouped.CheatSignature ?? []).length;

  return (
    <Layout fullBleed>
      <div className="panel-hero">
        <h1>Scan Result</h1>
        <p className="subtitle">View your scan details</p>
      </div>

      <div className="panel-content">
        <Link to="/panel" className="back-link back-link-hero">&larr; Vissza a Panelre</Link>

        <div className="panel-grid result-grid">
          <div className={`card scan-toggle-card verdict-${result.verdict.toLowerCase()}`}>
            <div className="scan-toggle-header">
              <span>{leftView === 'result' ? 'Scan Result' : 'Scan Info'}</span>
              <button
                className={`toggle-arrow ${leftView === 'info' ? 'toggle-arrow-flipped' : ''}`}
                onClick={() => setLeftView((v) => (v === 'result' ? 'info' : 'result'))}
                aria-label="Váltás Scan Result és Scan Info között"
              >
                <Icon name="arrow-right" size={16} />
              </button>
            </div>

            {leftView === 'result' ? (
              <div className="scan-toggle-body" key="result">
                <span className="fingerprint-icon"><Icon name="fingerprint" size={40} /></span>
                <div className="verdict-label-plain">{VERDICT_LABELS[result.verdict] ?? result.verdict}</div>
                <button className="btn-outline-white" onClick={() => setIsDetailsOpen(true)}>
                  Details
                </button>
              </div>
            ) : (
              <ul className="info-list-white" key="info">
                {result.minecraftUsername && (
                  <li><span>Minecraft Username:</span><span className="pill-value">{result.minecraftUsername}</span></li>
                )}
                <li><span>Recycle Bin:</span><span className="pill-value">{formatRelativeToNow(result.system.recycleBinLastEmptiedAt)}</span></li>
                <li><span>Operating System:</span><span className="pill-value">{result.system.osVersion}</span></li>
                <li><span>Scan Time:</span><span className="pill-value">{new Date(result.createdAt).toLocaleString('hu-HU')}</span></li>
                <li><span>Scan Speed:</span><span className="pill-value">{result.scanDurationMs}ms</span></li>
              </ul>
            )}
          </div>

          <div className="accordion-stack">
            {ACCORDION_CATEGORIES.map(({ category, label, icon }) => {
              const items = grouped[category] ?? [];
              const isOpen = openAccordion === category;
              return (
                <div className="accordion-item" key={category}>
                  <button
                    className="accordion-trigger"
                    onClick={() => setOpenAccordion(isOpen ? null : category)}
                  >
                    <span className="accordion-icon"><Icon name={icon} size={19} /></span>
                    <span className="accordion-label">{label}</span>
                    <span className="muted small">({items.length})</span>
                    <span className={`accordion-chevron ${isOpen ? 'accordion-chevron-open' : ''}`}>
                      <Icon name="arrow-right" size={14} className="chevron-svg" />
                    </span>
                  </button>
                  <div className={`accordion-panel-wrapper ${isOpen ? 'accordion-panel-wrapper-open' : ''}`}>
                    <div className="accordion-panel-inner">
                      <div className="accordion-panel">
                        {items.length === 0 && <p className="muted small">Nincs találat ebben a kategóriában.</p>}
                        {items.map((f, i) => (
                          <div className="accordion-finding" key={i}>
                            <span className="accordion-finding-thumb"><Icon name={icon} size={16} /></span>
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
        </div>
      </div>

      {isDetailsOpen && (
        <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-header-icon"><Icon name="info" size={22} /></span>
            </div>
            <div className="modal-body">
              <div className="modal-stats-row">
                <div className="modal-stat">
                  <div className="modal-stat-label"><Icon name="save" size={15} /> Suspicious Saved Files</div>
                  <div className="modal-stat-value"><Icon name="search" size={15} /> {savedCount}</div>
                </div>
                <div className="modal-stat">
                  <div className="modal-stat-label"><Icon name="trash" size={15} /> Suspicious Deleted Files</div>
                  <div className="modal-stat-value"><Icon name="search" size={15} /> {deletedCount}</div>
                </div>
                <div className="modal-stat">
                  <div className="modal-stat-label"><Icon name="bug" size={15} /> Cheats Found</div>
                  <div className="modal-stat-value"><Icon name="search" size={15} /> {cheatCount}</div>
                </div>
              </div>

              <div className="table-scroll">
                <table className="sessions-table modal-findings-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Found</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalFindings.map((f, i) => (
                      <tr key={i}>
                        <td>
                          <span className="type-pill">{MODAL_TYPE_LABELS[f.category] ?? f.category}</span>
                        </td>
                        <td>
                          <span className={`severity-badge severity-${f.severity.toLowerCase()}`}>{f.severity}</span>
                        </td>
                        <td className="mono small">{f.filePath ?? f.label}</td>
                      </tr>
                    ))}
                    {modalFindings.length === 0 && (
                      <tr>
                        <td colSpan={3} className="muted">Nincs további találat.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
