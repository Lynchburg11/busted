import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Dialog';
import { Page } from '../components/Layout';
import { PlayerEditor } from '../components/PlayerEditor';
import { MAX_PLAYERS, MIN_PLAYERS } from '../config/roles';
import { useApp } from '../store/app';
import { usePlayers, type Player } from '../store/players';

export function PlayersScreen() {
  const go = useApp((s) => s.go);
  const { players, toggle, setAllActive } = usePlayers();
  const [editing, setEditing] = useState<Player | 'new' | null>(null);
  const active = players.filter((p) => p.active).length;
  const valid = active >= MIN_PLAYERS && active <= MAX_PLAYERS;

  return (
    <Page
      title="Wer spielt mit?"
      onBack={() => go('home')}
      right={
        players.length > 0 && (
          <button className="btn btn-ghost min-h-10 px-2 text-base" onClick={() => setAllActive(active < players.length)}>
            {active < players.length ? 'Alle' : 'Keiner'}
          </button>
        )
      }
      footer={
        <div className="flex flex-col gap-2">
          <p className={`text-center text-lg ${valid ? 'text-chalk-dim' : 'text-chalk-red'}`}>
            {active} ausgewählt · {MIN_PLAYERS} bis {MAX_PLAYERS} Spieler
          </p>
          <button className="btn btn-primary" disabled={!valid} onClick={() => go('setup')}>
            Weiter zu den Rollen →
          </button>
        </div>
      }
    >
      <ul className="flex flex-col gap-2">
        {players.map((p) => (
          <li key={p.id} className={`card-chalk flex items-center gap-3 p-2 pr-3 ${p.active ? '' : 'opacity-50'}`}>
            <button className="flex flex-1 items-center gap-3 text-left" onClick={() => toggle(p.id)}>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 text-xl ${p.active ? 'border-chalk-yellow bg-chalk-yellow text-board' : 'border-chalk/60'}`}
              >
                {p.active ? '✓' : ''}
              </span>
              <Avatar name={p.name} photo={p.photo} size={56} />
              <span className="chalk truncate text-2xl">{p.name}</span>
            </button>
            <button className="icon-btn h-11 w-11 text-lg" aria-label={`${p.name} bearbeiten`} onClick={() => setEditing(p)}>
              ✏️
            </button>
          </li>
        ))}
      </ul>
      {players.length === 0 && (
        <p className="chalk mt-8 text-center text-xl text-chalk-dim">
          Noch keine Spieler. Füge alle hinzu, die mitspielen – mit Foto macht's mehr Spaß!
        </p>
      )}
      <button
        className="btn mt-4 w-full border-2 border-dashed border-chalk/60 text-chalk"
        disabled={players.length >= 40}
        onClick={() => setEditing('new')}
      >
        ＋ Spieler hinzufügen
      </button>

      <Modal open={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <PlayerEditor player={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </Modal>
    </Page>
  );
}
