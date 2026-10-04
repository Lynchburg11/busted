import { NARRATION, type NarrationKey } from '../config/narration';
import type { RoleId } from '../game/types';

/** Fester Text aus narration.ts – kann durch eine Aufnahme ersetzt werden. */
export interface TextLine {
  kind: 'text';
  key: NarrationKey;
  variant: number;
  text: string;
}

/** Spielername – eigene Aufnahme des Spielers oder Computerstimme. */
export interface NameLine {
  kind: 'name';
  playerId: string;
  text: string;
}

export type Line = TextLine | NameLine;

export function line(key: NarrationKey, variant?: number): TextLine {
  const options: readonly string[] = NARRATION[key];
  const v = variant ?? Math.floor(Math.random() * options.length);
  return { kind: 'text', key, variant: v, text: options[v % options.length] };
}

export function nameLine(player: { id: string; name: string }): NameLine {
  return { kind: 'name', playerId: player.id, text: player.name };
}

/** [Name] + Textstück, z. B. "Anna" + "wurde erwischt. Busted!" */
export function named(player: { id: string; name: string }, key: NarrationKey): Line[] {
  return [nameLine(player), line(key)];
}

/** Textstück + [Rolle], z. B. "Die Rolle war:" + "Klassensprecher." */
export function roleReveal(role: RoleId): Line[] {
  return [line('roleIntro'), line(`role_${role}`)];
}

/** "Anna, Ben und Carla" (nur für die Anzeige) */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}

/** Zerlegt in Sätze – wichtig gegen abgeschnittene lange Ansagen (Chrome/iOS). */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}
