import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../components/motion';
import type { SiteThemeKey } from '../theme';

interface Drop {
  x: number;
  y: number;
  size: number;
  speed: number;
  sway: number;
  phase: number;
  spin: number;
  angle: number;
  alpha: number;
  color: string;
  star: boolean;
}


const PETALS = ['#ffc4dd', '#ffe7a3', '#d9c8ff', '#c8f2dc', '#fff4f8', '#ffb3d1'];
const LEAVES = ['#ff8a2a', '#c2410c', '#d97706', '#9a3412', '#f59e0b', '#7c2d12'];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function drawFlake(ctx: CanvasRenderingContext2D, d: Drop) {
  ctx.globalAlpha = d.alpha;
  if (!d.star) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.angle);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const ex = Math.cos(a) * d.size * 2.2;
    const ey = Math.sin(a) * d.size * 2.2;
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.moveTo(ex * 0.55 + Math.cos(a + 0.6) * d.size * 0.7, ey * 0.55 + Math.sin(a + 0.6) * d.size * 0.7);
    ctx.lineTo(ex * 0.55, ey * 0.55);
    ctx.lineTo(ex * 0.55 + Math.cos(a - 0.6) * d.size * 0.7, ey * 0.55 + Math.sin(a - 0.6) * d.size * 0.7);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPetal(ctx: CanvasRenderingContext2D, d: Drop) {
  ctx.save();
  ctx.globalAlpha = d.alpha;
  ctx.translate(d.x, d.y);
  ctx.rotate(d.angle);
  ctx.scale(1, Math.abs(Math.cos(d.phase * 1.7)) * 0.6 + 0.4);
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, d.size, d.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx: CanvasRenderingContext2D, d: Drop) {
  ctx.save();
  ctx.globalAlpha = d.alpha;
  ctx.translate(d.x, d.y);
  ctx.rotate(d.angle);
  ctx.scale(Math.cos(d.phase * 1.3) * 0.5 + 0.7, 1);
  const s = d.size;
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.8, s * 0.5, 0, s);
  ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.9, -s * 0.6, 0, -s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60, 20, 0, 0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.9);
  ctx.lineTo(0, s * 1.25);
  ctx.stroke();
  ctx.restore();
}

export function SeasonalParticles({ theme }: { theme: SiteThemeKey }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || theme === 'default') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = prefersReducedMotion();
    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const density = theme === 'christmas' ? 30000 : theme === 'easter' ? 70000 : 80000;
    const cap = theme === 'christmas' ? 60 : 22;
    const count = reduced ? Math.min(12, cap) : Math.min(cap, Math.round((width * height) / density));

    const spawn = (anywhere: boolean): Drop => {
      const size = theme === 'christmas' ? rand(0.8, 3.1) : theme === 'easter' ? rand(3.5, 7.5) : rand(5.5, 10.5);
      return {
        x: rand(0, width),
        y: anywhere ? rand(0, height) : rand(-40, -10),
        size,
        speed: theme === 'christmas' ? 10 + size * 8 : theme === 'easter' ? rand(10, 20) : rand(14, 28),
        sway: theme === 'christmas' ? rand(8, 26) : rand(18, 46),
        phase: rand(0, Math.PI * 2),
        spin: rand(-1.4, 1.4),
        angle: rand(0, Math.PI * 2),
        alpha: theme === 'christmas' ? rand(0.2, 0.55) : rand(0.3, 0.55),
        color: theme === 'easter' ? pick(PETALS) : pick(LEAVES),
        star: theme === 'christmas' && size > 2.5 && Math.random() < 0.55
      };
    };

    const drops = Array.from({ length: count }, () => spawn(true));
    let frame = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.strokeStyle = 'rgba(235, 244, 255, 0.95)';

      for (const d of drops) {
        if (!reduced) {
          d.phase += dt;
          d.y += d.speed * dt;
          d.x += Math.sin(d.phase * 0.9) * d.sway * dt;
          d.angle += d.spin * dt;
          if (d.y > height + 20) Object.assign(d, spawn(false));
          if (d.x < -30) d.x = width + 20;
          if (d.x > width + 30) d.x = -20;
        }
        if (theme === 'christmas') drawFlake(ctx, d);
        else if (theme === 'easter') drawPetal(ctx, d);
        else drawLeaf(ctx, d);
      }
      ctx.globalAlpha = 1;

      if (!reduced) {
        frame = requestAnimationFrame(draw);
      }
    };

    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [theme]);

  if (theme === 'default') return null;
  return <canvas className={`seasonal-particles seasonal-particles-${theme}`} ref={ref} aria-hidden="true" />;
}
