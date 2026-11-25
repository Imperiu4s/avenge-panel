import { t } from '../i18n';
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
  const { user, can } = useAuth();
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
          setError(t('Ezt a vizsgálatot nem nézheted meg.'));
        } else if (e instanceof ApiError && e.status === 404) {
          setError(t('Nincs ilyen vizsgálat.'));
        } else {
          setError(t('Nem sikerült betölteni az eredményt.'));
        }
      })
      .finally(() => setIsLoading(false));
  }, [resultId]);

  if (isLoading) {
    return (
      <main className="page">
        <header className="page-head">
          <span className="eyebrow">{t('Eredmény')}</span>
          <h1>{t('Vizsgálat')}</h1>
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
        <Link to="/panel" className="back-link"><Icon name="arrow-right" size={15} className="flip-x" />{' '}{t('Vissza a Panelre')}</Link>
        <p className="error-text">{error ?? t('Ismeretlen hiba.')}</p>
      </main>
    );
  }

  const foreign = result.foreignOrganization ?? null;
  const canShare = !foreign && user?.canShareResults === true;
  const canDelete = !foreign && Boolean(result.sessionCode) && (can('scans.delete.all') || user?.canDeleteOwnScans === true);

  async function handleDelete() {
    if (!result?.sessionCode) return;
    if (!window.confirm(t('Törlöd a #{0} vizsgálatot az összes találatával és megosztó linkjével? Ez nem vonható vissza.', result.sessionCode))) return;
    setDeleteError(null);
    try {
      await api.deleteSession(result.sessionCode);
      navigate('/panel', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t('Nem sikerült törölni a vizsgálatot.'));
    }
  }

  return (
    <main className="page">
      <div className="result-toolbar">
        <Link to="/panel" className="back-link"><Icon name="arrow-right" size={15} className="flip-x" />{' '}{t('Vissza a Panelre')}</Link>
        {canDelete && (
          <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={handleDelete}>
            <Icon name="trash" size={14} />{' '}{t('Vizsgálat törlése')}</button>
        )}
      </div>
      {deleteError && <p className="error-text">{deleteError}</p>}
      {foreign && (
        <p className="foreign-org-banner"><Icon name="layers" size={15} />{' '}{t('Ez a(z)')}{' '}<strong>{foreign}</strong>{' '}{t('szervezet vizsgálata. Csak megtekintheted; a megnyitás bekerült a tevékenységnaplódba.')}</p>
      )}

      <ResultReport result={result} aside={canShare ? <ShareLinkPanel resultId={resultId} /> : null} />
    </main>
  );
}
