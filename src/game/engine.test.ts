import { describe, expect, it } from 'vitest';
import { createGame, createGameWithRoles, reduce, schuelersprecherOptions } from './engine';
import { checkWinner, getPlayer, inspectRole, isWinner, nextVoter, validTargets } from './rules';
import type { GameAction, GameOptions, GameState, NightStepId, NightSubmitData, RoleId } from './types';

const OPTS: GameOptions = { revealRoles: true, callAllRoles: false, voteMode: 'geheim' };

/** Spieler A, B, C … mit den angegebenen Rollen. */
function game(roles: RoleId[], opts: Partial<GameOptions> = {}): GameState {
  const players = roles.map((_, i) => ({ id: String.fromCharCode(65 + i), name: String.fromCharCode(65 + i) }));
  let s = createGameWithRoles(players, roles, { ...OPTS, ...opts }, 'test');
  for (let i = 0; i < roles.length; i++) s = act(s, { type: 'REVEAL_NEXT' });
  return s;
}

function act(s: GameState, a: GameAction): GameState {
  return reduce(s, a);
}

function mustAct(s: GameState, a: GameAction): GameState {
  const next = reduce(s, a);
  expect(next, `Aktion ${JSON.stringify(a)} wurde abgelehnt`).not.toBe(s);
  return next;
}

function currentStep(s: GameState): NightStepId {
  if (s.phase.type !== 'night') throw new Error(`keine Pause, sondern ${s.phase.type}`);
  return s.phase.steps[s.phase.stepIndex];
}

/** Spielt eine Pause durch; nicht angegebene Schritte werden leer bestätigt. */
function playNight(s: GameState, plan: Partial<Record<NightStepId, NightSubmitData>>): GameState {
  while (s.phase.type === 'night') {
    const step = currentStep(s);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step, data: plan[step] ?? {} });
  }
  return s;
}

function continueUntil(s: GameState, type: GameState['phase']['type']): GameState {
  let guard = 0;
  while (s.phase.type !== type && s.phase.type === 'busted' && guard++ < 10) s = mustAct(s, { type: 'CONTINUE' });
  expect(s.phase.type).toBe(type);
  return s;
}

function voteOut(s: GameState, targetId: string): GameState {
  s = mustAct(s, { type: 'DISCUSSION_DONE' });
  return mustAct(s, { type: 'VOTE_FINISH', counts: { [targetId]: 3 } });
}

const alive = (s: GameState, id: string) => getPlayer(s, id)!.alive;

describe('Rollenvergabe', () => {
  it('verteilt das Deck vollständig und zufällig', () => {
    const players = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
    const deck: RoleId[] = ['lehrer', 'lehrer', 'klassensprecher', 'schueler', 'schueler', 'schueler'];
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const s = createGame(players, deck, OPTS, rnd);
    expect(s.players.map((p) => p.role).sort()).toEqual([...deck].sort());
    expect(s.phase).toEqual({ type: 'reveal', index: 0 });
  });

  it('startet nach dem letzten Aufdecken die erste Pause', () => {
    const s = game(['lehrer', 'schueler', 'schueler', 'klassensprecher']);
    expect(s.phase.type).toBe('night');
    expect(s.round).toBe(1);
  });
});

describe('Pausenablauf', () => {
  it('ruft in Pause 1 Verkupplerin und Streber auf, danach nicht mehr', () => {
    const s = game([
      'lehrer',
      'verkupplerin',
      'streber',
      'klassensprecher',
      'schueler',
      'schueler',
      'schueler',
      'schueler',
    ]);
    expect(s.phase.type === 'night' && s.phase.steps).toEqual([
      'verkupplerin',
      'gruppenarbeit',
      'streber',
      'klassensprecher',
      'lehrer',
    ]);
    let t = playNight(s, {
      verkupplerin: { pair: ['E', 'F'] },
      streber: { modelId: 'D' },
      klassensprecher: { targetId: 'A' },
      lehrer: { targetId: 'B' },
    });
    t = continueUntil(t, 'discussion');
    t = voteOut(t, 'F'); // nimmt E mit
    t = continueUntil(t, 'night');
    // Gruppenarbeit gebrochen: Verkupplerin (B) ist raus, wird aber zur Tarnung noch einmal aufgerufen
    expect(t.phase.type === 'night' && t.phase.steps).toEqual([
      'verkupplerin',
      'gruppenarbeit',
      'streber',
      'klassensprecher',
      'lehrer',
    ]);
    t = playNight(t, { klassensprecher: { targetId: 'A' }, lehrer: { targetId: 'C' } });
    expect(t.pairStatus).toBe('none');
    t = continueUntil(t, 'discussion');
    t = mustAct(t, { type: 'DISCUSSION_DONE' });
    t = mustAct(t, { type: 'VOTE_FINISH', counts: {} });
    t = continueUntil(t, 'night');
    expect(t.phase.type === 'night' && t.phase.steps).toEqual(['streber', 'klassensprecher', 'lehrer']);
  });

  it('ruft bei "alle Rollen aufrufen" auch nicht vergebene Rollen auf', () => {
    const s = game(['lehrer', 'schueler', 'schueler', 'schueler'], { callAllRoles: true });
    expect(s.phase.type === 'night' && s.phase.steps).toEqual([
      'verkupplerin',
      'gruppenarbeit',
      'streber',
      'vertrauensschueler',
      'klassensprecher',
      'lehrer',
      'schuelersprecher',
    ]);
    // Schein-Aufrufe akzeptieren leere Eingaben
    const t = playNight(s, { lehrer: { targetId: 'B' } });
    expect(t.phase.type).toBe('busted');
    expect(t.pairStatus).toBe('none');
  });

  it('lehnt ungültige Ziele ab', () => {
    const s = game(['lehrer', 'lehrer', 'schueler', 'schueler', 'schueler']);
    expect(currentStep(s)).toBe('lehrer');
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'B' } })).toBe(s); // Lehrer
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: {} })).toBe(s);
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: {} })).toBe(s); // falscher Schritt
  });

  it('erwischt das Ziel der Lehrer', () => {
    const s = playNight(game(['lehrer', 'schueler', 'schueler', 'schueler']), { lehrer: { targetId: 'C' } });
    expect(s.phase).toMatchObject({ type: 'busted', source: 'pause' });
    expect(alive(s, 'C')).toBe(false);
  });
});

describe('Vertrauensschüler', () => {
  it('schützt vor den Lehrern', () => {
    const s = playNight(game(['lehrer', 'vertrauensschueler', 'schueler', 'schueler', 'schueler']), {
      vertrauensschueler: { targetId: 'C' },
      lehrer: { targetId: 'C' },
    });
    expect(alive(s, 'C')).toBe(true);
    expect(s.phase.type === 'busted' && s.phase.eliminations).toEqual([]);
  });

  it('darf nicht zweimal hintereinander denselben schützen', () => {
    let s = playNight(game(['lehrer', 'vertrauensschueler', 'schueler', 'schueler', 'schueler', 'schueler']), {
      vertrauensschueler: { targetId: 'C' },
      lehrer: { targetId: 'D' },
    });
    s = continueUntil(s, 'discussion');
    s = mustAct(s, { type: 'DISCUSSION_DONE' });
    s = mustAct(s, { type: 'VOTE_FINISH', counts: {} });
    s = continueUntil(s, 'night');
    expect(s.lastProtectedId).toBe('C');
    expect(validTargets(s, 'vertrauensschueler').map((p) => p.id)).not.toContain('C');
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'vertrauensschueler', data: { targetId: 'C' } })).toBe(s);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'vertrauensschueler', data: { targetId: 'B' } });
  });

  it('schützt nicht vor dem Schülersprecher', () => {
    const s = playNight(game(['lehrer', 'vertrauensschueler', 'schuelersprecher', 'schueler', 'schueler', 'schueler']), {
      vertrauensschueler: { targetId: 'D' },
      lehrer: { targetId: 'E' },
      schuelersprecher: { bustId: 'D' },
    });
    expect(alive(s, 'D')).toBe(false);
    expect(alive(s, 'E')).toBe(false);
  });
});

describe('Schülersprecher', () => {
  const roles: RoleId[] = ['lehrer', 'lehrer', 'schuelersprecher', 'schueler', 'schueler', 'schueler', 'schueler'];

  it('erfährt das Opfer und kann es einmal retten', () => {
    let s = game(roles);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'D' } });
    expect(schuelersprecherOptions(s)).toMatchObject({ victimId: 'D', canSave: true, canBust: true });
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: { save: true } });
    expect(alive(s, 'D')).toBe(true);
    expect(s.schuelersprecher.saveUsed).toBe(true);

    s = continueUntil(s, 'discussion');
    s = mustAct(s, { type: 'DISCUSSION_DONE' });
    s = mustAct(s, { type: 'VOTE_FINISH', counts: {} });
    s = continueUntil(s, 'night');
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'D' } });
    expect(schuelersprecherOptions(s).canSave).toBe(false);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: { save: true } });
    expect(alive(s, 'D')).toBe(false); // Rettung verbraucht
  });

  it('kann nichts tun', () => {
    let s = game(roles);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'D' } });
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: {} });
    expect(alive(s, 'D')).toBe(false);
    expect(s.schuelersprecher).toEqual({ saveUsed: false, bustUsed: false });
  });

  it('lässt nur einmal jemanden auffliegen', () => {
    let s = game(roles);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'D' } });
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: { bustId: 'A' } });
    expect(alive(s, 'A')).toBe(false);
    s = continueUntil(s, 'discussion');
    s = mustAct(s, { type: 'DISCUSSION_DONE' });
    s = mustAct(s, { type: 'VOTE_FINISH', counts: {} });
    s = continueUntil(s, 'night');
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'E' } });
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: { bustId: 'F' } })).toBe(s);
  });

  it('wird aufgerufen, auch wenn er schon raus ist (Schein-Aufruf)', () => {
    let s = game(roles);
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'C' } });
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: {} });
    s = continueUntil(s, 'discussion');
    s = mustAct(s, { type: 'DISCUSSION_DONE' });
    s = mustAct(s, { type: 'VOTE_FINISH', counts: {} });
    s = continueUntil(s, 'night');
    expect(s.phase.type === 'night' && s.phase.steps).toContain('schuelersprecher');
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'lehrer', data: { targetId: 'D' } });
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'schuelersprecher', data: { bustId: 'E' } }); // ignoriert
    expect(alive(s, 'E')).toBe(true);
  });
});

describe('Klassensprecher', () => {
  it('sieht den Streber als Schüler-Lager, nach dem Wechsel als Lehrer', () => {
    let s = game(['lehrer', 'klassensprecher', 'streber', 'schueler', 'schueler', 'schueler']);
    expect(inspectRole(s, getPlayer(s, 'C')!)).toEqual({ role: 'streber', camp: 'schueler' });
    s = playNight(s, { streber: { modelId: 'D' }, klassensprecher: { targetId: 'C' }, lehrer: { targetId: 'D' } });
    expect(s.streber.switched).toBe(true);
    expect(inspectRole(s, getPlayer(s, 'C')!)).toEqual({ role: 'lehrer', camp: 'lehrer' });
  });
});

describe('Petze', () => {
  it('nimmt beim Erwischtwerden jemanden mit', () => {
    let s = playNight(game(['lehrer', 'petze', 'schueler', 'schueler', 'schueler', 'schueler']), {
      lehrer: { targetId: 'B' },
    });
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase).toEqual({ type: 'petze', petzeId: 'B', part: 'pause' });
    expect(act(s, { type: 'PETZE_PICK', targetId: 'B' })).toBe(s); // nicht sich selbst
    s = mustAct(s, { type: 'PETZE_PICK', targetId: 'C' });
    expect(s.phase).toMatchObject({ type: 'busted', source: 'petze' });
    expect(alive(s, 'C')).toBe(false);
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase.type).toBe('discussion');
  });

  it('kann beim Rauswurf den letzten Lehrer mitnehmen → Schüler gewinnen', () => {
    let s = playNight(game(['lehrer', 'petze', 'schueler', 'schueler', 'schueler']), { lehrer: { targetId: 'C' } });
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'B');
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase.type).toBe('petze');
    s = mustAct(s, { type: 'PETZE_PICK', targetId: 'A' });
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase).toEqual({ type: 'gameOver', winner: 'schueler' });
  });

  it('darf verzichten', () => {
    let s = playNight(game(['lehrer', 'petze', 'schueler', 'schueler', 'schueler', 'schueler']), {
      lehrer: { targetId: 'B' },
    });
    s = mustAct(s, { type: 'CONTINUE' });
    s = mustAct(s, { type: 'PETZE_PICK', targetId: null });
    expect(s.phase.type).toBe('discussion');
  });
});

describe('Verkupplerin & Gruppenarbeit', () => {
  const roles: RoleId[] = ['lehrer', 'lehrer', 'verkupplerin', 'schueler', 'schueler', 'schueler', 'schueler', 'schueler'];

  it('Partner scheiden gemeinsam aus', () => {
    let s = game(roles);
    s = playNight(s, { verkupplerin: { pair: ['D', 'E'] }, lehrer: { targetId: 'D' } });
    expect(alive(s, 'D')).toBe(false);
    expect(alive(s, 'E')).toBe(false);
    expect(s.phase.type === 'busted' && s.phase.eliminations.map((e) => e.cause)).toEqual(['lehrer', 'gruppenarbeit']);
  });

  it('bildet eine neue Gruppenarbeit, wenn beide raus sind und er noch dabei ist', () => {
    let s = game(roles);
    s = playNight(s, { verkupplerin: { pair: ['D', 'E'] }, lehrer: { targetId: 'F' } });
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'E');
    expect(alive(s, 'D')).toBe(false);
    s = continueUntil(s, 'night');
    expect(currentStep(s)).toBe('verkupplerin');
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'verkupplerin', data: { pair: ['D', 'G'] } })).toBe(s);
    s = playNight(s, { verkupplerin: { pair: ['C', 'G'] }, lehrer: { targetId: 'H' } });
    expect(s.pair).toMatchObject({ a: 'C', b: 'G', formedRound: 2 });
    expect(s.pairStatus).toBe('active');
  });

  it('gemischte Gruppenarbeit gewinnt, wenn nur die beiden übrig sind', () => {
    let s = game(['lehrer', 'verkupplerin', 'schueler', 'schueler']);
    s = playNight(s, { verkupplerin: { pair: ['A', 'C'] }, lehrer: { targetId: 'B' } });
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'D');
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase).toEqual({ type: 'gameOver', winner: 'gruppenarbeit' });
    expect(isWinner(s, getPlayer(s, 'A')!)).toBe(true);
    expect(isWinner(s, getPlayer(s, 'C')!)).toBe(true);
    expect(isWinner(s, getPlayer(s, 'D')!)).toBe(false);
  });

  it('Mitglieder einer früheren gemischten Gruppenarbeit gewinnen nicht mit ihrem Lager', () => {
    let s = game(['lehrer', 'lehrer', 'verkupplerin', 'schueler', 'schueler', 'schueler', 'schueler']);
    s = playNight(s, { verkupplerin: { pair: ['A', 'D'] }, lehrer: { targetId: 'E' } });
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'D'); // nimmt A mit
    expect(s.formerMixedPairIds).toEqual(['A', 'D']);
    s = continueUntil(s, 'night');
    s = playNight(s, { verkupplerin: { pair: ['C', 'G'] }, lehrer: { targetId: 'F' } });
    // lebend: B(L), C, G → weiter; C rauswählen nimmt G mit → Lehrer gewinnen
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'C');
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.winner).toBe('lehrer');
    expect(isWinner(s, getPlayer(s, 'B')!)).toBe(true);
    expect(isWinner(s, getPlayer(s, 'A')!)).toBe(false);
  });

  it('Lehrer in gemischter Gruppenarbeit zählt nicht fürs Lehrer-Lager', () => {
    let s = game(['lehrer', 'lehrer', 'verkupplerin', 'schueler', 'schueler', 'schueler']);
    s = playNight(s, { verkupplerin: { pair: ['A', 'D'] }, lehrer: { targetId: 'E' } });
    // lebend: A(L, Paar), B(L), C, D(Paar), F  → Team-Lehrer 1 vs 4
    expect(checkWinner(s)).toBeNull();
  });
});

describe('Streber', () => {
  it('wechselt ins Lehrer-Lager, wacht mit den Lehrern auf und bekommt den Hinweis', () => {
    let s = game(['lehrer', 'streber', 'schueler', 'schueler', 'schueler', 'schueler', 'schueler']);
    expect(act(s, { type: 'NIGHT_SUBMIT', step: 'streber', data: { modelId: 'B' } })).toBe(s); // nicht sich selbst
    s = playNight(s, { streber: { modelId: 'C' }, lehrer: { targetId: 'D' } });
    expect(s.streber.switched).toBe(false);
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'C');
    expect(s.streber).toEqual({ modelId: 'C', switched: true, notified: false });
    s = continueUntil(s, 'night');
    expect(currentStep(s)).toBe('streber');
    s = mustAct(s, { type: 'NIGHT_SUBMIT', step: 'streber', data: {} });
    expect(s.streber.notified).toBe(true);
    // Lehrer dürfen den Streber jetzt nicht mehr wählen
    expect(validTargets(s, 'lehrer').map((p) => p.id)).not.toContain('B');
  });

  it('zählt nach dem Wechsel für den Lehrer-Sieg', () => {
    let s = game(['lehrer', 'streber', 'schueler', 'schueler', 'schueler']);
    s = playNight(s, { streber: { modelId: 'C' }, lehrer: { targetId: 'C' } });
    // lebend: A(L), B(Streber→L), D, E → 2 gegen 2
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase).toEqual({ type: 'gameOver', winner: 'lehrer' });
    expect(isWinner(s, getPlayer(s, 'B')!)).toBe(true);
  });
});

describe('Klassenkonferenz', () => {
  function toVote(): GameState {
    let s = playNight(game(['lehrer', 'schueler', 'schueler', 'schueler', 'schueler', 'schueler']), {
      lehrer: { targetId: 'F' },
    });
    s = continueUntil(s, 'discussion');
    return mustAct(s, { type: 'DISCUSSION_DONE' });
  }

  it('geheime Abstimmung per Handy: Mehrheit fliegt raus', () => {
    let s = toVote();
    expect(nextVoter(s)?.id).toBe('A');
    expect(act(s, { type: 'VOTE_CAST', voterId: 'A', targetId: 'A' })).toBe(s); // nicht sich selbst
    s = mustAct(s, { type: 'VOTE_CAST', voterId: 'A', targetId: 'B' });
    expect(act(s, { type: 'VOTE_CAST', voterId: 'A', targetId: 'C' })).toBe(s); // doppelt
    s = mustAct(s, { type: 'VOTE_CAST', voterId: 'B', targetId: 'A' });
    s = mustAct(s, { type: 'VOTE_CAST', voterId: 'C', targetId: 'A' });
    s = mustAct(s, { type: 'VOTE_CAST', voterId: 'D', targetId: 'A' });
    s = mustAct(s, { type: 'VOTE_CAST', voterId: 'E', targetId: null });
    expect(nextVoter(s)).toBeUndefined();
    s = mustAct(s, { type: 'VOTE_FINISH' });
    expect(alive(s, 'A')).toBe(false);
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase).toEqual({ type: 'gameOver', winner: 'schueler' });
  });

  it('Gleichstand → Stichwahl, erneuter Gleichstand → niemand fliegt', () => {
    let s = toVote();
    s = mustAct(s, { type: 'VOTE_FINISH', counts: { B: 2, C: 2, D: 1 } });
    expect(s.phase).toMatchObject({ type: 'vote', round: 2, candidates: ['B', 'C'] });
    expect(act(s, { type: 'VOTE_CAST', voterId: 'A', targetId: 'D' })).toBe(s); // kein Kandidat
    s = mustAct(s, { type: 'VOTE_FINISH', counts: { B: 2, C: 2 } });
    expect(s.phase).toMatchObject({ type: 'busted', eliminations: [], note: 'gleichstand' });
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase.type).toBe('night');
    expect(s.round).toBe(2);
  });

  it('Stichwahl mit klarem Ergebnis', () => {
    let s = toVote();
    s = mustAct(s, { type: 'VOTE_FINISH', counts: { B: 2, C: 2 } });
    s = mustAct(s, { type: 'VOTE_FINISH', counts: { B: 3, C: 2 } });
    expect(alive(s, 'B')).toBe(false);
  });

  it('keine Stimmen → niemand fliegt', () => {
    const s = mustAct(toVote(), { type: 'VOTE_FINISH', counts: {} });
    expect(s.phase).toMatchObject({ type: 'busted', note: 'keineStimmen' });
  });
});

describe('Siegbedingungen', () => {
  it('Lehrer gewinnen bei Gleichstand der Köpfe', () => {
    let s = game(['lehrer', 'lehrer', 'schueler', 'schueler', 'schueler']);
    s = playNight(s, { lehrer: { targetId: 'C' } });
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.phase).toEqual({ type: 'gameOver', winner: 'lehrer' });
    expect(s.winner).toBe('lehrer');
  });

  it('nach Spielende werden Aktionen ignoriert', () => {
    let s = game(['lehrer', 'lehrer', 'schueler', 'schueler', 'schueler']);
    s = playNight(s, { lehrer: { targetId: 'C' } });
    s = mustAct(s, { type: 'CONTINUE' });
    expect(act(s, { type: 'CONTINUE' })).toBe(s);
  });

  it('ein voller Spielverlauf ist im Log nachvollziehbar', () => {
    let s = game(['lehrer', 'klassensprecher', 'schueler', 'schueler']);
    s = playNight(s, { klassensprecher: { targetId: 'A' }, lehrer: { targetId: 'C' } });
    s = continueUntil(s, 'discussion');
    s = voteOut(s, 'A');
    s = mustAct(s, { type: 'CONTINUE' });
    expect(s.winner).toBe('schueler');
    const texts = s.log.map((l) => l.text).join('\n');
    expect(texts).toContain('Der Klassensprecher sieht nach: A ist Lehrer.');
    expect(texts).toContain('C (Schüler) wurde von den Lehrern erwischt.');
    expect(texts).toContain('Das Schüler-Lager gewinnt!');
  });
});
