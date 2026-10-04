import { useState } from 'react';
import { line, named, roleReveal, type Line } from '../../audio/lines';
import { sfx } from '../../audio/sfx';
import { BustedCard } from '../../components/BustedStamp';
import { ROLES } from '../../config/roles';
import { getPlayer } from '../../game/rules';
import type { Elimination, GameState } from '../../game/types';
import { useScript } from '../../lib/script';
import { useGame } from '../../store/game';

function subtitle(game: GameState, e: Elimination): string | undefined {
  const by = getPlayer(game, e.byId)?.name;
  switch (e.cause) {
    case 'gruppenarbeit':
      return `war in der Gruppenarbeit mit ${by}`;
    case 'petze':
      return `wurde von ${by} verpetzt`;
    case 'konferenz':
      return 'fliegt per Klassenkonferenz raus';
    default:
      return 'wurde in der Pause erwischt';
  }
}

const AFTER = {
  gruppenarbeit: 'afterPair',
  petze: 'afterPetze',
  konferenz: 'afterVoteOut',
  lehrer: 'afterBusted',
  schulleiter: 'afterBusted',
} as const;

/** [Name] + Textstück (+ Rollenaufdeckung) */
function bustedLines(game: GameState, e: Elimination): Line[] {
  const p = getPlayer(game, e.playerId)!;
  const lines = named(p, AFTER[e.cause]);
  if (game.options.revealRoles) lines.push(...roleReveal(p.role));
  return lines;
}

export function BustedView({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const phase = game.phase.type === 'busted' ? game.phase : null;
  const [shown, setShown] = useState(-1);
  const [intro, setIntro] = useState(phase?.source === 'pause');
  const [done, setDone] = useState(false);

  useScript(async (ctx) => {
    if (!phase) return;
    if (phase.source === 'pause') {
      sfx.stopAmbience();
      await ctx.gong();
      await ctx.say(line('dayStart'));
      setIntro(false);
    }
    if (phase.eliminations.length === 0) {
      setShown(0);
      const key = phase.note === 'gleichstand' ? 'voteNobodyTie' : phase.note === 'keineStimmen' ? 'voteNobody' : 'nobodyBusted';
      await ctx.say(line(key));
    }
    for (let i = 0; i < phase.eliminations.length; i++) {
      setShown(i);
      await ctx.wait(500);
      await ctx.say(bustedLines(game, phase.eliminations[i]));
      await ctx.wait(800);
    }
    setDone(true);
  }, []);

  if (!phase) return null;

  if (intro) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="text-7xl">🔔</div>
        <div className="chalk-title text-4xl">Die Stunde beginnt!</div>
        <div className="text-xl text-chalk-dim">Alle Köpfe hoch.</div>
      </div>
    );
  }

  const e = shown >= 0 ? phase.eliminations[shown] : undefined;
  const p = e ? getPlayer(game, e.playerId) : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center">
        {phase.eliminations.length === 0 ? (
          <div className="fade-in flex flex-col items-center gap-3 text-center">
            <div className="text-7xl">{phase.source === 'konferenz' ? '🤷' : '😅'}</div>
            <div className="chalk-title text-3xl">
              {phase.note === 'gleichstand'
                ? 'Wieder Gleichstand'
                : phase.note === 'keineStimmen'
                  ? 'Keine Stimmen'
                  : 'Niemand erwischt!'}
            </div>
            <div className="text-xl text-chalk-dim">
              {phase.source === 'konferenz' ? 'Heute fliegt niemand raus.' : 'Alle sind noch dabei.'}
            </div>
          </div>
        ) : (
          e &&
          p && (
            <BustedCard
              key={shown}
              playerId={p.id}
              name={p.name}
              subtitle={subtitle(game, e)}
              roleLine={game.options.revealRoles ? `${ROLES[p.role].emoji} ${ROLES[p.role].name}` : undefined}
            />
          )
        )}
      </div>
      {phase.eliminations.length > 1 && (
        <p className="mb-2 text-center text-lg text-chalk-dim">
          {shown + 1} von {phase.eliminations.length}
        </p>
      )}
      <button className="btn btn-primary w-full text-2xl" disabled={!done} onClick={() => dispatch({ type: 'CONTINUE' })}>
        Weiter
      </button>
    </div>
  );
}
