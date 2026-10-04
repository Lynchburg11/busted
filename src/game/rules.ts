import { ROLES } from '../config/roles';
import type { Camp, GamePlayer, GameState, NightStepId, RoleId, Winner } from './types';

export const getPlayer = (s: GameState, id: string | null | undefined): GamePlayer | undefined =>
  id ? s.players.find((p) => p.id === id) : undefined;

export const alivePlayers = (s: GameState): GamePlayer[] => s.players.filter((p) => p.alive);

export const playerWithRole = (s: GameState, role: RoleId): GamePlayer | undefined =>
  s.players.find((p) => p.role === role);

export const aliveWithRole = (s: GameState, role: RoleId): GamePlayer | undefined =>
  s.players.find((p) => p.role === role && p.alive);

/** Aktuelles Lager – der Streber wechselt, sobald sein Vorbild raus ist. */
export function effectiveCamp(s: GameState, p: GamePlayer): Camp {
  if (p.role === 'streber' && s.streber.switched) return 'lehrer';
  return ROLES[p.role].camp;
}

export const isTeacher = (s: GameState, p: GamePlayer): boolean => effectiveCamp(s, p) === 'lehrer';

export const aliveTeachers = (s: GameState): GamePlayer[] =>
  alivePlayers(s).filter((p) => isTeacher(s, p));

/** Gruppenarbeit aus zwei verschiedenen Lagern = eigenes Lager. */
export function isMixedPair(s: GameState): boolean {
  if (!s.pair) return false;
  const a = getPlayer(s, s.pair.a);
  const b = getPlayer(s, s.pair.b);
  if (!a || !b) return false;
  return effectiveCamp(s, a) !== effectiveCamp(s, b);
}

function mixedPairIds(s: GameState): string[] {
  return s.pair && isMixedPair(s) ? [s.pair.a, s.pair.b] : [];
}

export function checkWinner(s: GameState): Winner | null {
  const alive = alivePlayers(s);
  if (alive.length === 0) return 'niemand';

  const mixed = mixedPairIds(s);
  if (mixed.length === 2 && alive.length === 2 && alive.every((p) => mixed.includes(p.id))) {
    return 'gruppenarbeit';
  }

  const teachers = alive.filter((p) => isTeacher(s, p));
  if (teachers.length === 0) return 'schueler';

  // Lehrer in einer gemischten Gruppenarbeit spielen für ihr eigenes Lager.
  const teamTeachers = teachers.filter((p) => !mixed.includes(p.id));
  const others = alive.length - teamTeachers.length;
  if (teamTeachers.length > 0 && teamTeachers.length >= others) return 'lehrer';

  return null;
}

/** Hat dieser Spieler mit seinem Lager gewonnen? */
export function isWinner(s: GameState, p: GamePlayer): boolean {
  if (!s.winner || s.winner === 'niemand') return false;
  const mixed = mixedPairIds(s);
  if (s.winner === 'gruppenarbeit') return mixed.includes(p.id);
  if (mixed.includes(p.id) || s.formerMixedPairIds?.includes(p.id)) return false;
  return effectiveCamp(s, p) === s.winner;
}

/** Was der Klassensprecher sieht. */
export function inspectRole(s: GameState, p: GamePlayer): { role: RoleId; camp: Camp } {
  if (p.role === 'streber' && s.streber.switched) return { role: 'lehrer', camp: 'lehrer' };
  return { role: p.role, camp: ROLES[p.role].camp };
}

/** Wen die Lehrer diese Pause tatsächlich erwischen (nach Schutz, vor Rettung). */
export function nightVictimId(s: GameState): string | null {
  const t = s.night.lehrerTargetId ?? null;
  if (!t) return null;
  if (s.night.protectedId && s.night.protectedId === t) return null;
  return t;
}

/** Ist eine Rolle in dieser Pause tatsächlich wach (sonst nur Schein-Aufruf)? */
export function isStepActive(s: GameState, step: NightStepId): boolean {
  switch (step) {
    case 'verkupplerin':
      return !!aliveWithRole(s, 'verkupplerin');
    case 'gruppenarbeit':
      return !!s.pair && s.pairStatus === 'active' && s.pair.formedRound === s.round;
    case 'streber':
      return !!aliveWithRole(s, 'streber');
    case 'vertrauensschueler':
      return !!aliveWithRole(s, 'vertrauensschueler');
    case 'klassensprecher':
      return !!aliveWithRole(s, 'klassensprecher');
    case 'schuelersprecher':
      return !!aliveWithRole(s, 'schuelersprecher');
    case 'lehrer':
      return aliveTeachers(s).length > 0;
  }
}

/** Gültige Ziele je Pausenaktion. */
export function validTargets(s: GameState, step: NightStepId): GamePlayer[] {
  const alive = alivePlayers(s);
  switch (step) {
    case 'verkupplerin':
      return alive;
    case 'streber': {
      const self = aliveWithRole(s, 'streber');
      return alive.filter((p) => p.id !== self?.id);
    }
    case 'vertrauensschueler':
      return alive.filter((p) => p.id !== s.lastProtectedId);
    case 'klassensprecher': {
      const self = aliveWithRole(s, 'klassensprecher');
      return alive.filter((p) => p.id !== self?.id);
    }
    case 'lehrer':
      return alive.filter((p) => !isTeacher(s, p));
    case 'schuelersprecher': {
      const self = aliveWithRole(s, 'schuelersprecher');
      return alive.filter((p) => p.id !== self?.id);
    }
    case 'gruppenarbeit':
      return [];
  }
}

export function buildNightSteps(s: GameState): NightStepId[] {
  const inPlay = (r: RoleId) => s.options.callAllRoles || s.deck.includes(r);
  const steps: NightStepId[] = [];
  const pairDue = s.pairStatus === 'pending' || s.pairStatus === 'broken';
  if (pairDue && inPlay('verkupplerin')) steps.push('verkupplerin', 'gruppenarbeit');
  if (inPlay('streber')) steps.push('streber');
  if (inPlay('vertrauensschueler')) steps.push('vertrauensschueler');
  if (inPlay('klassensprecher')) steps.push('klassensprecher');
  steps.push('lehrer');
  if (inPlay('schuelersprecher')) steps.push('schuelersprecher');
  return steps;
}

/** Stimmen auszählen. */
export function tallyVotes(
  candidates: string[],
  ballots: Record<string, string | null>,
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(candidates.map((c) => [c, 0]));
  for (const target of Object.values(ballots)) {
    if (target && target in counts) counts[target]++;
  }
  return counts;
}

export function leaders(counts: Record<string, number>): { ids: string[]; max: number } {
  const max = Math.max(0, ...Object.values(counts));
  if (max === 0) return { ids: [], max };
  return { ids: Object.keys(counts).filter((k) => counts[k] === max), max };
}

/** Wer muss in der geheimen Abstimmung noch abstimmen? */
export function nextVoter(s: GameState): GamePlayer | undefined {
  if (s.phase.type !== 'vote') return undefined;
  const ballots = s.phase.ballots;
  return alivePlayers(s).find((p) => !(p.id in ballots));
}
