import { useState } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { LOGO_URL } from '../lib/assets';
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
      {/* Logo + Untertitel stehen auf der gemalten Tafel des Hintergrunds (ca. 16–53 % der Höhe) */}
      <div
        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-[1.5dvh]"
        style={{ top: '17.5dvh', height: '34dvh', width: 'min(38dvh, 84vw)' }}
      >
        <h1 className="w-full">
          <img src={LOGO_URL} alt="Busted!" className="stamp-in-soft w-full drop-shadow-lg" draggable={false} />
        </h1>
        <p className="chalk text-center leading-snug" style={{ fontSize: 'min(2.3dvh, 4.6vw)' }}>
          Schreibt die Arbeit. Spickt heimlich.
          <br />
          Und lasst euch bloß nicht erwischen!
        </p>
      </div>
      <div className="flex-1" />

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
