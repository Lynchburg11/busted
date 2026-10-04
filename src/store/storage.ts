import { createStore, del, get, set } from 'idb-keyval';

/** Eine IndexedDB-Datenbank für alles: Spieler (inkl. Fotos), Einstellungen, Spielstand. */
const db = createStore('busted-db', 'kv');

export const KEYS = {
  players: 'players',
  settings: 'settings',
  game: 'game',
  setup: 'setup',
} as const;

export async function load<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key, db);
  } catch (e) {
    console.warn('IndexedDB nicht lesbar', e);
    return undefined;
  }
}

export async function save(key: string, value: unknown): Promise<void> {
  try {
    await set(key, value, db);
  } catch (e) {
    console.warn('IndexedDB nicht schreibbar', e);
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await del(key, db);
  } catch {
    /* egal */
  }
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen. */
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}
