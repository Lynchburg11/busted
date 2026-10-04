import { create } from 'zustand';
import { createGame, reduce } from '../game/engine';
import { buildDeck, suggestSetup, type SetupConfig } from '../game/setup';
import type { GameAction, GameState } from '../game/types';
import { useSettings } from './settings';
import { KEYS, load, remove, save } from './storage';

interface GameStore {
  game: GameState | null;
  setup: SetupConfig | null;
  loaded: boolean;
  load(): Promise<void>;
  setSetup(setup: SetupConfig): void;
  start(players: { id: string; name: string }[], setup: SetupConfig): void;
  dispatch(action: GameAction): void;
  abort(): void;
}

export const useGame = create<GameStore>((setState, getState) => ({
  game: null,
  setup: null,
  loaded: false,

  async load() {
    const [game, setup] = await Promise.all([load<GameState>(KEYS.game), load<SetupConfig>(KEYS.setup)]);
    setState({
      game: game?.version === 1 ? migrate(game) : null,
      setup: setup ? migrate(setup) : null,
      loaded: true,
    });
  },

  setSetup(setup) {
    setState({ setup });
    save(KEYS.setup, setup);
  },

  start(players, setup) {
    const s = useSettings.getState();
    const deck = buildDeck(setup, players.length);
    const game = createGame(
      players.map((p) => ({ id: p.id, name: p.name })),
      deck,
      { revealRoles: s.revealRoles, callAllRoles: s.callAllRoles, voteMode: s.voteMode },
    );
    setState({ game, setup });
    save(KEYS.setup, setup);
    save(KEYS.game, game);
  },

  dispatch(action) {
    const current = getState().game;
    if (!current) return;
    const next = reduce(current, action);
    if (next === current) return;
    setState({ game: next });
    save(KEYS.game, next);
  },

  abort() {
    setState({ game: null });
    remove(KEYS.game);
  },
}));

/** Alte Rollen-IDs (vor der Umbenennung) in gespeicherten Spielständen ersetzen. */
const RENAMED: Record<string, string> = {
  schulleiter: 'schuelersprecher',
  vertretungslehrer: 'verkupplerin',
  vertrauenslehrer: 'vertrauensschueler',
};

export function migrate<T>(data: T): T {
  const json = JSON.stringify(data).replace(
    /"(schulleiter|vertretungslehrer|vertrauenslehrer)"/g,
    (_, id: string) => `"${RENAMED[id]}"`,
  );
  return JSON.parse(json) as T;
}

export function setupFor(count: number): SetupConfig {
  const stored = useGame.getState().setup;
  return stored ?? suggestSetup(count);
}
