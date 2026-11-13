import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError, clientDownloadUrl } from '../api/client';
import type { DownloadStatusView } from '../api/types';
import { Icon } from '../components/Icon';
import { useCopyFeedback } from '../components/motion';
import avengeLogo from '../assets/avenge-logo-crop.png';

const STEPS = [
  'Töltsd le az Avenge-et az alábbi gombbal.',
  'Indítsd el, és engedélyezd a rendszergazdai futtatást.',
  'Írd be a kódot, a vizsgálat magától elindul.'
];

export function PlayerDownloadPage() {
  const { code = '' } = useParams<{ code: string }>();
  const [status, setStatus] = useState<DownloadStatusView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { copiedKey, copy } = useCopyFeedback();

  useEffect(() => {
    let cancelled = false;
    api.getDownloadStatus(code)
      .then((result) => { if (!cancelled) setStatus(result); })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'A szerver most nem érhető el, próbáld újra.');
      });
    return () => { cancelled = true; };
  }, [code]);

  return (
    <main className="login">
      <div className="login-frame login-frame-wide">
        <div className="login-card">
          <div className="hero-logo login-logo">
            <img src={avengeLogo} alt="Avenge" />
            <span className="hero-logo-glint" style={{ maskImage: `url(${avengeLogo})`, WebkitMaskImage: `url(${avengeLogo})` }} aria-hidden="true" />
          </div>

          {error ? (
            <>
              <h1>A link nem használható</h1>
              <p className="error-text">{error}</p>
              <p className="muted">Kérj új kódot attól a staff tagtól, aki a vizsgálatot kérte.</p>
            </>
          ) : (
            <>
              <h1>Avenge letöltése</h1>
              <p className="muted">Egy staff tag vizsgálatot kért. A kódod:</p>

              <button className="player-code" onClick={() => copy('code', code)} title="Kód másolása">
                {code.split('').map((char, i) => <span className="code-cell" key={i}>{char}</span>)}
                <span className="player-code-copy">
                  <Icon name={copiedKey === 'code' ? 'check' : 'copy'} size={16} />
                  {copiedKey === 'code' ? 'Másolva' : 'Másolás'}
                </span>
              </button>

              <ol className="player-steps">
                {STEPS.map((step, i) => (
                  <li key={step} className="stagger-in" style={{ animationDelay: `${200 + i * 90}ms` }}>
                    <span className="player-step-num">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>

              <a
                href={status ? clientDownloadUrl({ code }) : undefined}
                className={`btn-primary btn-block btn-large ${status ? '' : 'is-loading'}`}
                aria-disabled={!status}
              >
                <Icon name="download" size={18} />
                {status
                  ? `Letöltés (v${status.version}, ${Math.round(status.sizeBytes / 1048576)} MB)`
                  : 'Ellenőrzés...'}
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
