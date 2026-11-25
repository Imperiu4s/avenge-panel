import { EN } from './en';

export type Lang = 'hu' | 'en';

const STORAGE_KEY = 'avenge.lang';

function detect(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'hu' || stored === 'en') return stored;
  } catch {
    void 0;
  }
  if (typeof navigator === 'undefined') return 'hu';
  const preferred = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return preferred.some((l) => (l ?? '').toLowerCase().startsWith('hu')) ? 'hu' : 'en';
}

export const lang: Lang = detect();
export const locale = lang === 'hu' ? 'hu-HU' : 'en-GB';

if (typeof document !== 'undefined') document.documentElement.lang = lang;

function format(text: string, args: unknown[]): string {
  if (args.length === 0) return text;
  return text.replace(/\{(\d+)\}/g, (match, index) => {
    const i = Number(index);
    return i < args.length ? String(args[i] ?? '') : match;
  });
}

export function t(text: string, ...args: unknown[]): string {
  return format(lang === 'en' ? EN[text] ?? text : text, args);
}

export function translateMessage(text: string): string {
  if (lang !== 'en' || !text) return text;
  const exact = EN[text];
  if (exact) return exact;
  const trimmed = text.trim();
  return EN[trimmed] ?? EN[trimmed.replace(/\.$/, '')] ?? text;
}

export function setLang(next: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    void 0;
  }
  if (next !== lang) window.location.reload();
}
