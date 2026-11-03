import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE } from '../api/config';
import { Icon, type IconName } from './Icon';
import { prefersReducedMotion } from './motion';
import avengeLogo from '../assets/avenge-logo-crop.png';

// A navbar maga az Avenge tőr: balra hegyesedő penge (rajta a menü), keresztvas,
// és piros bőrrel bevont markolat (rajta a műveletek). A penge alsó éle egy
// "fogazott" skála: a fogak a kurzor közelében felébrednek, a célkereszt rugóval
// ugrik a kiválasztott menüpontra, a skála vörös sávja pedig a görgetést mutatja.

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  match: string[];
  requiresAuth: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Főoldal', icon: 'home', match: ['/home'], requiresAuth: false },
  { to: '/panel', label: 'Panel', icon: 'radar', match: ['/panel', '/results'], requiresAuth: true },
  { to: '/account', label: 'Fiók', icon: 'user', match: ['/account'], requiresAuth: true },
  { to: '/changelogs', label: 'Újdonságok', icon: 'history', match: ['/changelogs'], requiresAuth: true }
];

const TOOTH_SPACING = 7;
const SPRING_STIFFNESS = 300;
const SPRING_DAMPING = 25;

interface Spring {
  value: number;
  velocity: number;
  target: number;
}

function stepSpring(spring: Spring, dt: number): boolean {
  const force = (spring.target - spring.value) * SPRING_STIFFNESS - spring.velocity * SPRING_DAMPING;
  spring.velocity += force * dt;
  spring.value += spring.velocity * dt;
  const settled = Math.abs(spring.target - spring.value) < 0.05 && Math.abs(spring.velocity) < 0.05;
  if (settled) {
    spring.value = spring.target;
    spring.velocity = 0;
  }
  return settled;
}

function useBladeMotion(activeIndex: number, itemCount: number) {
  const linksRef = useRef<HTMLElement | null>(null);
  const reticleRef = useRef<HTMLSpanElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bladeRef = useRef<HTMLDivElement | null>(null);

  const state = useRef({
    x: { value: 0, velocity: 0, target: 0 } as Spring,
    width: { value: 0, velocity: 0, target: 0 } as Spring,
    pointerX: 0,
    heat: 0,
    heatTarget: 0,
    scroll: 0,
    frame: 0,
    lastTime: 0,
    placed: false,
    hoverIndex: null as number | null
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const blade = bladeRef.current;
    if (!canvas || !blade) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = state.current;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const links = linksRef.current;
    const offset = links ? links.getBoundingClientRect().left - canvas.getBoundingClientRect().left : 0;
    const needle = offset + s.x.value + s.width.value / 2;
    const progressEnd = width * s.scroll;

    for (let x = 4; x < width; x += TOOTH_SPACING) {
      const nearPointer = s.heat * Math.exp(-Math.pow((x - s.pointerX) / 46, 2));
      const nearNeedle = Math.exp(-Math.pow((x - needle) / 20, 2));
      const toothHeight = 2.5 + nearPointer * 7 + nearNeedle * 3;
      const lit = x <= progressEnd;
      const glow = Math.max(nearPointer, nearNeedle * 0.9);
      const alpha = (lit ? 0.5 : 0.17) + glow * 0.75;
      const red = lit || glow > 0.12;
      ctx.fillStyle = red ? `rgba(255, ${Math.round(70 + glow * 90)}, ${Math.round(70 + glow * 50)}, ${Math.min(1, alpha)})` : `rgba(255, 236, 230, ${alpha})`;
      ctx.fillRect(x, height - toothHeight, 1.25, toothHeight);
    }

    // A célkereszt tűje a skálán.
    ctx.fillStyle = '#ff5a4d';
    ctx.beginPath();
    ctx.moveTo(needle - 4, height);
    ctx.lineTo(needle + 4, height);
    ctx.lineTo(needle, height - 6);
    ctx.closePath();
    ctx.fill();
  }, []);

  const tick = useCallback((time: number) => {
    const s = state.current;
    const dt = Math.min(0.032, (time - s.lastTime) / 1000 || 0.016);
    s.lastTime = time;

    const settledX = stepSpring(s.x, dt);
    const settledWidth = stepSpring(s.width, dt);
    s.heat += (s.heatTarget - s.heat) * Math.min(1, dt * 9);
    const heatSettled = Math.abs(s.heat - s.heatTarget) < 0.004;
    if (heatSettled) s.heat = s.heatTarget;

    const reticle = reticleRef.current;
    if (reticle) {
      reticle.style.transform = `translateX(${s.x.value}px)`;
      reticle.style.width = `${s.width.value}px`;
    }
    draw();

    // Minden nyugalomban - a következő mozdulat (wake) indítja újra a ciklust.
    if (settledX && settledWidth && heatSettled) {
      s.frame = 0;
      return;
    }
    s.frame = requestAnimationFrame(tick);
  }, [draw]);

  const wake = useCallback(() => {
    const s = state.current;
    if (s.frame) return;
    s.lastTime = performance.now();
    s.frame = requestAnimationFrame(tick);
  }, [tick]);

  const aimAt = useCallback((index: number) => {
    const links = linksRef.current;
    if (!links) return;
    const items = links.querySelectorAll<HTMLElement>('[data-nav-item]');
    const element = items[index];
    if (!element) return;
    const s = state.current;
    s.x.target = element.offsetLeft;
    s.width.target = element.offsetWidth;
    if (!s.placed || prefersReducedMotion()) {
      s.x.value = s.x.target;
      s.width.value = s.width.target;
      s.placed = true;
    }
    wake();
  }, [wake]);

  useEffect(() => {
    aimAt(state.current.hoverIndex ?? activeIndex);
  }, [activeIndex, itemCount, aimAt]);

  useEffect(() => {
    const s = state.current;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      s.scroll = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      wake();
    };
    const onResize = () => {
      aimAt(s.hoverIndex ?? activeIndex);
      onScroll();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [aimAt, wake, activeIndex]);

  // A betűtípus késői betöltése elmozgatja a menüpontokat.
  useEffect(() => {
    document.fonts?.ready.then(() => {
      const s = state.current;
      s.placed = false;
      aimAt(s.hoverIndex ?? activeIndex);
    });
  }, [aimAt, activeIndex]);

  useEffect(() => () => {
    const s = state.current;
    if (s.frame) cancelAnimationFrame(s.frame);
    s.frame = 0;
  }, []);

  const onBladePointerMove = useCallback((event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = state.current;
    s.pointerX = event.clientX - canvas.getBoundingClientRect().left;
    s.heatTarget = 1;
    wake();
  }, [wake]);

  const onBladePointerLeave = useCallback(() => {
    const s = state.current;
    s.heatTarget = 0;
    s.hoverIndex = null;
    aimAt(activeIndex);
    wake();
  }, [aimAt, activeIndex, wake]);

  const onItemEnter = useCallback((index: number) => {
    state.current.hoverIndex = index;
    aimAt(index);
  }, [aimAt]);

  return { linksRef, reticleRef, canvasRef, bladeRef, onBladePointerMove, onBladePointerLeave, onItemEnter };
}

/** Valódi, mért válaszidő a szerver felől - nem díszlet. */
function useApiPing() {
  const [latency, setLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const measure = async () => {
      if (document.hidden) return;
      const started = performance.now();
      try {
        const response = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
        if (cancelled) return;
        setIsOnline(response.ok);
        setLatency(Math.round(performance.now() - started));
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    };
    measure();
    const timer = window.setInterval(measure, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { latency, isOnline };
}

export function BladeNav() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const [isCompact, setIsCompact] = useState(false);
  const { latency, isOnline } = useApiPing();

  const items = NAV_ITEMS.filter((item) => isAuthenticated || !item.requiresAuth);
  const activeIndex = Math.max(0, items.findIndex((item) => item.match.some((m) => location.pathname.startsWith(m))));
  const hasActive = items.some((item) => item.match.some((m) => location.pathname.startsWith(m)));

  const motion = useBladeMotion(activeIndex, items.length);

  useEffect(() => {
    const onScroll = () => setIsCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initial = user?.email?.[0]?.toUpperCase() ?? '•';

  return (
    <header className={`blade-nav ${isCompact ? 'blade-nav-compact' : ''}`}>
      <div
        className="blade"
        ref={motion.bladeRef}
        onPointerMove={motion.onBladePointerMove}
        onPointerLeave={motion.onBladePointerLeave}
      >
        <span className="blade-steel" aria-hidden="true">
          <span className="blade-glint" />
        </span>
        <Link to="/home" className="blade-brand" aria-label="Avenge főoldal">
          <img src={avengeLogo} alt="" />
        </Link>

        <nav
          className={`blade-links ${items.length < 2 ? 'blade-links-single' : ''}`}
          ref={motion.linksRef}
          aria-label="Fő navigáció"
        >
          <span className={`blade-reticle ${hasActive ? '' : 'blade-reticle-idle'}`} ref={motion.reticleRef} aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          {items.map((item, index) => {
            const isActive = hasActive && index === activeIndex;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-nav-item
                className={`blade-link ${isActive ? 'blade-link-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onPointerEnter={() => motion.onItemEnter(index)}
              >
                <Icon name={item.icon} size={18} className="blade-link-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <canvas className="blade-teeth" ref={motion.canvasRef} aria-hidden="true" />
      </div>

      <div className="blade-guard" aria-hidden="true" />

      <div className="blade-grip">
        <span
          className={`grip-ping ${isOnline ? '' : 'grip-ping-down'}`}
          title={isOnline ? 'A szerver elérhető' : 'A szerver nem érhető el'}
        >
          <span className="grip-ping-dot" />
          <span className="grip-ping-text">{isOnline ? (latency !== null ? `${latency} ms` : '...') : 'offline'}</span>
        </span>

        {isAdmin && (
          <Link to="/admin" className={`btn-steel grip-admin ${location.pathname.startsWith('/admin') ? 'grip-admin-active' : ''}`}>
            <Icon name="shield" size={16} />
            <span className="grip-admin-label">Admin Panel</span>
          </Link>
        )}

        {isAuthenticated ? (
          <div className="grip-account">
            <Link to="/account" className="grip-avatar" title={user?.email ?? 'Fiók'} aria-label="Fiók">{initial}</Link>
            <button className="grip-logout" onClick={logout} title="Kijelentkezés" aria-label="Kijelentkezés">
              <Icon name="logout" size={17} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-steel grip-login">
            <Icon name="lock" size={15} />
            <span>Belépés</span>
          </Link>
        )}
      </div>
      <div className="blade-pommel" aria-hidden="true" />
    </header>
  );
}
