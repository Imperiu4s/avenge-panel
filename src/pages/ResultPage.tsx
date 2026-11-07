import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ScanResultView } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/motion';
import { ResultReport } from '../components/ResultReport';
import { ShareLinkPanel } from '../components/ShareLinkPanel';

export function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<ScanResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!resultId) return;
    setIsLoading(true);
    setError(null);
    api.getScanResult(resultId)
      .then(setResult)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) {
          setError('Ezt a vizsgálatot nem nézheted meg.');
        } else if (e instanceof ApiError && e.status === 404) {
          setError('Nincs ilyen vizsgálat.');
        } else {
          setError('Nem sikerült betölteni az eredményt.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [resultId]);

  if (isLoading) {
    return (
      <main className="page">
        <header className="page-head">
          <span className="eyebrow">Eredmény</span>
          <h1>Vizsgálat</h1>
        </header>
        <div className="result-top">
          <div className="card"><Skeleton width="60%" height={40} style={{ marginBottom: 16 }} /><Skeleton width="80%" /></div>
          <div className="card"><Skeleton width="100%" /><Skeleton width="70%" style={{ marginTop: 14 }} /></div>
        </div>
      </main>
    );
  }

  if (error || !result || !resultId) {
    return (
      <main className="page">
        <Link to="/panel" className="back-link"><Icon name="arrow-right" size={15} className="flip-x" /> Vissza a Panelre</Link>
        <p className="error-text">{error ?? 'Ismeretlen hiba.'}</p>
      </main>
    );
  }

  const canShare = isAdmin || user?.canShareResults === true;
  const canDelete = Boolean(result.sessionCode) && (isAdmin || user?.canDeleteOwnScans === true);

  async function handleDelete() {
    if (!result?.sessionCode) return;
    if (!window.confirm(`Törlöd a #${result.sessionCode} vizsgálatot az összes találatával és megosztó linkjével? Ez nem vonható vissza.`)) return;
    setDeleteError(null);
    try {
      await api.deleteSession(result.sessionCode);
      navigate('/panel', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Nem sikerült törölni a vizsgálatot.');
    }
  }

  return (
    <main className="page">
      <div className="result-toolbar">
        <Link to="/panel" className="back-link"><Icon name="arrow-right" size={15} className="flip-x" /> Vissza a Panelre</Link>
        {canDelete && (
          <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={handleDelete}>
            <Icon name="trash" size={14} /> Vizsgálat törlése
          </button>
        )}
      </div>
      {deleteError && <p className="error-text">{deleteError}</p>}

      <ResultReport result={result} aside={canShare ? <ShareLinkPanel resultId={resultId} /> : null} />
    </main>
  );
}
