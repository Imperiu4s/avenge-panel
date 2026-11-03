import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './motion';

// A főoldal radarja: a sugár körbejár, és amelyik nyomforráson áthalad, az
// felizzik - ezek azok a helyek, amiket a kliens valóban átnéz. Vászonra rajzol,
// és csak akkor fut, amikor látszik a képernyőn.

interface Blip {
  angle: number;
  radius: number;
  label: string;
  hitAt: number;
}

const SOURCES: Omit<Blip, 'hitAt'>[] = [
  { angle: 0.5, radius: 0.72, label: 'PREFETCH' },
  { angle: 1.25, radius: 0.46, label: 'BAM' },
  { angle: 2.05, radius: 0.8, label: 'USERASSIST' },
  { angle: 2.8, radius: 0.55, label: 'NTFS MFT' },
  { angle: 3.6, radius: 0.76, label: 'DEFENDER' },
  { angle: 4.35, radius: 0.38, label: 'MUICACHE' },
  { angle: 5.05, radius: 0.68, label: 'JAR' },
  { angle: 5.75, radius: 0.5, label: 'PCA' }
];

const TWO_PI = Math.PI * 2;
const SWEEP_PERIOD_MS = 5200;
const AFTERGLOW_MS = 2600;

export function RadarScope({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const blips: Blip[] = SOURCES.map((source) => ({ ...source, hitAt: -Infinity }));
    const reduced = prefersReducedMotion();
    let frame = 0;
    let visible = true;
    let previousAngle = -Math.PI / 2;

    const render = (time: number) => {
      const size = canvas.clientWidth;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(size * ratio)) {
        canvas.width = Math.round(size * ratio);
        canvas.height = Math.round(size * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const center = size / 2;
      const outer = size / 2 - 22;

      // Rácsgyűrűk és kereszt
      ctx.lineWidth = 1;
      for (const f of [0.25, 0.5, 0.75, 1]) {
        ctx.strokeStyle = `rgba(255, 228, 220, ${f === 1 ? 0.24 : 0.09})`;
        ctx.beginPath();
        ctx.arc(center, center, outer * f, 0, TWO_PI);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255, 228, 220, 0.07)';
      ctx.beginPath();
      ctx.moveTo(center - outer, center);
      ctx.lineTo(center + outer, center);
      ctx.moveTo(center, center - outer);
      ctx.lineTo(center, center + outer);
      ctx.stroke();

      // Fokbeosztás
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * TWO_PI;
        const major = i % 6 === 0;
        const r1 = outer + 5;
        const r2 = outer + (major ? 14 : 9);
        ctx.strokeStyle = `rgba(255, 228, 220, ${major ? 0.42 : 0.16})`;
        ctx.beginPath();
        ctx.moveTo(center + Math.cos(a) * r1, center + Math.sin(a) * r1);
        ctx.lineTo(center + Math.cos(a) * r2, center + Math.sin(a) * r2);
        ctx.stroke();
      }

      const angle = reduced ? 0.9 : ((time / SWEEP_PERIOD_MS) * TWO_PI) % TWO_PI;

      // A sugár csóvája: kúpos gradiens, ami a vezető él mögött halványul el.
      const tail = 1.5;
      if (typeof ctx.createConicGradient === 'function') {
        const gradient = ctx.createConicGradient(angle - tail, center, center);
        const span = tail / TWO_PI;
        gradient.addColorStop(0, 'rgba(255, 45, 55, 0)');
        gradient.addColorStop(span * 0.75, 'rgba(255, 45, 55, 0.14)');
        gradient.addColorStop(span, 'rgba(255, 70, 70, 0.5)');
        gradient.addColorStop(span + 0.0001, 'rgba(255, 45, 55, 0)');
        gradient.addColorStop(1, 'rgba(255, 45, 55, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, outer, 0, TWO_PI);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255, 120, 100, 0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer);
      ctx.stroke();

      // Nyomforrások
      ctx.font = `600 ${Math.max(9, size * 0.021)}px "JetBrains Mono Variable", Consolas, monospace`;
      for (const blip of blips) {
        const passed = previousAngle <= angle
          ? blip.angle > previousAngle && blip.angle <= angle
          : blip.angle > previousAngle || blip.angle <= angle;
        if (passed || reduced) blip.hitAt = time;

        const glow = reduced ? 0.8 : Math.max(0, 1 - (time - blip.hitAt) / AFTERGLOW_MS);
        const x = center + Math.cos(blip.angle) * outer * blip.radius;
        const y = center + Math.sin(blip.angle) * outer * blip.radius;

        ctx.fillStyle = `rgba(255, 228, 220, ${0.16 + glow * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, TWO_PI);
        ctx.fill();
        if (glow <= 0) continue;

        const pulse = 3 + (1 - glow) * 15;
        ctx.strokeStyle = `rgba(255, 80, 70, ${glow * 0.55})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, TWO_PI);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 96, 80, ${glow})`;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, TWO_PI);
        ctx.fill();

        // Célkereszt-keret és felirat a felizzó pont köré
        const b = 10;
        const c = 4;
        ctx.strokeStyle = `rgba(255, 236, 230, ${glow * 0.85})`;
        ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.moveTo(x + sx * b, y + sy * (b - c));
          ctx.lineTo(x + sx * b, y + sy * b);
          ctx.lineTo(x + sx * (b - c), y + sy * b);
        }
        ctx.stroke();

        const flip = blip.angle > Math.PI / 2 && blip.angle < (3 * Math.PI) / 2;
        ctx.textAlign = flip ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 236, 230, ${glow})`;
        ctx.fillText(blip.label, x + (flip ? -16 : 16), y);
      }

      ctx.fillStyle = '#ff5a4d';
      ctx.beginPath();
      ctx.arc(center, center, 3, 0, TWO_PI);
      ctx.fill();

      previousAngle = angle;
    };

    const loop = (time: number) => {
      render(time);
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };

    const resume = () => {
      if (!frame && visible && !document.hidden && !reduced) frame = requestAnimationFrame(loop);
    };

    if (reduced) {
      render(performance.now());
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      resume();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    resume();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);

  return <canvas ref={canvasRef} className={`radar-scope ${className}`} aria-hidden="true" />;
}
