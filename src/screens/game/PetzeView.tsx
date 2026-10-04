import { useState } from 'react';
import { line } from '../../audio/lines';
import { PlayerGrid } from '../../components/PlayerGrid';
import { ROLES } from '../../config/roles';
import { alivePlayers, getPlayer } from '../../game/rules';
import type { GameState } from '../../game/types';
import { runScript, useScript } from '../../lib/script';
import { useGame } from '../../store/game';
import { PassPhone, StepHeader } from './common';

export function PetzeView({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const phase = game.phase.type === 'petze' ? game.phase : null;
  const petze = getPlayer(game, phase?.petzeId);
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useScript(async (ctx) => {
    if (petze) await ctx.say(line('petzeCall', { name: petze.name }));
  }, []);

  if (!phase || !petze) return null;

  if (!ready) {
    return (
      <PassPhone
        id={petze.id}
        name={petze.name}
        label={`${ROLES.petze.emoji} Die Petze ist`}
        hint="Du darfst jetzt jemanden mitnehmen."
        onReady={() => setReady(true)}
      />
    );
  }

  const skip = () => {
    setBusy(true);
    runScript(async (ctx) => {
      await ctx.say(line('petzeNone'));
      dispatch({ type: 'PETZE_PICK', targetId: null });
    });
  };

  return (
    <div className="fade-in flex flex-1 flex-col">
      <StepHeader emoji={ROLES.petze.emoji} title={`${petze.name} petzt`}>
        Wen nimmst du mit?
      </StepHeader>
      <PlayerGrid
        players={alivePlayers(game)}
        selected={sel ? [sel] : []}
        onSelect={(id) => setSel(id === sel ? null : id)}
      />
      <div className="sticky bottom-0 flex flex-col gap-2 bg-gradient-to-t from-board via-board to-transparent pt-4">
        <button
          className="btn btn-danger w-full text-2xl"
          disabled={!sel || busy}
          onClick={() => dispatch({ type: 'PETZE_PICK', targetId: sel })}
        >
          Verpetzen!
        </button>
        <button className="btn btn-ghost w-full" disabled={busy} onClick={skip}>
          Niemanden verpetzen
        </button>
      </div>
    </div>
  );
}
