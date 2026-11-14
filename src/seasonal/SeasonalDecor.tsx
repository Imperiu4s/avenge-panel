import type { CSSProperties, ReactElement } from 'react';
import { useSiteTheme, type SiteThemeKey } from '../theme';
import { SeasonalParticles } from './SeasonalParticles';

const BULB_COLORS: Record<SiteThemeKey, string[]> = {
  default: [],
  christmas: ['#ff3b4a', '#ffd166', '#3ddc84', '#5cb8ff', '#ff7ae0'],
  easter: [],
  halloween: ['#ff7a1a', '#a855f7', '#84cc16', '#ffb347']
};

const FLAG_COLORS = ['#ff9ccb', '#ffe08a', '#c9b8ff', '#9fe7c4', '#a8d8ff'];

function Bauble({ color, x, length, size, delay }: { color: string; x: number; length: number; size: number; delay: number }) {
  return (
    <g className="bauble" style={{ transformOrigin: `${x}px 0px`, animationDelay: `${delay}s` }}>
      <line x1={x} y1={0} x2={x} y2={length} stroke="#d9c58a" strokeWidth="1.2" />
      <rect x={x - size * 0.22} y={length - 3} width={size * 0.44} height={5} rx={1.5} fill="#e9d48c" />
      <circle cx={x} cy={length + size} r={size} fill={color} />
      <circle cx={x - size * 0.35} cy={length + size * 0.65} r={size * 0.28} fill="rgba(255,255,255,0.55)" />
      <path d={`M${x - size} ${length + size} Q${x} ${length + size * 1.35} ${x + size} ${length + size}`} stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" fill="none" />
    </g>
  );
}

function ChristmasCorner({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`seasonal-corner seasonal-corner-${side}`} viewBox="0 0 150 230" aria-hidden="true">
      <Bauble color="#e3263a" x={28} length={92} size={15} delay={0} />
      <Bauble color="#ffcf5a" x={70} length={52} size={11} delay={0.6} />
      <Bauble color="#1d9a5b" x={112} length={128} size={17} delay={1.2} />
      <path d="M0 6 Q40 22 75 8 T150 10" stroke="#1f6d3d" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M0 6 Q40 22 75 8 T150 10" stroke="#2e8f53" strokeWidth="3" strokeDasharray="2 7" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="12" r="3.6" fill="#ff3b4a" />
      <circle cx="58" cy="15" r="3.6" fill="#ffd166" />
      <circle cx="97" cy="9" r="3.6" fill="#ff3b4a" />
      <circle cx="134" cy="11" r="3.6" fill="#5cb8ff" />
    </svg>
  );
}

function Web({ side }: { side: 'left' | 'right' }) {
  const rings = [26, 52, 80, 110];
  const spokes = [0, 18, 36, 54, 72, 90];
  return (
    <svg className={`seasonal-corner seasonal-web seasonal-corner-${side}`} viewBox="0 0 170 170" aria-hidden="true">
      <g stroke="rgba(230, 220, 255, 0.42)" strokeWidth="1" fill="none">
        {spokes.map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <line key={deg} x1="0" y1="0" x2={Math.cos(a) * 160} y2={Math.sin(a) * 160} />;
        })}
        {rings.map((r) => (
          <path
            key={r}
            d={spokes.slice(1).reduce((d, deg, i) => {
              const a0 = (spokes[i] * Math.PI) / 180;
              const a1 = (deg * Math.PI) / 180;
              const am = (a0 + a1) / 2;
              return `${d} Q${Math.cos(am) * r * 0.82} ${Math.sin(am) * r * 0.82} ${Math.cos(a1) * r} ${Math.sin(a1) * r}`;
            }, `M${r} 0`)}
          />
        ))}
      </g>
    </svg>
  );
}

function Spider() {
  return (
    <div className="seasonal-spider" aria-hidden="true">
      <span className="seasonal-spider-thread" />
      <svg viewBox="0 0 40 34" className="seasonal-spider-body">
        <g stroke="#1a1020" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M14 15 L4 8 L1 14" />
          <path d="M14 18 L3 17 L0 23" />
          <path d="M15 21 L5 26 L4 32" />
          <path d="M26 15 L36 8 L39 14" />
          <path d="M26 18 L37 17 L40 23" />
          <path d="M25 21 L35 26 L36 32" />
        </g>
        <ellipse cx="20" cy="19" rx="8" ry="9" fill="#1a1020" />
        <circle cx="20" cy="10" r="5" fill="#1a1020" />
        <circle cx="18" cy="9.5" r="1.3" fill="#ff7a1a" />
        <circle cx="22" cy="9.5" r="1.3" fill="#ff7a1a" />
      </svg>
    </div>
  );
}

function Tulips({ side }: { side: 'left' | 'right' }) {
  const flowers = [
    { x: 30, h: 70, c: '#ff8fc0' },
    { x: 62, h: 98, c: '#ffd84d' },
    { x: 96, h: 80, c: '#b79cff' },
    { x: 126, h: 58, c: '#ff9ccb' }
  ];
  return (
    <svg className={`seasonal-corner seasonal-corner-bottom seasonal-corner-${side}`} viewBox="0 0 160 130" aria-hidden="true">
      {flowers.map((f, i) => (
        <g key={i} className="tulip" style={{ transformOrigin: `${f.x}px 130px`, animationDelay: `${i * 0.4}s` }}>
          <path d={`M${f.x} 130 Q${f.x - 4} ${130 - f.h / 2} ${f.x} ${130 - f.h}`} stroke="#4caf6e" strokeWidth="3.2" fill="none" />
          <path d={`M${f.x} ${130 - f.h * 0.35} Q${f.x + 16} ${130 - f.h * 0.55} ${f.x + 18} ${130 - f.h * 0.75} Q${f.x + 6} ${130 - f.h * 0.5} ${f.x} ${130 - f.h * 0.42}`} fill="#5cc47f" />
          <path d={`M${f.x - 11} ${118 - f.h} Q${f.x - 12} ${136 - f.h} ${f.x} ${138 - f.h} Q${f.x + 12} ${136 - f.h} ${f.x + 11} ${118 - f.h} L${f.x + 6} ${126 - f.h} L${f.x} ${116 - f.h} L${f.x - 6} ${126 - f.h} Z`} fill={f.c} />
        </g>
      ))}
    </svg>
  );
}

export function SeasonalLayer() {
  const theme = useSiteTheme();
  if (theme.key === 'default') return null;
  return (
    <>
      <div className={`seasonal-sky seasonal-sky-${theme.key}`} aria-hidden="true">
        {theme.key === 'halloween' && <span className="seasonal-moon" />}
        {theme.key === 'halloween' && <span className="seasonal-fog" />}
        {theme.key === 'christmas' && <span className="seasonal-aurora" />}
        {theme.key === 'easter' && <span className="seasonal-sun" />}
      </div>
      <SeasonalParticles theme={theme.key} />
      <div className="seasonal-corners" aria-hidden="true">
        {theme.key === 'christmas' && <><ChristmasCorner side="left" /><ChristmasCorner side="right" /></>}
        {theme.key === 'halloween' && <><Web side="left" /><Web side="right" /><Spider /></>}
        {theme.key === 'easter' && <><Tulips side="left" /><Tulips side="right" /></>}
      </div>
    </>
  );
}

export function SeasonalNavTrim() {
  const theme = useSiteTheme();
  if (theme.key === 'default') return null;
  if (theme.key === 'easter') {
    return (
      <div className="seasonal-trim seasonal-bunting" aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => <span key={i} style={{ background: FLAG_COLORS[i % FLAG_COLORS.length], animationDelay: `${(i % 6) * 0.25}s` }} />)}
      </div>
    );
  }
  const colors = BULB_COLORS[theme.key];
  return (
    <div className={`seasonal-trim seasonal-lights seasonal-lights-${theme.key}`} aria-hidden="true">
      {Array.from({ length: 34 }, (_, i) => (
        <span key={i} style={{ '--bulb': colors[i % colors.length], animationDelay: `${(i % 5) * 0.37}s` } as CSSProperties} />
      ))}
    </div>
  );
}

const HATS: Record<Exclude<SiteThemeKey, 'default'>, ReactElement> = {
  christmas: (
    <svg viewBox="0 0 64 52">
      <path d="M8 40 C14 18 30 4 50 8 C58 10 60 20 56 30 C52 22 44 20 40 24 C34 30 30 36 30 40 Z" fill="#d61f33" />
      <path d="M40 24 C46 18 54 20 56 30" stroke="#a3122a" strokeWidth="2" fill="none" />
      <rect x="4" y="36" width="34" height="11" rx="5.5" fill="#f4f7ff" />
      <circle cx="56" cy="32" r="6.5" fill="#f4f7ff" />
    </svg>
  ),
  easter: (
    <svg viewBox="0 0 64 52">
      <g className="bunny-ear bunny-ear-left">
        <ellipse cx="22" cy="24" rx="8" ry="21" fill="#fbe9f2" transform="rotate(-14 22 24)" />
        <ellipse cx="22" cy="25" rx="4" ry="15" fill="#ffadd0" transform="rotate(-14 22 25)" />
      </g>
      <g className="bunny-ear bunny-ear-right">
        <ellipse cx="42" cy="24" rx="8" ry="21" fill="#fbe9f2" transform="rotate(14 42 24)" />
        <ellipse cx="42" cy="25" rx="4" ry="15" fill="#ffadd0" transform="rotate(14 42 25)" />
      </g>
    </svg>
  ),
  halloween: (
    <svg viewBox="0 0 64 52">
      <path d="M30 4 C36 -2 46 4 44 12" stroke="#ff7a1a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M30 4 C36 -2 46 4 44 12" stroke="#3a1f57" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M14 40 L30 4 C33 0 37 2 36 8 L40 40 Z" fill="#3a1f57" stroke="#ff7a1a" strokeWidth="1.4" />
      <rect x="21" y="31" width="22" height="6" fill="#ff7a1a" />
      <rect x="29" y="30" width="7" height="8" rx="1" fill="none" stroke="#ffd166" strokeWidth="1.6" />
      <ellipse cx="32" cy="42" rx="30" ry="6" fill="#4a2870" stroke="#ff7a1a" strokeWidth="1.4" />
    </svg>
  )
};

export function SeasonalHat() {
  const theme = useSiteTheme();
  if (theme.key === 'default') return null;
  return <span className={`seasonal-hat seasonal-hat-${theme.key}`} aria-hidden="true">{HATS[theme.key]}</span>;
}

function ChristmasGround() {
  const trees = [70, 160, 1120, 1210, 1300];
  return (
    <svg viewBox="0 0 1400 150" preserveAspectRatio="xMidYMax slice">
      <path d="M0 110 Q180 70 360 102 T720 96 T1080 104 T1400 92 V150 H0 Z" fill="#dfe9ff" opacity="0.16" />
      {trees.map((x, i) => {
        const s = i % 2 === 0 ? 1 : 0.8;
        return (
          <g key={x} transform={`translate(${x} ${108 - 70 * s}) scale(${s})`}>
            <rect x="-6" y="70" width="12" height="16" fill="#3b2418" />
            <path d="M0 0 L34 40 H18 L44 72 H-44 L-18 40 H-34 Z" fill="#14532d" />
            <path d="M0 0 L14 16 Q0 22 -14 16 Z M-18 40 Q0 48 18 40 L26 50 Q0 58 -26 50 Z" fill="#eef4ff" opacity="0.9" />
            <circle cx="-14" cy="56" r="3" fill="#ffd166" className="tree-light" />
            <circle cx="12" cy="46" r="3" fill="#ff3b4a" className="tree-light" style={{ animationDelay: '0.5s' }} />
            <circle cx="20" cy="64" r="3" fill="#5cb8ff" className="tree-light" style={{ animationDelay: '1s' }} />
            <path d="M0 -10 L3 -3 L10 -3 L4 1 L6 8 L0 4 L-6 8 L-4 1 L-10 -3 L-3 -3 Z" fill="#ffd166" />
          </g>
        );
      })}
      {[[260, '#e3263a', '#ffd166'], [300, '#1d9a5b', '#ff3b4a'], [1040, '#ffcf5a', '#e3263a']].map(([x, box, ribbon]) => (
        <g key={String(x)} transform={`translate(${x} 104)`}>
          <rect x="-18" y="0" width="36" height="28" rx="3" fill={String(box)} />
          <rect x="-3" y="0" width="6" height="28" fill={String(ribbon)} />
          <rect x="-18" y="11" width="36" height="6" fill={String(ribbon)} />
          <path d="M0 0 C-12 -14 -18 -2 0 0 C12 -14 18 -2 0 0" stroke={String(ribbon)} strokeWidth="3.5" fill="none" />
        </g>
      ))}
      <path d="M0 128 Q200 112 420 126 T860 122 T1400 126 V150 H0 Z" fill="#eef4ff" opacity="0.9" />
    </svg>
  );
}

function EasterGround() {
  const eggs: [number, string, string][] = [[240, '#ff9ccb', '#fff1c7'], [300, '#c9b8ff', '#ffe08a'], [1080, '#9fe7c4', '#ff9ccb'], [1150, '#ffe08a', '#7c5cff']];
  return (
    <svg viewBox="0 0 1400 150" preserveAspectRatio="xMidYMax slice">
      <path d="M0 100 Q220 70 460 98 T940 92 T1400 96 V150 H0 Z" fill="#3f8f5c" opacity="0.35" />
      {eggs.map(([x, base, stripe], i) => (
        <g key={x} transform={`translate(${x} ${112 - (i % 2) * 6}) rotate(${i % 2 ? 12 : -10})`}>
          <ellipse cx="0" cy="0" rx="15" ry="20" fill={base} />
          <path d="M-14 -4 L-9 -9 L-4 -4 L1 -9 L6 -4 L11 -9 L15 -4" stroke={stripe} strokeWidth="3" fill="none" />
          <path d="M-14 7 Q0 13 14 7" stroke={stripe} strokeWidth="2.5" fill="none" />
          <circle cx="-6" cy="-14" r="2" fill={stripe} />
          <circle cx="5" cy="-13" r="2" fill={stripe} />
        </g>
      ))}
      <g transform="translate(1250 70)" className="peek-bunny">
        <ellipse cx="-8" cy="-16" rx="6" ry="18" fill="#fbe9f2" transform="rotate(-10 -8 -16)" />
        <ellipse cx="10" cy="-16" rx="6" ry="18" fill="#fbe9f2" transform="rotate(12 10 -16)" />
        <ellipse cx="1" cy="16" rx="22" ry="19" fill="#fbe9f2" />
        <circle cx="-7" cy="12" r="2.4" fill="#3b2a3f" />
        <circle cx="9" cy="12" r="2.4" fill="#3b2a3f" />
        <ellipse cx="1" cy="19" rx="3" ry="2" fill="#ff8fc0" />
      </g>
      {Array.from({ length: 70 }, (_, i) => {
        const x = i * 20 + (i % 3) * 4;
        const h = 14 + ((i * 7) % 16);
        return <path key={i} d={`M${x} 150 Q${x + 3} ${150 - h / 2} ${x + 6} ${150 - h}`} stroke={i % 2 ? '#5cc47f' : '#4caf6e'} strokeWidth="3" fill="none" />;
      })}
      {[150, 420, 700, 980, 1330].map((x, i) => (
        <g key={x} transform={`translate(${x} ${124 - (i % 2) * 8})`}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-6" rx="3.6" ry="6.5" fill="#fff8fb" transform={`rotate(${a})`} />)}
          <circle r="3.4" fill="#ffd84d" />
        </g>
      ))}
    </svg>
  );
}

function HalloweenGround() {
  const pumpkins = [190, 270, 1110, 1190];
  return (
    <svg viewBox="0 0 1400 150" preserveAspectRatio="xMidYMax slice">
      <path d="M0 112 Q240 80 520 108 T1000 100 T1400 106 V150 H0 Z" fill="#1a0f24" />
      <g transform="translate(70 40)" fill="#140b1c">
        <path d="M14 110 C10 70 18 40 4 10 C14 26 22 30 24 12 C28 36 30 60 30 110 Z" />
        <path d="M22 50 C40 36 52 40 64 26 M24 70 C6 62 -6 64 -16 52" stroke="#140b1c" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
      {[[400, 'R.I.P.'], [980, 'GG'], [1300, 'AFK']].map(([x, text], i) => (
        <g key={String(x)} transform={`translate(${x} ${84 + (i % 2) * 6}) rotate(${i % 2 ? 4 : -5})`}>
          <path d="M-20 34 V0 Q-20 -18 0 -18 Q20 -18 20 0 V34 Z" fill="#3a3346" />
          <text x="0" y="6" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#8d84a0">{text}</text>
        </g>
      ))}
      {pumpkins.map((x, i) => {
        const s = i % 2 ? 0.8 : 1;
        return (
          <g key={x} transform={`translate(${x} ${118}) scale(${s})`}>
            <rect x="-3" y="-34" width="6" height="10" rx="2" fill="#4d7c0f" />
            <ellipse cx="-12" cy="-6" rx="15" ry="20" fill="#e8620c" />
            <ellipse cx="12" cy="-6" rx="15" ry="20" fill="#e8620c" />
            <ellipse cx="0" cy="-6" rx="15" ry="21" fill="#ff7a1a" />
            <g className="pumpkin-glow" style={{ animationDelay: `${i * 0.6}s` }}>
              <path d="M-14 -14 L-6 -14 L-10 -6 Z M6 -14 L14 -14 L10 -6 Z" fill="#ffe08a" />
              <path d="M-14 2 L-9 6 L-4 2 L0 6 L4 2 L9 6 L14 2 L10 9 L-10 9 Z" fill="#ffe08a" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function SeasonalGround() {
  const theme = useSiteTheme();
  if (theme.key === 'default') return null;
  return (
    <div className={`seasonal-ground seasonal-ground-${theme.key}`}>
      <div className="seasonal-ground-art" aria-hidden="true">
        {theme.key === 'christmas' && <ChristmasGround />}
        {theme.key === 'easter' && <EasterGround />}
        {theme.key === 'halloween' && <HalloweenGround />}
      </div>
      {theme.greeting && <span className="seasonal-greeting">{theme.greeting}</span>}
    </div>
  );
}
