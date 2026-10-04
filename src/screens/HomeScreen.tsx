import { useState } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { useApp } from '../store/app';
import { useGame } from '../store/game';

export function HomeScreen() {
  const go = useApp((s) => s.go);
  const game = useGame((s) => s.game);
  const abort = useGame((s) => s.abort);
  const [confirmNew, setConfirmNew] = useState(false);
  const running = game && game.phase.type !== 'gameOver';

  const startNew = () => {
    if (running) setConfirmNew(true);
    else go('players');
  };

  return (
    <div className="safe mx-auto flex h-full max-w-lg flex-col items-center justify-between">
      <div className="mt-[8vh] flex flex-col items-center">
        <div className="chalk text-xl tracking-widest text-chalk-dim uppercase">Klassenarbeit</div>
        <h1 className="mt-2">
          <span className="stamp stamp-in px-4" style={{ background: 'rgb(253 251 242 / 0.92)' }}>
            Busted!
          </span>
        </h1>
        <p className="chalk mt-8 max-w-xs text-center text-xl leading-snug">
          Schreibt die Arbeit. Spickt heimlich. Und lasst euch bloß nicht von den Lehrern erwischen.
        </p>
      </div>

      <nav className="flex w-full flex-col gap-3 pb-4">
        {running && (
          <button className="btn btn-primary text-2xl" onClick={() => go('game')}>
            ▶ Spiel fortsetzen
          </button>
        )}
        <button className={`btn text-2xl ${running ? 'btn-chalk' : 'btn-primary'}`} onClick={startNew}>
          Neues Spiel
        </button>
        <div className="grid grid-cols-3 gap-3">
          <button className="btn btn-chalk flex-col gap-0 text-lg" onClick={() => go('players')}>
            <span className="text-2xl">🧑‍🎓</span>Spieler
          </button>
          <button className="btn btn-chalk flex-col gap-0 text-lg" onClick={() => go('rules')}>
            <span className="text-2xl">📖</span>Regeln
          </button>
          <button className="btn btn-chalk flex-col gap-0 text-lg" onClick={() => go('settings')}>
            <span className="text-2xl">⚙️</span>Optionen
          </button>
        </div>
      </nav>

      <ConfirmDialog
        open={confirmNew}
        title="Laufendes Spiel beenden?"
        confirmLabel="Ja, neues Spiel"
        danger
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          abort();
          setConfirmNew(false);
          go('players');
        }}
      >
        Der aktuelle Spielstand geht verloren.
      </ConfirmDialog>
    </div>
  );
}
