import { t } from '../i18n';
import type { MinecraftSession } from '../api/types';

export function sessionLabel(session: MinecraftSession): string {
  return `${session.client ?? 'Minecraft'}${session.version ? ` ${session.version}` : ''}`;
}

function span(ms: number): string {
  const minutes = Math.round(Math.abs(ms) / 60000);
  if (minutes < 1) return 'kevesebb mint 1 perccel';
  if (minutes < 60) return t('{0} perccel', minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return minutes % 60 === 0 ? t('{0} órával', hours) : t('{0} óra {1} perccel', hours, minutes % 60);
  return t('{0} nappal', Math.round(hours / 24));
}

export interface GameRelation {
  during: boolean;
  text: string;
}

export function relationToGame(when: string | null, sessions: MinecraftSession[] | null | undefined): GameRelation | null {
  if (!when || !sessions || sessions.length === 0) return null;
  const time = Date.parse(when);
  if (Number.isNaN(time)) return null;
  const sorted = [...sessions].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  const running = sorted.find((s) => Date.parse(s.startedAt) <= time);
  if (running) {
    return { during: true, text: t('a futó Minecraft ({0}) indítása után {1}, ugyanabban a játékmenetben', sessionLabel(running), span(time - Date.parse(running.startedAt))) };
  }
  const first = sorted[sorted.length - 1];
  return { during: false, text: t('a futó Minecraft ({0}) indítása előtt {1}', sessionLabel(first), span(Date.parse(first.startedAt) - time)) };
}
