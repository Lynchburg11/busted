import { create } from 'zustand';
import { newId } from '../lib/ids';
import { KEYS, load, save } from './storage';

export interface Player {
  id: string;
  name: string;
  /** JPEG als Data-URL, ca. 256×256 px. */
  photo?: string;
  /** Spielt in der nächsten Runde mit. */
  active: boolean;
  createdAt: number;
}

interface PlayersState {
  players: Player[];
  loaded: boolean;
  load(): Promise<void>;
  add(name: string, photo?: string): Player;
  update(id: string, patch: Partial<Omit<Player, 'id'>>): void;
  remove(id: string): void;
  toggle(id: string): void;
  setAllActive(active: boolean): void;
}

export const usePlayers = create<PlayersState>((setState, getState) => {
  const persist = () => save(KEYS.players, getState().players);
  return {
    players: [],
    loaded: false,
    async load() {
      const players = (await load<Player[]>(KEYS.players)) ?? [];
      setState({ players, loaded: true });
    },
    add(name, photo) {
      const p: Player = { id: newId('p'), name: name.trim(), photo, active: true, createdAt: Date.now() };
      setState({ players: [...getState().players, p] });
      persist();
      return p;
    },
    update(id, patch) {
      setState({ players: getState().players.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
      persist();
    },
    remove(id) {
      setState({ players: getState().players.filter((p) => p.id !== id) });
      persist();
    },
    toggle(id) {
      setState({ players: getState().players.map((p) => (p.id === id ? { ...p, active: !p.active } : p)) });
      persist();
    },
    setAllActive(active) {
      setState({ players: getState().players.map((p) => ({ ...p, active })) });
      persist();
    },
  };
});

export const usePhoto = (id: string) => usePlayers((s) => s.players.find((p) => p.id === id)?.photo);
