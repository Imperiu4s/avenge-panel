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

interface Flyer {
  x: number;
  y: number;
  vx: number;
  baseY: number;
  phase: number;
  size: number;
  color: string;
  life: number;
}

const PETALS = ['#ffc4dd', '#ffe7a3', '#d9c8ff', '#c8f2dc', '#fff4f8', '#ffb3d1'];
const LEAVES = ['#ff8a2a', '#c2410c', '#d97706', '#9a3412', '#f59e0b', '#7c2d12'];
const WINGS = ['#ffb3d1', '#ffe08a', '#c9b8ff', '#9fe7c4'];

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

function drawButterfly(ctx: CanvasRenderingContext2D, f: Flyer, time: number) {
  const flap = Math.abs(Math.sin(time * 0.012 + f.phase)) * 0.75 + 0.25;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(Math.sin(time * 0.002 + f.phase) * 0.25);
  ctx.globalAlpha = 0.9;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * flap, 1);
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.ellipse(f.size * 0.55, -f.size * 0.35, f.size * 0.6, f.size * 0.45, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(f.size * 0.42, f.size * 0.3, f.size * 0.4, f.size * 0.3, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(f.size * 0.62, -f.size * 0.4, f.size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#3b2a3f';
  ctx.beginPath();
  ctx.ellipse(0, 0, f.size * 0.09, f.size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBat(ctx: CanvasRenderingContext2D, f: Flyer, time: number) {
  const flap = Math.sin(time * 0.02 + f.phase);
  const s = f.size;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.vx < 0 ? -1 : 1, 1);
  ctx.shadowColor = 'rgba(255, 122, 26, 0.55)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#1d1029';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.15);
  ctx.quadraticCurveTo(-s * 0.5, -s * 0.6 * flap - s * 0.2, -s * 1.3, -s * 0.5 * flap);
  ctx.quadraticCurveTo(-s * 1.05, s * 0.05, -s * 0.85, s * 0.15);
  ctx.quadraticCurveTo(-s * 0.6, 0, -s * 0.45, s * 0.25);
  ctx.quadraticCurveTo(-s * 0.25, s * 0.05, 0, s * 0.3);
  ctx.quadraticCurveTo(s * 0.25, s * 0.05, s * 0.45, s * 0.25);
  ctx.quadraticCurveTo(s * 0.6, 0, s * 0.85, s * 0.15);
  ctx.quadraticCurveTo(s * 1.05, s * 0.05, s * 1.3, -s * 0.5 * flap);
  ctx.quadraticCurveTo(s * 0.5, -s * 0.6 * flap - s * 0.2, 0, -s * 0.15);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, -s * 0.2);
  ctx.lineTo(-s * 0.1, -s * 0.42);
  ctx.lineTo(-s * 0.02, -s * 0.22);
  ctx.lineTo(s * 0.02, -s * 0.22);
  ctx.lineTo(s * 0.1, -s * 0.42);
  ctx.lineTo(s * 0.16, -s * 0.2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(-s * 0.09, -s * 0.12, s * 0.05, s * 0.05);
  ctx.fillRect(s * 0.04, -s * 0.12, s * 0.05, s * 0.05);
  ctx.restore();
}

function drawShootingStar(ctx: CanvasRenderingContext2D, f: Flyer) {
  const tail = 120;
  const gradient = ctx.createLinearGradient(f.x, f.y, f.x - tail, f.y - tail * 0.35);
  gradient.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  gradient.addColorStop(1, 'rgba(255, 236, 170, 0)');
  ctx.save();
  ctx.globalAlpha = Math.min(1, f.life * 2);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(f.x, f.y);
  ctx.lineTo(f.x - tail, f.y - tail * 0.35);
  ctx.stroke();
  ctx.fillStyle = '#fff6d6';
  ctx.shadowColor = '#ffd76a';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
  ctx.fill();
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

    const density = theme === 'christmas' ? 15000 : theme === 'easter' ? 34000 : 38000;
    const cap = theme === 'christmas' ? 120 : 46;
    const count = reduced ? Math.min(24, cap) : Math.min(cap, Math.round((width * height) / density));

    const spawn = (anywhere: boolean): Drop => {
      const size = theme === 'christmas' ? rand(0.8, 3.1) : theme === 'easter' ? rand(3.5, 7.5) : rand(5.5, 10.5);
      return {
        x: rand(0, width),
        y: anywhere ? rand(0, height) : rand(-40, -10),
        size,
        speed: theme === 'christmas' ? 14 + size * 13 : theme === 'easter' ? rand(14, 30) : rand(22, 48),
        sway: theme === 'christmas' ? rand(8, 26) : rand(18, 46),
        phase: rand(0, Math.PI * 2),
        spin: rand(-1.4, 1.4),
        angle: rand(0, Math.PI * 2),
        alpha: theme === 'christmas' ? rand(0.35, 0.9) : rand(0.55, 0.9),
        color: theme === 'easter' ? pick(PETALS) : pick(LEAVES),
        star: theme === 'christmas' && size > 2.5 && Math.random() < 0.55
      };
    };

    const drops = Array.from({ length: count }, () => spawn(true));
    const flyers: Flyer[] = [];
    let nextFlyer = performance.now() + rand(2500, 6000);
    let frame = 0;
    let last = performance.now();

    const spawnFlyer = (now: number) => {
      if (theme === 'christmas') {
        flyers.push({ x: rand(width * 0.2, width * 0.9), y: rand(30, height * 0.3), vx: 520, baseY: 0, phase: 0, size: 1, color: '', life: 1 });
        nextFlyer = now + rand(9000, 18000);
        return;
      }
      const fromLeft = Math.random() < 0.5;
      const groupSize = theme === 'halloween' ? 1 + Math.floor(Math.random() * 3) : 1;
      const baseY = theme === 'halloween' ? rand(90, height * 0.42) : rand(height * 0.25, height * 0.8);
      for (let i = 0; i < groupSize; i++) {
        flyers.push({
          x: fromLeft ? -40 - i * 46 : width + 40 + i * 46,
          y: baseY + i * rand(-18, 18),
          vx: (fromLeft ? 1 : -1) * (theme === 'halloween' ? rand(150, 240) : rand(55, 90)),
          baseY: baseY + i * rand(-22, 22),
          phase: rand(0, 10),
          size: theme === 'halloween' ? rand(14, 22) : rand(9, 13),
          color: pick(WINGS),
          life: 1
        });
      }
      nextFlyer = now + (theme === 'halloween' ? rand(5000, 11000) : rand(7000, 15000));
    };

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
        if (now > nextFlyer) spawnFlyer(now);
        for (let i = flyers.length - 1; i >= 0; i--) {
          const f = flyers[i];
          if (theme === 'christmas') {
            f.x += f.vx * dt;
            f.y += f.vx * 0.35 * dt;
            f.life -= dt * 1.1;
            drawShootingStar(ctx, f);
            if (f.life <= 0) flyers.splice(i, 1);
            continue;
          }
          f.x += f.vx * dt;
          f.y = f.baseY + Math.sin(now * (theme === 'halloween' ? 0.004 : 0.0022) + f.phase) * (theme === 'halloween' ? 22 : 36);
          if (theme === 'halloween') drawBat(ctx, f, now);
          else drawButterfly(ctx, f, now);
          if (f.x < -120 || f.x > width + 120) flyers.splice(i, 1);
        }
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
