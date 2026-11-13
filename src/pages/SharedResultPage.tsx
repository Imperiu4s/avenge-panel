import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { SharedResultView } from '../api/types';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/motion';
import { ResultReport } from '../components/ResultReport';
import { formatSecond } from '../components/timeline';

export function SharedResultPage() {
  const { token } = useParams<{ token: string }>();
  const [shared, setShared] = useState<SharedResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    api.getSharedResult(token)
      .then(setShared)
      .catch((e) => {
        setError(e instanceof ApiError && e.status === 404
          ? 'Ez a link lejárt, vagy visszavonták. Kérj újat attól, aki küldte.'
          : 'Nem sikerült betölteni az eredményt.');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <main className="page">
        <div className="result-top">
          <div className="card"><Skeleton width="60%" height={40} style={{ marginBottom: 16 }} /><Skeleton width="80%" /></div>
          <div className="card"><Skeleton width="100%" /><Skeleton width="70%" style={{ marginTop: 14 }} /></div>
        </div>
      </main>
    );
  }

  if (error || !shared) {
    return (
      <main className="page">
        <section className="card shared-gone">
          <Icon name="clock" size={28} />
          <h1>A link nem érhető el</h1>
          <p className="muted">{error ?? 'Ismeretlen hiba.'}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shared-banner stagger-in">
        <Icon name="share" size={17} />
        <span>
          Megosztott eredmény{shared.organizationName ? ` · ${shared.organizationName}` : ''}
          <small>A link eddig érvényes: {formatSecond(shared.expiresAt)}</small>
        </span>
      </div>
      <ResultReport result={shared.result} />
    </main>
  );
}
