import {
  BALANCE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLES,
  SPECIAL_ROLES,
  suggestedTeacherCount,
} from '../config/roles';
import type { RoleId } from './types';

export interface SetupConfig {
  teacherCount: number;
  specials: RoleId[];
}

export interface SetupAnalysis {
  score: number;
  deck: RoleId[];
  errors: string[];
  warnings: string[];
  schuelerCount: number;
}

export function suggestSetup(players: number): SetupConfig {
  const teacherCount = suggestedTeacherCount(players);
  const specials: RoleId[] = [];
  for (const id of SPECIAL_ROLES) {
    const from = ROLES[id].suggestFrom;
    if (from !== null && players >= from && teacherCount + specials.length < players - 1) {
      specials.push(id);
    }
  }
  return { teacherCount, specials };
}

/** Baut das Kartendeck: Lehrer + Sonderrollen, aufgefüllt mit Schülern. */
export function buildDeck(setup: SetupConfig, players: number): RoleId[] {
  const deck: RoleId[] = [];
  for (let i = 0; i < setup.teacherCount; i++) deck.push('lehrer');
  for (const id of SPECIAL_ROLES) if (setup.specials.includes(id)) deck.push(id);
  while (deck.length < players) deck.push('schueler');
  return deck;
}

export function analyzeSetup(setup: SetupConfig, players: number): SetupAnalysis {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (players < MIN_PLAYERS) errors.push(`Mindestens ${MIN_PLAYERS} Spieler nötig.`);
  if (players > MAX_PLAYERS) errors.push(`Höchstens ${MAX_PLAYERS} Spieler möglich.`);
  if (setup.teacherCount < 1) errors.push('Es braucht mindestens einen Lehrer.');
  if (setup.teacherCount * 2 >= players && players > 0)
    errors.push('Zu viele Lehrer – sie hätten sofort gewonnen.');
  if (setup.teacherCount + setup.specials.length > players)
    errors.push('Mehr Rollen als Spieler. Bitte Sonderrollen abwählen.');

  const deck = buildDeck(setup, players).slice(0, Math.max(players, 0));
  const score = deck.reduce((sum, r) => sum + ROLES[r].weight, 0);
  const schuelerCount = deck.filter((r) => r === 'schueler').length;

  if (errors.length === 0) {
    if (score < BALANCE.teacherAdvantageBelow)
      warnings.push('Unausgewogen: Die Lehrer sind klar im Vorteil.');
    if (score > BALANCE.studentAdvantageAbove)
      warnings.push('Unausgewogen: Die Schüler sind klar im Vorteil.');
    if (setup.teacherCount > players / 3)
      warnings.push('Sehr viele Lehrer für diese Spielerzahl.');
    if (setup.specials.includes('streber') && players < 7)
      warnings.push('Der Streber ist bei wenigen Spielern sehr stark für die Lehrer.');
    if (setup.specials.includes('vertretungslehrer') && players < 6)
      warnings.push('Die Gruppenarbeit kann bei wenigen Spielern das Spiel schnell beenden.');
    if (schuelerCount === 0 && players >= 6)
      warnings.push('Keine normalen Schüler – das wird chaotisch.');
  }

  return { score, deck, errors, warnings, schuelerCount };
}

/** Fisher-Yates mit injizierbarem Zufall (für Tests). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
