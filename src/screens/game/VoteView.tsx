import { useState } from 'react';
import { joinNames, line } from '../../audio/lines';
import { PlayerGrid } from '../../components/PlayerGrid';
import { alivePlayers, getPlayer, nextVoter } from '../../game/rules';
import type { GamePlayer, GameState } from '../../game/types';
import { useScript } from '../../lib/script';
import { useGame } from '../../store/game';
import { PassPhone, StepHeader } from './common';

export function VoteView({ game }: { game: GameState }) {
  const phase = game.phase.type === 'vote' ? game.phase : null;

  useScript(async (ctx) => {
    if (!phase) return;
    const intro =
      phase.round === 1
        ? line('voteStart')
        : line('voteTie', { names: joinNames(phase.candidates.map((id) => getPlayer(game, id)?.name ?? '')) });
    await ctx.say([intro, line(game.options.voteMode === 'geheim' ? 'voteSecret' : 'voteOpen')]);
  }, []);

  if (!phase) return null;
  return game.options.voteMode === 'geheim' ? <SecretVote game={game} /> : <OpenVote game={game} />;
}

function candidatesOf(game: GameState): GamePlayer[] {
  if (game.phase.type !== 'vote') return [];
  const ids = game.phase.candidates;
  return game.players.filter((p) => ids.includes(p.id));
}

function Title({ game }: { game: GameState }) {
  const round = game.phase.type === 'vote' ? game.phase.round : 1;
  return (
    <StepHeader emoji="⚖️" title={round === 1 ? 'Klassenkonferenz' : 'Stichwahl'}>
      {round === 2 && `Gleichstand! Nur noch ${joinNames(candidatesOf(game).map((p) => p.name))} stehen zur Wahl.`}
    </StepHeader>
  );
}

function SecretVote({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const voter = nextVoter(game);
  if (!voter) {
    const voters = alivePlayers(game).length;
    return (
      <div className="fade-in flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Title game={game} />
        <div className="text-7xl">🗳️</div>
        <p className="chalk text-2xl">Alle {voters} Stimmen sind abgegeben.</p>
        <p className="text-lg text-chalk-dim">Legt das Handy in die Mitte.</p>
        <button className="btn btn-primary w-full text-2xl" onClick={() => dispatch({ type: 'VOTE_FINISH' })}>
          Auszählen
        </button>
      </div>
    );
  }
  return <Ballot key={voter.id} game={game} voter={voter} />;
}

function Ballot({ game, voter }: { game: GameState; voter: GamePlayer }) {
  const dispatch = useGame((s) => s.dispatch);
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const phase = game.phase.type === 'vote' ? game.phase : null;
  const done = phase ? Object.keys(phase.ballots).length : 0;
  const total = alivePlayers(game).length;

  if (!ready) {
    return (
      <PassPhone
        id={voter.id}
        name={voter.name}
        hint={`Stimme ${done + 1} von ${total}. Geheim abstimmen!`}
        onReady={() => setReady(true)}
      />
    );
  }

  const candidates = candidatesOf(game);
  return (
    <div className="fade-in flex flex-1 flex-col">
      <Title game={game} />
      <p className="chalk -mt-2 mb-3 text-center text-xl">{voter.name}, wer soll rausfliegen?</p>
      <PlayerGrid
        players={candidates}
        disabled={[voter.id]}
        disabledLabel="du selbst"
        selected={sel ? [sel] : []}
        onSelect={(id) => setSel(id === sel ? null : id)}
      />
      <div className="sticky bottom-0 flex flex-col gap-2 bg-gradient-to-t from-board via-board to-transparent pt-4">
        <button
          className="btn btn-primary w-full text-2xl"
          disabled={!sel}
          onClick={() => dispatch({ type: 'VOTE_CAST', voterId: voter.id, targetId: sel })}
        >
          Stimme abgeben
        </button>
        <button
          className="btn btn-ghost w-full"
          onClick={() => dispatch({ type: 'VOTE_CAST', voterId: voter.id, targetId: null })}
        >
          Enthaltung
        </button>
      </div>
    </div>
  );
}

function OpenVote({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const candidates = candidatesOf(game);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const voters = alivePlayers(game).length;
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  const change = (id: string, d: number) =>
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(voters, (c[id] ?? 0) + d)) }));

  return (
    <div className="fade-in flex flex-1 flex-col">
      <Title game={game} />
      <p className="chalk -mt-2 mb-3 text-center text-xl">Hände hoch! Tippe aufs Foto für +1.</p>
      <PlayerGrid
        players={candidates}
        onSelect={(id) => change(id, 1)}
        badge={(id) =>
          (counts[id] ?? 0) > 0 && (
            <span
              className="flex h-9 min-w-9 items-center justify-center rounded-full bg-stamp px-2 text-xl font-bold text-white"
              onClick={(e) => {
                e.stopPropagation();
                change(id, -1);
              }}
            >
              {counts[id]}
            </span>
          )
        }
      />
      <p className="mt-3 text-center text-lg text-chalk-dim">
        {sum} von {voters} Stimmen · Tippe auf die rote Zahl für −1
      </p>
      <div className="sticky bottom-0 bg-gradient-to-t from-board via-board to-transparent pt-4">
        <button className="btn btn-primary w-full text-2xl" onClick={() => dispatch({ type: 'VOTE_FINISH', counts })}>
          Auszählen
        </button>
      </div>
    </div>
  );
}
