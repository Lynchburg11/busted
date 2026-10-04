import { useEffect, useState } from 'react';
import { narrator, useNarratorUi } from '../../audio/narrator';
import { sfx } from '../../audio/sfx';
import { ConfirmDialog, Modal } from '../../components/Dialog';
import type { GameState } from '../../game/types';
import { useWakeLock } from '../../lib/wakeLock';
import { useApp } from '../../store/app';
import { useGame } from '../../store/game';
import { BustedView } from './BustedView';
import { DiscussionView } from './DiscussionView';
import { GameOverView } from './GameOverView';
import { NightView } from './NightView';
import { PetzeView } from './PetzeView';
import { RevealView } from './RevealView';
import { VoteView } from './VoteView';

/** Eindeutiger Schlüssel je Spielschritt → Ablaufskripte starten pro Schritt neu. */
function phaseKey(g: GameState): string {
  const p = g.phase;
  switch (p.type) {
    case 'reveal':
      return `reveal-${p.index}`;
    case 'night':
      return `night-${g.round}-${p.stepIndex}`;
    case 'busted':
      return `busted-${g.round}-${p.source}-${g.eliminations.length}-${g.log.length}`;
    case 'petze':
      return `petze-${p.petzeId}`;
    case 'vote':
      return `vote-${g.round}-${p.round}`;
    default:
      return `${p.type}-${g.round}`;
  }
}

function phaseLabel(g: GameState): string {
  switch (g.phase.type) {
    case 'reveal':
      return 'Rollenvergabe';
    case 'night':
      return `Pause ${g.round}`;
    case 'gameOver':
      return 'Zeugnisausgabe';
    default:
      return `Stunde ${g.round}`;
  }
}

export function GameScreen() {
  const game = useGame((s) => s.game);
  const abort = useGame((s) => s.abort);
  const go = useApp((s) => s.go);
  const { caption, paused, speaking } = useNarratorUi();
  const [menu, setMenu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useWakeLock(true);

  useEffect(() => {
    if (!game) go('home');
  }, [game, go]);

  // Beim Verlassen des Spielbildschirms alles verstummen lassen
  useEffect(
    () => () => {
      narrator.stop();
      sfx.stopAll();
    },
    [],
  );

  if (!game) return null;
  const night = game.phase.type === 'night';
  const key = phaseKey(game);

  let view: React.ReactNode;
  switch (game.phase.type) {
    case 'reveal':
      view = <RevealView game={game} />;
      break;
    case 'night':
      view = <NightView game={game} />;
      break;
    case 'busted':
      view = <BustedView key={key} game={game} />;
      break;
    case 'petze':
      view = <PetzeView key={key} game={game} />;
      break;
    case 'discussion':
      view = <DiscussionView key={key} game={game} />;
      break;
    case 'vote':
      view = <VoteView key={key} game={game} />;
      break;
    case 'gameOver':
      view = <GameOverView key={key} game={game} />;
      break;
  }

  return (
    <div className={`fixed inset-0 ${night ? 'bg-black/75' : ''} transition-colors duration-1000`}>
      <div className="safe mx-auto flex h-full max-w-lg flex-col">
        <header className="flex items-center gap-2 pb-2">
          <span className="chalk-title flex-1 truncate text-2xl">{phaseLabel(game)}</span>
          <button className="icon-btn" aria-label="Ansage wiederholen" onClick={() => narrator.repeat()}>
            ↻
          </button>
          <button className="icon-btn" aria-label={paused ? 'Weiter' : 'Pause'} onClick={() => narrator.togglePause()}>
            {paused ? '▶' : '⏸'}
          </button>
          <button className="icon-btn" aria-label="Menü" onClick={() => setMenu(true)}>
            ☰
          </button>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{view}</main>

        <div className="mt-2 line-clamp-3 min-h-[3rem] rounded-xl bg-black/35 px-3 py-1.5 text-center text-base leading-snug text-chalk-dim">
          {caption ? (
            <span className={speaking ? 'chalk' : ''}>
              {speaking && '🔊 '}
              {caption}
            </span>
          ) : (
            <span className="opacity-50">…</span>
          )}
        </div>
      </div>

      {paused && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/75">
          <div className="chalk-title text-5xl">Pausiert</div>
          <button className="btn btn-primary w-64 text-2xl" onClick={() => narrator.resume()}>
            ▶ Weiter
          </button>
          <button className="btn btn-chalk w-64" onClick={() => narrator.repeat()}>
            ↻ Ansage wiederholen
          </button>
        </div>
      )}

      <Modal open={menu} onClose={() => setMenu(false)}>
        <h2 className="chalk-title mb-4 text-center text-3xl">Menü</h2>
        <div className="flex flex-col gap-3">
          <button className="btn btn-primary" onClick={() => setMenu(false)}>
            Weiterspielen
          </button>
          <button
            className="btn btn-chalk"
            onClick={() => {
              setMenu(false);
              go('home');
            }}
          >
            Zum Hauptmenü (Spiel wird gespeichert)
          </button>
          <button className="btn border-2 border-chalk-red text-chalk-red" onClick={() => setConfirmEnd(true)}>
            Spiel beenden
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmEnd}
        title="Spiel wirklich beenden?"
        confirmLabel="Ja, beenden"
        danger
        onCancel={() => setConfirmEnd(false)}
        onConfirm={() => {
          setConfirmEnd(false);
          setMenu(false);
          abort();
          go('home');
        }}
      >
        Der Spielstand wird gelöscht. Die Spielerliste bleibt erhalten.
      </ConfirmDialog>
    </div>
  );
}
