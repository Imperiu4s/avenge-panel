import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import avengeLogo from '../assets/avenge-logo-crop.png';

export function LoginPage() {
  const { isAuthenticated, isLoading, error, sessionExpired, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/panel';

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
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    setAttempt((a) => a + 1);
    if (ok) {
      navigate(redirectTo, { replace: true });
    }
  }

  return (
    <main className="login">
      <div className="login-frame" ref={cardRef}>
        <div className="login-card">
          <div className="hero-logo login-logo">
            <img src={avengeLogo} alt="Avenge" />
            <span className="hero-logo-glint" style={{ maskImage: `url(${avengeLogo})`, WebkitMaskImage: `url(${avengeLogo})` }} aria-hidden="true" />
          </div>
          <h1>Belépés</h1>
          <p className="muted">Fiókot az adminisztrátortól kapsz.</p>

          {sessionExpired && !error && (
            <p className="notice-text">
              <Icon name="clock" size={16} /> A munkameneted lejárt, jelentkezz be újra.
            </p>
          )}

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
            <div className="input-with-action">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
              </button>
            </div>

            {error && <p className="error-text error-in" key={attempt}>{error}</p>}

            <button type="submit" className={`btn-primary btn-block btn-large ${isLoading ? 'is-loading' : ''}`} disabled={isLoading}>
              {isLoading && <span className="btn-spinner" aria-hidden="true" />}
              {isLoading ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
