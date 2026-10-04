import { line } from '../../audio/lines';
import { sfx } from '../../audio/sfx';
import { Avatar } from '../../components/Avatar';
import { CAMP_NAMES, ROLES } from '../../config/roles';
import { winnerText } from '../../game/engine';
import { effectiveCamp, isMixedPair, isWinner } from '../../game/rules';
import type { GameState, LogEntry } from '../../game/types';
import { useScript } from '../../lib/script';
import { useApp } from '../../store/app';
import { useGame } from '../../store/game';

const STAMP: Record<string, string> = {
  schueler: 'Schulfrei!',
  lehrer: 'Nachsitzen!',
  gruppenarbeit: 'Eins plus!',
  niemand: 'Leer!',
};

export function GameOverView({ game }: { game: GameState }) {
  const go = useApp((s) => s.go);
  const { start, setup, abort } = useGame();
  const winner = game.winner ?? 'niemand';

  useScript(async (ctx) => {
    sfx.stopAll();
    await ctx.gong();
    await ctx.say(line(`win_${winner}`));
  }, []);

  const again = () => {
    if (!setup) return go('setup');
    start(game.players.map((p) => ({ id: p.id, name: p.name })), setup);
  };

  const groups = new Map<string, LogEntry[]>();
  for (const l of game.log) {
    const k = `${l.part === 'pause' ? 'Pause' : 'Stunde'} ${l.round}`;
    groups.set(k, [...(groups.get(k) ?? []), l]);
  }
  const pairIds = game.pair && isMixedPair(game) ? [game.pair.a, game.pair.b] : [];

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-2">
      <div className="flex flex-col items-center gap-4 pt-4 text-center">
        <span className="stamp stamp-in px-4" style={{ background: 'rgb(253 251 242 / 0.92)' }}>
          {STAMP[winner]}
        </span>
        <h2 className="chalk-title mt-2 text-3xl">{winnerText(winner)}</h2>
      </div>

      <section className="card-chalk p-3">
        <h3 className="chalk-title mb-2 text-xl">Alle Rollen</h3>
        <ul className="flex flex-col gap-2">
          {game.players.map((p) => {
            const camp = effectiveCamp(game, p);
            const won = isWinner(game, p);
            return (
              <li key={p.id} className="flex items-center gap-3">
                <Avatar name={p.name} playerId={p.id} size={48} dimmed={!p.alive} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xl">
                    {p.name} {won && '🏆'}
                  </div>
                  <div className="text-base leading-tight text-chalk-dim">
                    {ROLES[p.role].emoji} {ROLES[p.role].name}
                    {p.role === 'streber' && game.streber.switched && ' → Lehrer'}
                    {' · '}
                    {pairIds.includes(p.id) ? 'Gruppenarbeit' : CAMP_NAMES[camp]}
                  </div>
                </div>
                <span className="text-base text-chalk-dim">{p.alive ? 'dabei' : 'raus'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="paper text-base">
        <h3 className="font-marker text-xl">Spielverlauf</h3>
        {[...groups.entries()].map(([title, entries]) => (
          <div key={title}>
            <b>{title}</b>
            <ul>
              {entries.map((l, i) => (
                <li key={i} className={l.secret ? 'italic opacity-75' : ''}>
                  {l.secret ? '🤫 ' : '• '}
                  {l.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3">
        <button className="btn btn-primary text-2xl" onClick={again}>
          🔁 Neue Runde, gleiche Spieler
        </button>
        <div className="flex gap-3">
          <button
            className="btn btn-chalk flex-1"
            onClick={() => {
              abort();
              go('setup');
            }}
          >
            Rollen ändern
          </button>
          <button
            className="btn btn-chalk flex-1"
            onClick={() => {
              abort();
              go('home');
            }}
          >
            Hauptmenü
          </button>
        </div>
      </div>
    </div>
  );
}
