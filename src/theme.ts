import { useSyncExternalStore } from 'react';
import { API_BASE } from './api/config';

export type SiteThemeKey = 'default' | 'christmas' | 'easter' | 'halloween';

export interface SiteTheme {
  key: SiteThemeKey;
  label: string;
  tagline: string;
  greeting: string | null;
  signal: string;
  hot: string;
  deep: string;
  tint: string;
  button: [string, string, string];
  grip: [string, string, string];
  swatches: string[];
}

export const SITE_THEMES: SiteTheme[] = [
  {
    key: 'default',
    label: 'Alap',
    tagline: 'Az Avenge megszokott, vörös arculata, díszek nélkül.',
    greeting: null,
    signal: '#ff2d37',
    hot: '#ff6a4d',
    deep: '#a50f1a',
    tint: '#ffd2c7',
    button: ['#ff3f46', '#e01923', '#b20f1a'],
    grip: ['#b01521', '#7f0e18', '#5d0a12'],
    swatches: ['#ff2d37', '#ff6a4d', '#a50f1a', '#151215']
  },
  {
    key: 'christmas',
    label: 'Karácsonyi',
    tagline: 'Hóesés, fényfüzér, mikulássapka, havas kártyák, fenyők és ajándékok.',
    greeting: 'Kellemes ünnepeket kíván az Avenge csapata!',
    signal: '#e3263a',
    hot: '#ffcf5a',
    deep: '#0f6b3a',
    tint: '#ffe8b0',
    button: ['#f0444f', '#c8102e', '#8e0b1f'],
    grip: ['#d61f33', '#a3122a', '#6e0c1c'],
    swatches: ['#e3263a', '#ffcf5a', '#0f6b3a', '#f4f7ff']
  },
  {
    key: 'easter',
    label: 'Húsvéti',
    tagline: 'Pasztell színek, hulló szirmok, pillangók, festett tojások, nyuszifül és virágos rét.',
    greeting: 'Kellemes húsvéti ünnepeket kíván az Avenge csapata!',
    signal: '#ff7eb6',
    hot: '#ffd84d',
    deep: '#7c5cff',
    tint: '#fff1c7',
    button: ['#ff9ccb', '#f0629f', '#b8457c'],
    grip: ['#f177ad', '#b65aa0', '#6d4bc4'],
    swatches: ['#ff7eb6', '#ffd84d', '#7c5cff', '#8fe3b0']
  },
  {
    key: 'halloween',
    label: 'Halloween',
    tagline: 'Narancs és lila, denevérek, pókhálók, lógó pókok, telihold, köd és világító tökök.',
    greeting: 'Boldog Halloweent kíván az Avenge csapata!',
    signal: '#ff7a1a',
    hot: '#ffb347',
    deep: '#7b2fd6',
    tint: '#ffd9a8',
    button: ['#ff9a3c', '#ff6a00', '#b84300'],
    grip: ['#ff7a1a', '#c4500a', '#3a1a5c'],
    swatches: ['#ff7a1a', '#ffb347', '#7b2fd6', '#0b0a10']
  }
];

const STORAGE_KEY = 'avenge.siteTheme';
const LEGACY_KEY = 'avenge.theme';

export type Rgb = [number, number, number];

function channels(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function findSiteTheme(key: string | null | undefined): SiteTheme {
  return SITE_THEMES.find((t) => t.key === key) ?? SITE_THEMES[0];
}

let saved: SiteThemeKey = 'default';
let active: SiteThemeKey = 'default';
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function paint(theme: SiteTheme) {
  const root = document.documentElement;
  const vars: [string, string][] = [
    ['--signal', theme.signal],
    ['--signal-hot', theme.hot],
    ['--signal-deep', theme.deep],
    ['--signal-rgb', channels(theme.signal).join(', ')],
    ['--signal-hot-rgb', channels(theme.hot).join(', ')],
    ['--signal-deep-rgb', channels(theme.deep).join(', ')],
    ['--signal-tint', theme.tint],
    ['--btn-top', theme.button[0]],
    ['--btn-mid', theme.button[1]],
    ['--btn-bot', theme.button[2]],
    ['--grip-top', theme.grip[0]],
    ['--grip-mid', theme.grip[1]],
    ['--grip-bot', theme.grip[2]]
  ];
  for (const [name, value] of vars) {
    if (theme.key === 'default') root.style.removeProperty(name);
    else root.style.setProperty(name, value);
  }
  root.dataset.siteTheme = theme.key;
  accentCache = null;
}

function setActive(key: SiteThemeKey) {
  active = key;
  paint(findSiteTheme(key));
  emit();
}

export function applySiteTheme(key: string | null | undefined) {
  saved = findSiteTheme(key).key;
  try {
    localStorage.setItem(STORAGE_KEY, saved);
  } catch {
  }
  setActive(saved);
}

export function previewSiteTheme(key: SiteThemeKey | null) {
  setActive(key ?? saved);
}

export function savedSiteTheme(): SiteThemeKey {
  return saved;
}

export function initSiteTheme() {
  try {
    localStorage.removeItem(LEGACY_KEY);
    saved = findSiteTheme(localStorage.getItem(STORAGE_KEY)).key;
  } catch {
    saved = 'default';
  }
  setActive(saved);
  fetch(`${API_BASE}/api/site`)
    .then((r) => (r.ok ? r.json() : null))
    .then((site: { theme?: string } | null) => {
      if (site?.theme && site.theme !== saved) applySiteTheme(site.theme);
    })
    .catch(() => undefined);
}

export function useSiteTheme(): SiteTheme {
  const key = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => active,
    () => active
  );
  return findSiteTheme(key);
}

let accentCache: { signal: Rgb; hot: Rgb } | null = null;

export function accentChannels(): { signal: Rgb; hot: Rgb } {
  if (!accentCache) {
    const theme = findSiteTheme(active);
    accentCache = { signal: channels(theme.signal), hot: channels(theme.hot) };
  }
  return accentCache;
}

export async function shrinkAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
  if (blob && blob.type === 'image/webp') return blob;
  return await new Promise<Blob>((resolve) => canvas.toBlob((png) => resolve(png ?? file), 'image/png'));
}
