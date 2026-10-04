import { useState } from 'react';
import { line } from '../../audio/lines';
import { HoldToReveal } from '../../components/HoldToReveal';
import { CAMP_NAMES, ROLES } from '../../config/roles';
import type { GameState } from '../../game/types';
import { useScript } from '../../lib/script';
import { useGame } from '../../store/game';
import { PassPhone, RoleCard } from './common';

export function RevealView({ game }: { game: GameState }) {
  if (game.phase.type !== 'reveal') return null;
  const index = game.phase.index;
  return <RevealOne key={index} game={game} index={index} />;
}

function RevealOne({ game, index }: { game: GameState; index: number }) {
  const dispatch = useGame((s) => s.dispatch);
  const player = game.players[index];
  const role = ROLES[player.role];
  const [stage, setStage] = useState<'pass' | 'hold'>('pass');
  const [seen, setSeen] = useState(false);

  useScript(async (ctx) => {
    if (index === 0) await ctx.say(line('gameStart'));
  }, [index]);

  if (stage === 'pass') {
    return (
      <PassPhone
        id={player.id}
        name={player.name}
        hint={`Spieler ${index + 1} von ${game.players.length}. Nur ${player.name} schaut hin!`}
        onReady={() => setStage('hold')}
      />
    );
  }

  return (
    <div className="fade-in flex flex-1 flex-col gap-4">
      <p className="chalk text-center text-2xl">{player.name}, deine Rolle:</p>
      <HoldToReveal
        onFirstReveal={() => setSeen(true)}
        hidden={
          <div className="paper flex min-h-72 flex-col items-center justify-center text-center">
            <div className="text-6xl">👆</div>
            <div className="font-marker text-3xl">Gedrückt halten</div>
            <div className="text-lg">Loslassen verdeckt wieder</div>
          </div>
        }
        revealed={<RoleCard role={player.role} />}
      />
      {seen && (
        <HoldToReveal
          hidden={
            <div className="card-chalk p-4 text-center text-xl">📖 Regeln zu deiner Rolle – gedrückt halten</div>
          }
          revealed={
            <div className="paper-plain p-4 text-lg leading-snug">
              <b>
                {role.emoji} {role.name} · {CAMP_NAMES[role.camp]}
              </b>
              <p className="mt-1">{role.rules}</p>
            </div>
          }
        />
      )}
      <div className="flex-1" />
      <button className="btn btn-primary w-full text-2xl" disabled={!seen} onClick={() => dispatch({ type: 'REVEAL_NEXT' })}>
        {index + 1 < game.players.length ? 'Gemerkt – weitergeben' : 'Gemerkt – Handy in die Mitte'}
      </button>
    </div>
  );
}
