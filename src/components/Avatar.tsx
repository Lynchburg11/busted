import { initials } from '../lib/image';
import { usePhoto } from '../store/players';

const COLORS = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#9d4edd', '#f4a261', '#4895ef', '#ef476f'];

function colorFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

interface Props {
  name: string;
  /** Foto direkt übergeben … */
  photo?: string;
  /** … oder über die Spieler-ID aus dem Speicher holen. */
  playerId?: string;
  size?: number;
  dimmed?: boolean;
  className?: string;
}

export function Avatar({ name, photo, playerId, size = 64, dimmed, className = '' }: Props) {
  const stored = usePhoto(playerId ?? '');
  const src = photo ?? stored;
  const style = { width: size, height: size };
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border-2 border-chalk/70 ${dimmed ? 'opacity-35 grayscale' : ''} ${className}`}
      style={style}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-marker text-white"
          style={{ background: colorFor(name), fontSize: size * 0.38 }}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}
