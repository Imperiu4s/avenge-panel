import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { FindingDto, ScanResultView } from '../api/types';
import { Layout } from '../components/Layout';

const CATEGORY_LABELS: Record<string, string> = {
  CheatSignature: 'Cheat',
  SuspiciousSavedFile: 'Gyanús mentett fájl',
  SuspiciousDeletedFile: 'Gyanús törölt fájl',
  AltAccount: 'Alt fiók',
  RecordingSoftware: 'Felvevőszoftver',
  XrayTexturePack: 'XRay texture pack',
  Injector: 'Injector',
  VmSandbox: 'VM / Sandbox',
  TamperAttempt: 'Manipulációs kísérlet'
};

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'NEM EGYÉRTELMŰ'
};

function groupByCategory(findings: FindingDto[]): Record<string, FindingDto[]> {
  return findings.reduce<Record<string, FindingDto[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});
}

export function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<ScanResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        <p className="error-text">{error ?? 'Ismeretlen hiba.'}</p>
      </Layout>
    );
  }

  const grouped = groupByCategory(result.findings);

  return (
    <Layout>
      <div className="panel-header">
        <h1>Scan Result</h1>
        <p className="subtitle">Result ID: {resultId}</p>
      </div>

      <div className="panel-grid result-grid">
        <div className={`card verdict-card verdict-${result.verdict.toLowerCase()}`}>
          <div className="verdict-label">{VERDICT_LABELS[result.verdict] ?? result.verdict}</div>
          <ul className="info-list">
            <li><span>HWID</span><span className="mono">{result.system.hwid}</span></li>
            <li><span>Gépnév</span><span>{result.system.hostname || '-'}</span></li>
            <li><span>OS</span><span>{result.system.osVersion}</span></li>
            <li><span>CPU</span><span>{result.system.cpuModel ?? '-'}</span></li>
            <li><span>GPU</span><span>{result.system.gpuModel ?? '-'}</span></li>
            <li><span>RAM</span><span>{result.system.ramTotalMb ? `${(result.system.ramTotalMb / 1024).toFixed(1)} GB` : '-'}</span></li>
            <li><span>Játék</span><span>{result.detectedGame ?? '-'}</span></li>
            <li><span>Scan időtartama</span><span>{result.scanDurationMs} ms</span></li>
            <li><span>Kliens verzió</span><span>{result.clientVersion}</span></li>
            <li><span>Időpont</span><span>{new Date(result.createdAt).toLocaleString('hu-HU')}</span></li>
          </ul>
        </div>

        <div className="card findings-card">
          <h2>Találatok ({result.findings.length})</h2>
          {result.findings.length === 0 && <p className="muted">Nincs találat.</p>}

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="finding-group">
              <h3>{CATEGORY_LABELS[category] ?? category} <span className="muted">({items.length})</span></h3>
              <div className="table-scroll">
                <table className="findings-table">
                  <thead>
                    <tr>
                      <th>Súlyosság</th>
                      <th>Címke</th>
                      <th>Forrás</th>
                      <th>Elérési út</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((f, i) => (
                      <tr key={i}>
                        <td><span className={`severity-badge severity-${f.severity.toLowerCase()}`}>{f.severity}</span></td>
                        <td>{f.label}</td>
                        <td>{f.source}</td>
                        <td className="mono small">{f.filePath ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
