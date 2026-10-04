import { useState } from 'react';
import { line } from '../../audio/lines';
import { HoldToReveal } from '../../components/HoldToReveal';
import { CAMP_NAMES, ROLES } from '../../config/roles';
import type { GameState } from '../../game/types';
import { useScript } from '../../lib/script';
import { useGame } from '../../store/game';
import { CardBack, PassPhone, RoleCard } from './common';

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
    <div className="fade-in flex flex-1 flex-col gap-3">
      <p className="chalk text-center text-xl">{player.name}, deine Rolle:</p>
      <HoldToReveal
        onFirstReveal={() => setSeen(true)}
        hidden={
          <CardBack maxDvh={44}>
            <div className="text-5xl">👆</div>
            <div className="chalk-title text-2xl leading-tight">Gedrückt halten</div>
            <div className="text-base leading-snug text-chalk-dim">Handy nah an dich halten – Loslassen verdeckt wieder</div>
          </CardBack>
        }
        revealed={<RoleCard role={player.role} maxDvh={44} />}
      />
      {seen && (
        <HoldToReveal
          hidden={
            <div className="card-chalk px-3 py-2 text-center text-base">📖 Regeln zu deiner Rolle – gedrückt halten</div>
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
