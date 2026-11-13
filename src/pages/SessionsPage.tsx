import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, clientDownloadUrl } from '../api/client';
import type { CreateSessionResponse, SessionListItem } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import { ScrambleText, Skeleton, useCopyFeedback, useNow } from '../components/motion';
import { onScanProgress, onSessionStatusChanged, type ScanProgressEvent } from '../realtime/scanHub';

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Várakozik a kliensre',
  ClientConnected: 'Kliens csatlakozott',
  Scanning: 'Vizsgálat folyamatban',
  Completed: 'Sikeres vizsgálat',
  Interrupted: 'Megszakadt',
  Expired: 'Lejárt'
};

const VERDICT_LABELS: Record<string, string> = {
  Legit: 'LEGIT',
  Unlegit: 'UNLEGIT',
  Inconclusive: 'Nem egyértelmű'
};

const PAGE_SIZE = 8;
const CODE_PLACEHOLDER = '------';

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [progressByCode, setProgressByCode] = useState<Record<string, ScanProgressEvent>>({});

  const [newSession, setNewSession] = useState<CreateSessionResponse | null>(null);
  const [newSessionTotalMs, setNewSessionTotalMs] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { copiedKey, copy } = useCopyFeedback();
  const now = useNow();
  const { user, isAdmin } = useAuth();

  const canDeleteRow = (s: SessionListItem) =>
    isAdmin || (user?.canDeleteOwnScans === true && s.createdByMe === true);

  const loadSessions = useCallback(async (targetPage: number) => {
    setIsLoadingList(true);
    setListError(null);
    try {
      setSessions(await api.listSessions(targetPage, PAGE_SIZE));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setListError('Nem sikerült betölteni a vizsgálatokat.');
      }
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSessions(page);
  }, [loadSessions, page]);

  // A jelenleg ismert kódok gyors halmaza - a SignalR handlerben (ami nem
  // kap friss "sessions" closure-t, mert csak mount-kor iratkozik fel) ebből
  // döntjük el, hogy egy esemény egy MÁR LÁTOTT session-re vonatkozik-e
  // (helyi state-frissítés elég), vagy egy ÚJ, még le nem kérdezett session-re
  // (ilyenkor egy teljes listát kell újra lekérni, különben némán eltűnne az
  // esemény - ezt egy éles teszttel buktam meg, lásd a beszélgetést).
  const knownCodesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    knownCodesRef.current = new Set(sessions.map((s) => s.code));
  }, [sessions]);

  // Élő frissítés: a SignalR hub-on érkező eseményekből közvetlenül
  // frissítjük a helyi state-et (nem kérünk le újra mindent a szervertől
  // minden eseménynél) - lásd server/Hubs/ScanEventBroadcaster.cs.
  useEffect(() => {
    const offStatus = onSessionStatusChanged((event) => {
      if (!knownCodesRef.current.has(event.code)) {
        // Egy MÁS staff (vagy egy még le nem kérdezett) session-je - csak az
        // első oldalon van értelme újratölteni, különben elcsúszna a lapozás.
        if (page === 1) {
          loadSessions(1);
        }
        return;
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.code === event.code
            ? {
                ...s,
                status: event.status as SessionListItem['status'],
                resultIdHash: event.resultId ?? s.resultIdHash,
                verdict: (event.verdict as SessionListItem['verdict']) ?? s.verdict
              }
            : s
        )
      );

      if (event.status === 'Completed' || event.status === 'Interrupted' || event.status === 'Expired') {
        setProgressByCode((prev) => {
          const { [event.code]: _removed, ...rest } = prev;
          return rest;
        });
      }
    });

    const offProgress = onScanProgress((event) => {
      setProgressByCode((prev) => ({ ...prev, [event.code]: event }));
    });

    return () => {
      offStatus();
      offProgress();
    };
  }, [loadSessions, page]);

  async function handleDelete(s: SessionListItem) {
    if (!window.confirm(`Törlöd a #${s.code} vizsgálatot az eredményével együtt? Ez nem vonható vissza.`)) return;
    try {
      await api.deleteSession(s.code);
      setSessions((prev) => prev.filter((item) => item.code !== s.code));
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Nem sikerült törölni a vizsgálatot.');
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await api.createSession();
      setNewSession(result);
      setNewSessionTotalMs(Math.max(1, new Date(result.expiresAt).getTime() - Date.now()));
      setPage(1);
      await loadSessions(1);
      await copy('code', result.code);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setGenerateError(err.message);
      } else if (!(err instanceof ApiError && err.status === 401)) {
        setGenerateError('Nem sikerült kódot generálni.');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { ticket } = await api.createDownloadTicket();
      window.location.assign(clientDownloadUrl({ ticket }));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setDownloadError(err instanceof ApiError ? err.message : 'Nem sikerült elindítani a letöltést.');
      }
    } finally {
      setIsDownloading(false);
    }
  }

  const hasNextPage = sessions.length === PAGE_SIZE;
  const code = newSession?.code ?? CODE_PLACEHOLDER;
  const playerLink = newSession ? `${window.location.origin}/d/${newSession.code}` : null;
  const currentSession = sessions.find((s) => s.code === newSession?.code);
  const currentProgress = newSession ? progressByCode[newSession.code] : undefined;
  const remainingMs = newSession ? new Date(newSession.expiresAt).getTime() - now : 0;
  const isCodeUnused = !currentSession || currentSession.status === 'Pending';
  const isCodeExpired = Boolean(newSession) && isCodeUnused && remainingMs <= 0;

  return (
    <main className="page">
      <header className="page-head stagger-in">
        <span className="eyebrow">Vizsgálatok</span>
        <h1>Panel</h1>
        <p className="muted">Generálj kódot a játékosnak, és kövesd élőben a vizsgálatot.</p>
      </header>

      <div className="console-grid">
        <section className="card console-card stagger-in" style={{ animationDelay: '80ms' }}>
          <h2 className="card-title"><Icon name="key" size={18} /> Session kód</h2>

          <div className={`code-cells ${newSession ? 'code-cells-live' : ''}`} aria-label={newSession ? `Kód: ${newSession.code}` : 'Még nincs kód'}>
            <ScrambleText text={code} renderChar={(char, i) => <span className="code-cell" key={i}>{char}</span>} />
          </div>

          {newSession && isCodeUnused && !isCodeExpired && (
            <div className="code-timer" title="Eddig használható fel a kód">
              <span className="code-timer-bar">
                <span style={{ transform: `scaleX(${Math.max(0, remainingMs / newSessionTotalMs)})` }} />
              </span>
              <span className="mono small">{formatCountdown(remainingMs)}</span>
            </div>
          )}
          {isCodeExpired && <p className="notice-text"><Icon name="clock" size={16} /> Ez a kód lejárt, generálj újat.</p>}

          {newSession && currentSession && !isCodeUnused && (
            <div className="code-live">
              {currentSession.verdict && currentSession.resultIdHash ? (
                <Link to={`/results/${currentSession.resultIdHash}`} className={`verdict-badge verdict-pop verdict-${currentSession.verdict.toLowerCase()}`}>
                  {VERDICT_LABELS[currentSession.verdict] ?? currentSession.verdict} <Icon name="arrow-right" size={14} />
                </Link>
              ) : (
                <>
                  <span className={`status-badge status-${currentSession.status.toLowerCase()}`}>
                    {STATUS_LABELS[currentSession.status] ?? currentSession.status}
                  </span>
                  {currentProgress && (
                    <div className="scan-meter">
                      <span className="scan-meter-bar">
                        <span style={{ transform: `scaleX(${currentProgress.percent / 100})` }} />
                      </span>
                      <span className="mono small">{currentProgress.percent}%</span>
                      <p className="muted small scan-meter-text">{currentProgress.statusText}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <button className={`btn-primary btn-block btn-large ${isGenerating ? 'is-loading' : ''}`} onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <span className="btn-spinner" aria-hidden="true" />}
            {isGenerating ? 'Generálás...' : newSession ? 'Új kód generálása' : 'Kód generálása'}
          </button>
          {generateError && <p className="error-text">{generateError}</p>}

          {newSession && (
            <div className="console-actions">
              <button className="btn-secondary" onClick={() => copy('code', newSession.code)}>
                <Icon name={copiedKey === 'code' ? 'check' : 'copy'} size={16} />
                {copiedKey === 'code' ? 'Kód másolva' : 'Kód másolása'}
              </button>
              {playerLink && (
                <button className="btn-secondary" onClick={() => copy('link', playerLink)}>
                  <Icon name={copiedKey === 'link' ? 'check' : 'link'} size={16} />
                  {copiedKey === 'link' ? 'Link másolva' : 'Link a játékosnak'}
                </button>
              )}
            </div>
          )}
          {newSession && (
            <p className="muted small console-hint">
              A linken a játékos a kód érvényessége alatt töltheti le az Avenge-et. Fiók nem kell hozzá.
            </p>
          )}

          <div className="console-divider" />

          <button className="btn-ghost btn-block" onClick={handleDownload} disabled={isDownloading}>
            <Icon name="download" size={17} />
            {isDownloading ? 'Letöltés indítása...' : 'Avenge letöltése magamnak'}
          </button>
          {downloadError && <p className="error-text">{downloadError}</p>}
        </section>

        <section className="card stagger-in" style={{ animationDelay: '150ms' }}>
          <h2 className="card-title"><Icon name="activity" size={18} /> Korábbi vizsgálatok</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kód</th>
                  <th>Időpont</th>
                  <th className="align-right">Eredmény</th>
                </tr>
              </thead>
              <tbody key={`page-${page}`}>
                {isLoadingList && sessions.length === 0 &&
                  Array.from({ length: 4 }, (_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td><Skeleton width={70} /></td>
                      <td><Skeleton width={140} /></td>
                      <td><Skeleton width={90} height={20} style={{ marginLeft: 'auto' }} /></td>
                    </tr>
                  ))}
                {sessions.map((s, i) => {
                  const progress = progressByCode[s.code];
                  return (
                    <tr
                      key={s.code}
                      className={`row-in ${s.code === newSession?.code ? 'row-new' : ''}`}
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <td className="mono">
                        {s.resultIdHash ? <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link> : <>#{s.code}</>}
                      </td>
                      <td className="muted">{new Date(s.createdAt).toLocaleString('hu-HU')}</td>
                      <td className="align-right">
                        {s.verdict ? (
                          <span className={`verdict-badge verdict-pop verdict-${s.verdict.toLowerCase()}`} key={s.verdict}>
                            {VERDICT_LABELS[s.verdict] ?? s.verdict}
                          </span>
                        ) : (
                          <span className={`status-badge status-${s.status.toLowerCase()}`} key={s.status}>
                            {STATUS_LABELS[s.status] ?? s.status}
                          </span>
                        )}
                        {progress && s.status === 'Scanning' && (
                          <span className="live-progress" title={progress.statusText}>
                            <span className="live-bar">
                              <span style={{ transform: `scaleX(${progress.percent / 100})` }} />
                            </span>
                            <span className="mono small">{progress.percent}%</span>
                          </span>
                        )}
                        {canDeleteRow(s) && (
                          <button
                            type="button"
                            className="icon-button row-delete"
                            onClick={() => handleDelete(s)}
                            aria-label={`#${s.code} törlése`}
                            title="Vizsgálat törlése"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!isLoadingList && sessions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted empty-row">Még nincs vizsgálat. Generálj egy kódot a kezdéshez.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {listError && <p className="error-text">{listError}</p>}

          <div className="pager">
            <button className="btn-ghost btn-tiny" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Előző</button>
            <span className="mono small pager-page">{page}</span>
            <button className="btn-ghost btn-tiny" disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)}>Következő</button>
          </div>
        </section>
      </div>
    </main>
  );
}
