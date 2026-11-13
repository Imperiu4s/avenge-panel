export interface AccentTheme {
  key: string;
  label: string;
  signal: string;
  hot: string;
  deep: string;
}

export const THEMES: AccentTheme[] = [
  { key: 'crimson', label: 'Vörös', signal: '#ff2d37', hot: '#ff6a4d', deep: '#a50f1a' },
  { key: 'ember', label: 'Parázs', signal: '#ff7a1a', hot: '#ffa94d', deep: '#a34708' },
  { key: 'gold', label: 'Arany', signal: '#f5b301', hot: '#ffd24d', deep: '#8f6500' },
  { key: 'emerald', label: 'Smaragd', signal: '#19d48a', hot: '#5ff0b5', deep: '#0b7a4e' },
  { key: 'azure', label: 'Azúr', signal: '#2e8bff', hot: '#6cb3ff', deep: '#114f9e' },
  { key: 'violet', label: 'Ibolya', signal: '#8b5cff', hot: '#b197ff', deep: '#4a24a8' },
  { key: 'rose', label: 'Rózsa', signal: '#ff3d8b', hot: '#ff7ab0', deep: '#a3124f' }
];

export const DEFAULT_THEME = 'crimson';
const STORAGE_KEY = 'avenge.theme';
const THEME_EVENT = 'avenge:theme';

function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgb(hex: string): string {
  return channels(hex).join(', ');
}

function mix(hex: string, target: number, amount: number): string {
  const [r, g, b] = channels(hex).map((c) => Math.round(c + (target - c) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export type Rgb = [number, number, number];

let accentCache: { signal: Rgb; hot: Rgb } | null = null;

export function accentChannels(): { signal: Rgb; hot: Rgb } {
  if (!accentCache) {
    const theme = findTheme(document.documentElement.dataset.accent);
    accentCache = { signal: channels(theme.signal), hot: channels(theme.hot) };
  }
  return accentCache;
}

export function findTheme(key: string | null | undefined): AccentTheme {
  return THEMES.find((t) => t.key === key) ?? THEMES[0];
}

export function currentTheme(): string {
  try {
    return findTheme(localStorage.getItem(STORAGE_KEY)).key;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(key: string | null | undefined, remember = true) {
  const theme = findTheme(key);
  const style = document.documentElement.style;
  const vars: [string, string][] = [
    ['--signal', theme.signal],
    ['--signal-hot', theme.hot],
    ['--signal-deep', theme.deep],
    ['--signal-rgb', rgb(theme.signal)],
    ['--signal-hot-rgb', rgb(theme.hot)],
    ['--signal-deep-rgb', rgb(theme.deep)],
    ['--signal-tint', mix(theme.hot, 255, 0.62)],
    ['--btn-top', mix(theme.signal, 255, 0.1)],
    ['--btn-mid', mix(theme.signal, 0, 0.12)],
    ['--btn-bot', theme.deep],
    ['--grip-top', mix(theme.signal, 0, 0.3)],
    ['--grip-mid', mix(theme.deep, 0, 0.22)],
    ['--grip-bot', mix(theme.deep, 0, 0.42)]
  ];
  for (const [name, value] of vars) {
    if (theme.key === DEFAULT_THEME) style.removeProperty(name);
    else style.setProperty(name, value);
  }
  document.documentElement.dataset.accent = theme.key;
  accentCache = null;
  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEY, theme.key);
    } catch {
    }
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme.key }));
}

export function initTheme() {
  applyTheme(currentTheme(), false);
}

export function onThemeChange(listener: (key: string) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail);
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
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
