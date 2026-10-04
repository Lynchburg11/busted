import type { RoleId } from '../game/types';

/** Pfad zu einer Datei in public/ (berücksichtigt den Unterpfad auf GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Rollenkarte – Quelle in assets-src/cards, aufbereitet mit `npm run images`. */
export const cardUrl = (role: RoleId) => asset(`cards/${role}.webp`);

export const LOGO_URL = asset('logo/busted-logo.webp');
export const BACKGROUND_URL = asset('backgrounds/klassenraum.webp');

/** Seitenverhältnis der Karten (Breite / Höhe). */
export const CARD_RATIO = 640 / 1182;
