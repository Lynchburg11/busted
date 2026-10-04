import { Avatar } from './Avatar';

export interface GridPlayer {
  id: string;
  name: string;
}

interface Props {
  players: GridPlayer[];
  selected?: string[];
  /** Ausgegraut und nicht wählbar. */
  disabled?: string[];
  onSelect(id: string): void;
  /** Zusatz-Beschriftung pro Spieler (z. B. Stimmenzahl). */
  badge?: (id: string) => React.ReactNode;
  disabledLabel?: string;
  light?: boolean;
}

/** Großes Fotoraster zum Antippen. */
export function PlayerGrid({ players, selected = [], disabled = [], onSelect, badge, disabledLabel, light }: Props) {
  const cols = players.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';
  const size = players.length <= 4 ? 96 : players.length <= 9 ? 80 : 68;
  return (
    <div className={`grid ${cols} gap-3`}>
      {players.map((p) => {
        const isSel = selected.includes(p.id);
        const isDis = disabled.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            disabled={isDis}
            onClick={() => onSelect(p.id)}
            className={`relative flex flex-col items-center gap-1 rounded-2xl p-2 transition ${
              isSel
                ? 'bg-chalk-yellow/25 ring-4 ring-chalk-yellow'
                : light
                  ? 'bg-black/5'
                  : 'bg-white/5'
            } ${isDis ? 'opacity-40' : 'active:scale-95'}`}
          >
            <Avatar name={p.name} playerId={p.id} size={size} dimmed={isDis} />
            <span className={`w-full truncate text-center text-lg leading-tight ${light ? 'text-ink' : 'chalk'}`}>
              {p.name}
            </span>
            {isDis && disabledLabel && <span className="text-xs leading-none opacity-80">{disabledLabel}</span>}
            {isSel && (
              <span className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-chalk-yellow text-xl text-board">
                ✓
              </span>
            )}
            {badge && <div className="absolute top-1 left-1">{badge(p.id)}</div>}
          </button>
        );
      })}
    </div>
  );
}
