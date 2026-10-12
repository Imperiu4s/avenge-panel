import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { isAuthenticated, isLoading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempt, setAttempt] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Hibás belépésnél a kártya "megrázza magát" - a class eltávolítása és a
  // reflow kikényszerítése után az animáció minden sikertelen próbálkozásnál
  // újraindul, nem csak az elsőnél.
  useEffect(() => {
    const card = cardRef.current;
    if (!error || !card) return;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }, [error, attempt]);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/home';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    setAttempt((a) => a + 1);
    if (ok) {
      navigate('/home', { replace: true });
    }
  }

  return (
    <div className="centered-page login-page">
      <div className="login-bg" aria-hidden="true">
        <span className="login-blob login-blob-a" />
        <span className="login-blob login-blob-b" />
        <span className="login-grid" />
      </div>
      <div className="card login-card" ref={cardRef}>
        <h1 className="brand-title">
          {'AVENGE'.split('').map((letter, i) => (
            <span className="brand-letter" key={i} style={{ animationDelay: `${i * 60}ms` }}>{letter}</span>
          ))}
        </h1>
        <p className="subtitle">Staff bejelentkezés</p>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="field-label" htmlFor="password">Jelszó</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error-text error-in" key={attempt}>{error}</p>}

          <button type="submit" className={`btn-primary ${isLoading ? 'is-loading' : ''}`} disabled={isLoading}>
            {isLoading && <span className="btn-spinner" aria-hidden="true" />}
            {isLoading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  );
}
