import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, shareLinkUrl } from '../api/client';
import type { ShareLinkView } from '../api/types';
import { Icon } from './Icon';
import { useCopyFeedback } from './motion';
import { formatSecond } from './timeline';

interface Props {
  resultId: string;
}

interface IssuedLink {
  id: string;
  url: string;
  expiresAt: string;
}

export function ShareLinkPanel({ resultId }: Props) {
  const [links, setLinks] = useState<ShareLinkView[]>([]);
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copiedKey, copy } = useCopyFeedback();

  const load = useCallback(() => {
    api.listShareLinks(resultId).then(setLinks).catch(() => setLinks([]));
  }, [resultId]);

  useEffect(load, [load]);

  async function handleCreate() {
    setError(null);
    setIsCreating(true);
    try {
      const created = await api.createShareLink(resultId);
      const url = shareLinkUrl(created.token);
      setIssued({ id: created.id, url, expiresAt: created.expiresAt });
      copy('share', url);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült linket készíteni.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(link: ShareLinkView) {
    if (!window.confirm('Visszavonod ezt a linket? Aki megkapta, többé nem tudja megnyitni.')) return;
    try {
      await api.revokeShareLink(resultId, link.id);
      if (issued?.id === link.id) setIssued(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült visszavonni a linket.');
    }
  }

  return (
    <section className="card share-card stagger-in" style={{ animationDelay: '140ms' }}>
      <div className="share-head">
        <div>
          <h2 className="card-title"><Icon name="share" size={18} /> Megosztó link</h2>
          <p className="muted small">Bárki megnyithatja bejelentkezés nélkül, akinek elküldöd. 3 napig érvényes, utána magától lejár.</p>
        </div>
        <button type="button" className={`btn-primary ${isCreating ? 'is-loading' : ''}`} onClick={handleCreate} disabled={isCreating}>
          {isCreating && <span className="btn-spinner" aria-hidden="true" />}
          <Icon name="link" size={16} /> {isCreating ? 'Készül...' : 'Új link'}
        </button>
      </div>

      {issued && (
        <div className="share-issued">
          <input className="mono share-url" value={issued.url} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="Megosztó link" />
          <button type="button" className="btn-secondary" onClick={() => copy('share', issued.url)}>
            <Icon name={copiedKey === 'share' ? 'check' : 'copy'} size={16} />
            {copiedKey === 'share' ? 'Másolva' : 'Másolás'}
          </button>
          <p className="muted small share-expiry">Lejár: {formatSecond(issued.expiresAt)}. Ezt a címet most másold ki: később nem jeleníthető meg újra, de bármikor kérhetsz újat.</p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {links.length > 0 && (
        <ul className="share-list">
          {links.map((link) => (
            <li key={link.id}>
              <span className="share-list-main">
                <strong>Aktív link</strong>
                <small>
                  {link.createdByEmail ?? 'ismeretlen'} · készült {formatSecond(link.createdAt)} · lejár {formatSecond(link.expiresAt)}
                </small>
              </span>
              <span className="share-list-views">{link.viewCount} megnyitás</span>
              <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => handleRevoke(link)}>Visszavonás</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
