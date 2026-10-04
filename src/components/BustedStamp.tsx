import { Avatar } from './Avatar';

interface Props {
  playerId: string;
  name: string;
  subtitle?: string;
  roleLine?: string;
}

/** Foto + großer "BUSTED!"-Stempel. */
export function BustedCard({ playerId, name, subtitle, roleLine }: Props) {
  return (
    <div className="shake flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={name} playerId={playerId} size={190} className="border-4" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="stamp stamp-in bg-paper/85" style={{ fontSize: 'min(14vw, 3.6rem)' }}>
            Busted!
          </span>
        </div>
      </div>
      <div className="chalk-title text-center text-4xl">{name}</div>
      {subtitle && <div className="chalk text-center text-xl opacity-90">{subtitle}</div>}
      {roleLine && <div className="rounded-xl bg-paper px-4 py-1 text-xl text-ink">{roleLine}</div>}
    </div>
  );
}
