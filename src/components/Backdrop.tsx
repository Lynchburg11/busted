import { BACKGROUND_URL } from '../lib/assets';

/**
 * Klassenraum als Hintergrund für alle Bildschirme.
 * Das Bild wird immer auf volle Höhe skaliert (oben ausgerichtet) – so liegt die gemalte
 * Tafel auf jedem Gerät bei ca. 16–53 % der Bildschirmhöhe. Breitere Bildschirme bekommen
 * seitlich Tafelgrün.
 */
export function Backdrop({ full }: { full: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-board-dark">
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{ backgroundImage: `url(${BACKGROUND_URL})`, backgroundSize: 'auto 100%', backgroundPosition: 'center top' }}
      />
      <div
        className={`absolute inset-0 transition-[background-color,opacity] duration-700 ${
          full ? 'bg-gradient-to-b from-transparent from-55% to-black/80' : 'bg-board-dark/85'
        }`}
      />
    </div>
  );
}
