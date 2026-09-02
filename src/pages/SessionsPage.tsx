import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CreateSessionResponse, SessionListItem } from '../api/types';
import { Layout } from '../components/Layout';
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

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [progressByCode, setProgressByCode] = useState<Record<string, ScanProgressEvent>>({});

  const [newSession, setNewSession] = useState<CreateSessionResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const result = await api.listSessions();
      setSessions(result);
    } catch {
      setListError('Nem sikerült betölteni a session-listát.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
        // Egy MÁS staff (vagy egy még le nem kérdezett) session-je - nincs mit
        // helyben frissíteni, teljes újratöltéssel kerül be a listába.
        loadSessions();
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
  }, [loadSessions]);

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    setCodeCopied(false);
    try {
      const result = await api.createSession();
      setNewSession(result);
      await loadSessions();

      try {
        await navigator.clipboard.writeText(result.code);
        setCodeCopied(true);
      } catch {
        // A vágólap-hozzáférés böngésző-beállítástól/engedélytől függ - ha
        // nem sikerül, a kód akkor is megjelenik a képernyőn, csak kézzel
        // kell kimásolni. Nem blokkoló hiba.
      }
    } catch {
      setGenerateError('Nem sikerült session kódot generálni.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Layout>
      <div className="panel-header">
        <h1>Panel</h1>
        <p className="subtitle">Session-kódok generálása és a korábbi vizsgálatok áttekintése</p>
      </div>

      <div className="panel-grid">
        <div className="card">
          <div className="table-scroll">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Kód</th>
                <th>Létrehozva</th>
                <th>Állapot</th>
                <th>Eredmény</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const progress = progressByCode[s.code];
                return (
                  <tr key={s.code}>
                    <td className="mono">
                      {s.resultIdHash ? (
                        <Link to={`/results/${s.resultIdHash}`}>#{s.code}</Link>
                      ) : (
                        <>#{s.code}</>
                      )}
                    </td>
                    <td>{new Date(s.createdAt).toLocaleString('hu-HU')}</td>
                    <td>
                      <span className={`status-badge status-${s.status.toLowerCase()}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                      {progress && s.status === 'Scanning' && (
                        <span className="live-progress">
                          <span className="live-dot" /> {progress.percent}% - {progress.statusText}
                        </span>
                      )}
                    </td>
                    <td>
                      {s.verdict ? (
                        <span className={`verdict-badge verdict-${s.verdict.toLowerCase()}`}>
                          {VERDICT_LABELS[s.verdict] ?? s.verdict}
                        </span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoadingList && sessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">Még nincs egyetlen session sem.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          {listError && <p className="error-text">{listError}</p>}
        </div>

        <div className="card generate-card">
          <h2>Új session</h2>
          <p className="muted">
            A generált kódot add meg a vizsgálandó játékosnak - a kliensben ezt kell
            beírnia a vizsgálat indításához.
          </p>
          <div className="generate-actions">
            <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generálás...' : 'Generálás'}
            </button>
            <a
              className="btn-secondary"
              href="/downloads/avenge-client-win-x64.zip"
              download
            >
              Kliens letöltése
            </a>
          </div>
          {generateError && <p className="error-text">{generateError}</p>}
          {newSession && (
            <div className="generated-code-box">
              <div className="generated-code">{newSession.code}</div>
              <p className="muted">
                Érvényes eddig: {new Date(newSession.expiresAt).toLocaleTimeString('hu-HU')}
              </p>
              {codeCopied && <p className="copied-text">Kód a vágólapra másolva!</p>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
