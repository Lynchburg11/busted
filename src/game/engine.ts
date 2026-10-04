import { ROLES } from '../config/roles';
import {
  aliveWithRole,
  alivePlayers,
  buildNightSteps,
  checkWinner,
  getPlayer,
  inspectRole,
  isMixedPair,
  isStepActive,
  leaders,
  nightVictimId,
  tallyVotes,
  validTargets,
} from './rules';
import { shuffle } from './setup';
import type {
  BustedSource,
  DayPart,
  Elimination,
  EliminationCause,
  GameAction,
  GameOptions,
  GameState,
  NightStepId,
  NightSubmitData,
  RoleId,
} from './types';

export interface NewGamePlayer {
  id: string;
  name: string;
}

/** Erstellt ein Spiel mit fest vorgegebener Rollenzuordnung (Index = Spieler). */
export function createGameWithRoles(
  players: NewGamePlayer[],
  roles: RoleId[],
  options: GameOptions,
  id = `game-${Date.now()}`,
): GameState {
  if (roles.length !== players.length) throw new Error('Rollen und Spieler passen nicht zusammen');
  return {
    version: 1,
    id,
    createdAt: Date.now(),
    players: players.map((p, i) => ({ id: p.id, name: p.name, role: roles[i], alive: true })),
    deck: [...roles],
    options,
    round: 1,
    phase: { type: 'reveal', index: 0 },
    night: {},
    lastProtectedId: null,
    schulleiter: { saveUsed: false, bustUsed: false },
    pair: null,
    pairStatus: 'pending',
    streber: { modelId: null, switched: false, notified: false },
    pendingPetze: [],
    eliminations: [],
    log: [],
    winner: null,
  };
}

/** Mischt das Deck und verteilt es. */
export function createGame(
  players: NewGamePlayer[],
  deck: RoleId[],
  options: GameOptions,
  random: () => number = Math.random,
): GameState {
  return createGameWithRoles(players, shuffle(deck, random), options);
}

// ---------------------------------------------------------------------------

const nameOf = (s: GameState, id: string | null | undefined) => getPlayer(s, id)?.name ?? '?';

function log(s: GameState, part: DayPart, text: string, secret = false) {
  s.log.push({ round: s.round, part, text, secret });
}

interface ElimRequest {
  id: string;
  cause: EliminationCause;
  byId?: string;
}

/**
 * Lässt Spieler ausscheiden, inkl. Kettenreaktionen (Gruppenarbeit, Streber, Petze).
 * Mutiert `s` (wird nur auf einer Kopie aufgerufen) und gibt die neuen Ausscheidungen zurück.
 */
function eliminate(s: GameState, requests: ElimRequest[], part: DayPart): Elimination[] {
  const queue = [...requests];
  const out: Elimination[] = [];
  while (queue.length) {
    const req = queue.shift()!;
    const p = getPlayer(s, req.id);
    if (!p || !p.alive) continue;
    p.alive = false;
    const e: Elimination = { playerId: p.id, cause: req.cause, byId: req.byId, round: s.round, part };
    out.push(e);
    s.eliminations.push(e);

    if (s.pair && s.pairStatus === 'active' && (s.pair.a === p.id || s.pair.b === p.id)) {
      if (isMixedPair(s)) s.formerMixedPairIds = [...(s.formerMixedPairIds ?? []), s.pair.a, s.pair.b];
      s.pairStatus = 'broken';
      const partner = s.pair.a === p.id ? s.pair.b : s.pair.a;
      queue.push({ id: partner, cause: 'gruppenarbeit', byId: p.id });
    }
    if (p.role === 'petze') s.pendingPetze.push(p.id);
    const streber = s.players.find((x) => x.role === 'streber');
    if (s.streber.modelId === p.id && !s.streber.switched && streber?.alive) {
      s.streber.switched = true;
      s.streber.notified = false;
      log(s, part, `Das Vorbild von ${streber.name} ist raus – der Streber wechselt ins Lehrer-Lager.`, true);
    }
  }
  return out;
}

function startNight(s: GameState) {
  s.night = {};
  s.phase = { type: 'night', stepIndex: 0, steps: buildNightSteps(s) };
}

function bustedPhase(
  s: GameState,
  source: BustedSource,
  part: DayPart,
  eliminations: Elimination[],
  note?: 'gleichstand' | 'keineStimmen',
) {
  s.phase = { type: 'busted', source, part, eliminations, note };
}

function describeElimination(s: GameState, e: Elimination): string {
  const n = nameOf(s, e.playerId);
  const role = ROLES[getPlayer(s, e.playerId)!.role].name;
  switch (e.cause) {
    case 'lehrer':
      return `${n} (${role}) wurde von den Lehrern erwischt.`;
    case 'schulleiter':
      return `${n} (${role}) ist beim Schulleiter aufgeflogen.`;
    case 'konferenz':
      return `${n} (${role}) wurde von der Klassenkonferenz rausgeworfen.`;
    case 'petze':
      return `${n} (${role}) wurde von ${nameOf(s, e.byId)} verpetzt.`;
    case 'gruppenarbeit':
      return `${n} (${role}) fliegt mit ${nameOf(s, e.byId)} aus der Gruppenarbeit raus.`;
  }
}

function resolveNight(s: GameState) {
  const n = s.night;
  let victim = n.lehrerTargetId ?? null;
  if (victim && n.protectedId === victim) {
    log(s, 'pause', `Der Vertrauenslehrer hat ${nameOf(s, victim)} beschützt.`, true);
    victim = null;
  }
  if (victim && n.save && !s.schulleiter.saveUsed) {
    s.schulleiter.saveUsed = true;
    log(s, 'pause', `Der Schulleiter hat ${nameOf(s, victim)} gerettet.`, true);
    victim = null;
  }
  const requests: ElimRequest[] = [];
  if (victim) requests.push({ id: victim, cause: 'lehrer' });
  if (n.bustId && !s.schulleiter.bustUsed) {
    s.schulleiter.bustUsed = true;
    requests.push({ id: n.bustId, cause: 'schulleiter' });
  }
  s.lastProtectedId = n.protectedId ?? null;

  // Eine fällige Gruppenarbeit, die nicht gebildet wurde, verfällt.
  if (s.pairStatus === 'pending' || s.pairStatus === 'broken') s.pairStatus = 'none';

  const elims = eliminate(s, requests, 'pause');
  for (const e of elims) log(s, 'pause', describeElimination(s, e));
  if (elims.length === 0) log(s, 'pause', 'In dieser Pause wurde niemand erwischt.');
  s.night = {};
  bustedPhase(s, 'pause', 'pause', elims);
}

function applyNightStep(s: GameState, step: NightStepId, data: NightSubmitData): boolean {
  const active = isStepActive(s, step);
  const valid = (id: string | null | undefined) =>
    !!id && validTargets(s, step).some((p) => p.id === id);

  switch (step) {
    case 'vertretungslehrer': {
      if (!active) return true;
      const pair = data.pair;
      if (!pair || pair[0] === pair[1] || !valid(pair[0]) || !valid(pair[1])) return false;
      s.pair = { a: pair[0], b: pair[1], formedRound: s.round };
      s.pairStatus = 'active';
      log(s, 'pause', `Gruppenarbeit: ${nameOf(s, pair[0])} & ${nameOf(s, pair[1])}.`, true);
      return true;
    }
    case 'gruppenarbeit':
      return true;
    case 'streber': {
      if (!active) return true;
      if (!s.streber.modelId) {
        if (!valid(data.modelId)) return false;
        s.streber.modelId = data.modelId!;
        log(s, 'pause', `Der Streber wählt ${nameOf(s, data.modelId)} als Vorbild.`, true);
      } else if (s.streber.switched && !s.streber.notified) {
        s.streber.notified = true;
      }
      return true;
    }
    case 'vertrauenslehrer': {
      if (!active) return true;
      if (!valid(data.targetId)) return false;
      s.night.protectedId = data.targetId;
      log(s, 'pause', `Der Vertrauenslehrer schützt ${nameOf(s, data.targetId)}.`, true);
      return true;
    }
    case 'klassensprecher': {
      if (!active) return true;
      if (!valid(data.targetId)) return false;
      s.night.inspectedId = data.targetId;
      const target = getPlayer(s, data.targetId)!;
      const seen = inspectRole(s, target);
      log(s, 'pause', `Der Klassensprecher sieht nach: ${target.name} ist ${ROLES[seen.role].name}.`, true);
      return true;
    }
    case 'lehrer': {
      if (!valid(data.targetId)) return false;
      s.night.lehrerTargetId = data.targetId;
      log(s, 'pause', `Die Lehrer nehmen ${nameOf(s, data.targetId)} ins Visier.`, true);
      return true;
    }
    case 'schulleiter': {
      if (!active) return true;
      const victim = nightVictimId(s);
      const save = !!data.save && !!victim && !s.schulleiter.saveUsed;
      const bustId = data.bustId ?? null;
      if (bustId && (s.schulleiter.bustUsed || !valid(bustId))) return false;
      s.night.save = save;
      s.night.bustId = bustId;
      return true;
    }
  }
}

/** Nach einer BUSTED-Anzeige: Petze, Siegprüfung, dann weiter im Ablauf. */
function proceed(s: GameState, part: DayPart) {
  if (s.pendingPetze.length > 0) {
    s.phase = { type: 'petze', petzeId: s.pendingPetze[0], part };
    return;
  }
  const winner = checkWinner(s);
  if (winner) {
    s.winner = winner;
    s.phase = { type: 'gameOver', winner };
    log(s, part, winnerText(winner));
    return;
  }
  if (part === 'pause') {
    s.phase = { type: 'discussion' };
  } else {
    s.round += 1;
    startNight(s);
  }
}

export function winnerText(w: string): string {
  switch (w) {
    case 'schueler':
      return 'Das Schüler-Lager gewinnt!';
    case 'lehrer':
      return 'Das Lehrer-Lager gewinnt!';
    case 'gruppenarbeit':
      return 'Die Gruppenarbeit gewinnt zu zweit!';
    default:
      return 'Niemand gewinnt – die Schule ist leer.';
  }
}

function finishVote(s: GameState, countsOverride?: Record<string, number>) {
  if (s.phase.type !== 'vote') return;
  const { candidates, ballots, round } = s.phase;
  const counts = countsOverride
    ? Object.fromEntries(candidates.map((c) => [c, Math.max(0, Math.floor(countsOverride[c] ?? 0))]))
    : tallyVotes(candidates, ballots);
  const { ids } = leaders(counts);
  const summary = candidates
    .filter((c) => counts[c] > 0)
    .map((c) => `${nameOf(s, c)} ${counts[c]}`)
    .join(', ');
  log(s, 'stunde', `Klassenkonferenz${round === 2 ? ' (Stichwahl)' : ''}: ${summary || 'keine Stimmen'}.`);

  if (ids.length === 0) {
    log(s, 'stunde', 'Niemand fliegt raus.');
    bustedPhase(s, 'konferenz', 'stunde', [], 'keineStimmen');
    return;
  }
  if (ids.length > 1) {
    if (round === 1) {
      s.phase = { type: 'vote', round: 2, candidates: ids, ballots: {} };
      return;
    }
    log(s, 'stunde', 'Wieder Gleichstand – niemand fliegt raus.');
    bustedPhase(s, 'konferenz', 'stunde', [], 'gleichstand');
    return;
  }
  const elims = eliminate(s, [{ id: ids[0], cause: 'konferenz' }], 'stunde');
  for (const e of elims) log(s, 'stunde', describeElimination(s, e));
  bustedPhase(s, 'konferenz', 'stunde', elims);
}

/**
 * Reiner Reducer: gibt bei ungültigen Aktionen denselben Zustand zurück.
 */
export function reduce(state: GameState, action: GameAction): GameState {
  if (state.phase.type === 'gameOver') return state;
  const s: GameState = structuredClone(state);
  const phase = s.phase;

  switch (action.type) {
    case 'REVEAL_NEXT': {
      if (phase.type !== 'reveal') return state;
      if (phase.index + 1 < s.players.length) {
        s.phase = { type: 'reveal', index: phase.index + 1 };
      } else {
        startNight(s);
      }
      return s;
    }

    case 'NIGHT_SUBMIT': {
      if (phase.type !== 'night') return state;
      const step = phase.steps[phase.stepIndex];
      if (step !== action.step) return state;
      if (!applyNightStep(s, step, action.data ?? {})) return state;
      if (phase.stepIndex + 1 < phase.steps.length) {
        s.phase = { ...phase, stepIndex: phase.stepIndex + 1 };
      } else {
        resolveNight(s);
      }
      return s;
    }

    case 'CONTINUE': {
      if (phase.type !== 'busted') return state;
      proceed(s, phase.part);
      return s;
    }

    case 'PETZE_PICK': {
      if (phase.type !== 'petze') return state;
      const petze = phase.petzeId;
      if (action.targetId) {
        const t = getPlayer(s, action.targetId);
        if (!t || !t.alive || t.id === petze) return state;
      }
      s.pendingPetze = s.pendingPetze.filter((id) => id !== petze);
      if (!action.targetId) {
        log(s, phase.part, `${nameOf(s, petze)} verzichtet aufs Petzen.`);
        proceed(s, phase.part);
        return s;
      }
      const elims = eliminate(s, [{ id: action.targetId, cause: 'petze', byId: petze }], phase.part);
      for (const e of elims) log(s, phase.part, describeElimination(s, e));
      bustedPhase(s, 'petze', phase.part, elims);
      return s;
    }

    case 'DISCUSSION_DONE': {
      if (phase.type !== 'discussion') return state;
      s.phase = { type: 'vote', round: 1, candidates: alivePlayers(s).map((p) => p.id), ballots: {} };
      return s;
    }

    case 'VOTE_CAST': {
      if (phase.type !== 'vote') return state;
      const voter = getPlayer(s, action.voterId);
      if (!voter || !voter.alive || action.voterId in phase.ballots) return state;
      if (action.targetId !== null) {
        if (!phase.candidates.includes(action.targetId) || action.targetId === action.voterId) return state;
      }
      phase.ballots[action.voterId] = action.targetId;
      return s;
    }

    case 'VOTE_FINISH': {
      if (phase.type !== 'vote') return state;
      finishVote(s, action.counts);
      return s;
    }
  }
}

/** Hilfsfunktion für UI & Tests: Schulleiter-Status in dieser Pause. */
export function schulleiterOptions(s: GameState) {
  const victimId = nightVictimId(s);
  return {
    victimId,
    canSave: !!victimId && !s.schulleiter.saveUsed,
    canBust: !s.schulleiter.bustUsed,
    self: aliveWithRole(s, 'schulleiter'),
  };
}
