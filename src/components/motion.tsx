import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

// Közös animációs építőkövek - külső animációs könyvtár nélkül. Minden
// animáció csak transform/opacity-t mozgat (GPU-n komponálódik, nem okoz
// layout-újraszámolást), így akadásmentes marad gyengébb gépen is. A
// prefers-reduced-motion beállítást mindegyik tiszteletben tartja.

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Igaz lesz, amint az elem először a képernyőre ér (utána már nem vált vissza). */
export function useInView<T extends Element>(rootMargin = '0px 0px -8% 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  variant?: 'up' | 'fade' | 'scale' | 'left' | 'right';
  style?: CSSProperties;
  id?: string;
}

/**
 * Görgetéskor (első megjelenéskor) beúszó tartalom. Keyframe-animációval,
 * "backwards" kitöltéssel (lásd index.css .reveal) - így a beúszás után az
 * elem visszakapja a saját stílusait, és pl. a hover-emelés nem akad össze a
 * beúszás késleltetésével.
 */
export function Reveal({ children, as: Tag = 'div', className = '', delay = 0, variant = 'up', style, id }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal reveal-${variant} ${inView ? 'is-visible' : ''} ${className}`}
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Számláló, ami 0-ról felfut a célértékig, amikor láthatóvá válik. */
export function CountUp({ value, suffix = '', duration = 1600 }: { value: number; suffix?: string; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="count-up">
      {display.toLocaleString('hu-HU')}
      {suffix}
    </span>
  );
}

const SCRAMBLE_CHARS = '0123456789';

/**
 * "Nyerőgép"-szerű betűpörgetés: amikor a szöveg megváltozik (pl. új session
 * kód generálásakor), a karakterek balról jobbra, egymás után állnak be a
 * végleges értékre.
 */
export function ScrambleText({
  text,
  className = '',
  renderChar
}: {
  text: string;
  className?: string;
  renderChar?: (char: string, index: number) => ReactNode;
}) {
  const [display, setDisplay] = useState(text);
  const previous = useRef(text);

  useEffect(() => {
    if (previous.current === text) return;
    previous.current = text;
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const perCharMs = 70;
    const settleMs = 260;
    const tick = (now: number) => {
      const elapsed = now - start;
      let done = true;
      const next = text
        .split('')
        .map((char, i) => {
          if (elapsed >= settleMs + i * perCharMs) return char;
          done = false;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');
      setDisplay(next);
      if (!done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  if (renderChar) {
    return <>{display.split('').map(renderChar)}</>;
  }
  return <span className={className}>{display}</span>;
}

/**
 * A ".spot" osztályú elemeken a kurzor alatt felizzik egy fényfolt (lásd
 * index.css). Egyetlen, dokumentum-szintű figyelő - nem kártyánként külön.
 */
export function usePointerSpotlight() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest?.('.spot') as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);
}

/** Vágólapra másolás rövid "Másolva" visszajelzéssel. */
export function useCopyFeedback(resetMs = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopiedKey(null), resetMs);
    } catch {
      // A vágólap-hozzáférés böngésző-engedélytől függ - nem blokkoló hiba,
      // a szöveg a képernyőn marad, kézzel is kimásolható.
    }
  };

  return { copiedKey, copy };
}

/** Másodpercenként frissülő jelenlegi idő - visszaszámlálókhoz. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Betöltés közbeni, csillogó helykitöltő blokk. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: { width?: number | string; height?: number | string; radius?: number; style?: CSSProperties }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}
