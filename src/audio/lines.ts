import { NARRATION, type NarrationKey } from '../config/narration';

export interface Line {
  key: NarrationKey;
  variant: number;
  text: string;
  /** Enthält eingesetzte Platzhalter → kann nicht durch eine feste Aufnahme ersetzt werden. */
  hasVars: boolean;
}

export type Vars = Record<string, string | number>;

export function fill(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function line(key: NarrationKey, vars?: Vars, variant?: number): Line {
  const options = NARRATION[key];
  const v = variant ?? Math.floor(Math.random() * options.length);
  const template = options[v % options.length];
  return { key, variant: v, text: fill(template, vars), hasVars: /\{\w+\}/.test(template) };
}

/** "Anna, Ben und Carla" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}

/** Zerlegt in Sätze – wichtig gegen abgeschnittene lange Ansagen (Chrome/iOS). */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}
