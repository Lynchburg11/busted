export type Camp = 'schueler' | 'lehrer';

export type RoleId =
  | 'lehrer'
  | 'schueler'
  | 'klassensprecher'
  | 'schuelersprecher'
  | 'petze'
  | 'verkupplerin'
  | 'spicker'
  | 'vertrauensschueler'
  | 'streber';

export type Winner = 'schueler' | 'lehrer' | 'gruppenarbeit' | 'niemand';

export type EliminationCause = 'lehrer' | 'schuelersprecher' | 'konferenz' | 'petze' | 'gruppenarbeit';

export type DayPart = 'pause' | 'stunde';

export interface GamePlayer {
  id: string;
  name: string;
  role: RoleId;
  alive: boolean;
}

export interface Elimination {
  playerId: string;
  cause: EliminationCause;
  /** Wer das Ausscheiden ausgelöst hat (Petze, Gruppenpartner …). */
  byId?: string;
  round: number;
  part: DayPart;
}

export type NightStepId =
  | 'verkupplerin'
  | 'gruppenarbeit'
  | 'streber'
  | 'vertrauensschueler'
  | 'klassensprecher'
  | 'lehrer'
  | 'schuelersprecher';

export interface NightActions {
  protectedId?: string | null;
  inspectedId?: string | null;
  lehrerTargetId?: string | null;
  save?: boolean;
  bustId?: string | null;
}

export type BustedSource = 'pause' | 'konferenz' | 'petze';

export type VoteMode = 'geheim' | 'offen';

export type Phase =
  | { type: 'reveal'; index: number }
  | { type: 'night'; stepIndex: number; steps: NightStepId[] }
  | {
      type: 'busted';
      source: BustedSource;
      part: DayPart;
      eliminations: Elimination[];
      /** Nur bei Konferenz ohne Rauswurf. */
      note?: 'gleichstand' | 'keineStimmen';
    }
  | { type: 'petze'; petzeId: string; part: DayPart }
  | { type: 'discussion' }
  | {
      type: 'vote';
      round: 1 | 2;
      candidates: string[];
      ballots: Record<string, string | null>;
    }
  | { type: 'gameOver'; winner: Winner };

export type PairStatus = 'pending' | 'active' | 'broken' | 'none';

export interface LogEntry {
  round: number;
  part: DayPart;
  text: string;
  /** Geheim = erst am Ende sichtbar. */
  secret?: boolean;
}

export interface GameOptions {
  revealRoles: boolean;
  callAllRoles: boolean;
  voteMode: VoteMode;
}

export interface GameState {
  version: 1;
  id: string;
  createdAt: number;
  players: GamePlayer[];
  /** Alle Rollen, die in diesem Spiel verteilt wurden. */
  deck: RoleId[];
  options: GameOptions;
  round: number;
  phase: Phase;
  night: NightActions;
  lastProtectedId: string | null;
  schuelersprecher: { saveUsed: boolean; bustUsed: boolean };
  pair: { a: string; b: string; formedRound: number } | null;
  pairStatus: PairStatus;
  /** Spieler aus früheren gemischten Gruppenarbeiten – sie gewinnen nicht mit ihrem Lager. */
  formerMixedPairIds?: string[];
  streber: { modelId: string | null; switched: boolean; notified: boolean };
  pendingPetze: string[];
  eliminations: Elimination[];
  log: LogEntry[];
  winner: Winner | null;
}

export type GameAction =
  | { type: 'REVEAL_NEXT' }
  | { type: 'NIGHT_SUBMIT'; step: NightStepId; data?: NightSubmitData }
  | { type: 'CONTINUE' }
  | { type: 'PETZE_PICK'; targetId: string | null }
  | { type: 'DISCUSSION_DONE' }
  | { type: 'VOTE_CAST'; voterId: string; targetId: string | null }
  | { type: 'VOTE_FINISH'; counts?: Record<string, number> };

export interface NightSubmitData {
  targetId?: string | null;
  pair?: [string, string];
  modelId?: string;
  save?: boolean;
  bustId?: string | null;
}
