import { useState } from 'react';
import { usePlayers, type Player } from '../store/players';
import { Avatar } from './Avatar';
import { CameraCapture } from './CameraCapture';
import { ConfirmDialog } from './Dialog';

interface Props {
  player?: Player;
  onDone(): void;
}

export function PlayerEditor({ player, onDone }: Props) {
  const { add, update, remove, players } = usePlayers();
  const [name, setName] = useState(player?.name ?? '');
  const [photo, setPhoto] = useState<string | undefined>(player?.photo);
  const [camera, setCamera] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trimmed = name.trim();
  const duplicate = players.some((p) => p.id !== player?.id && p.name.toLowerCase() === trimmed.toLowerCase());

  const submit = () => {
    if (!trimmed || duplicate) return;
    if (player) update(player.id, { name: trimmed, photo });
    else add(trimmed, photo);
    onDone();
  };

  if (camera) {
    return (
      <div>
        <h2 className="chalk-title mb-4 text-center text-2xl">Lächeln! 📸</h2>
        <CameraCapture
          onCancel={() => setCamera(false)}
          onCapture={(url) => {
            setPhoto(url);
            setCamera(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="chalk-title text-center text-2xl">{player ? 'Spieler bearbeiten' : 'Neuer Spieler'}</h2>
      <button className="mx-auto flex flex-col items-center gap-2" onClick={() => setCamera(true)}>
        <Avatar name={trimmed || '?'} photo={photo} size={140} />
        <span className="chalk text-lg underline decoration-dashed underline-offset-4">
          {photo ? 'Neues Foto' : '📷 Foto aufnehmen'}
        </span>
      </button>
      {photo && (
        <button className="btn btn-ghost -mt-2 min-h-10 text-base" onClick={() => setPhoto(undefined)}>
          Foto entfernen
        </button>
      )}
      <input
        className="field"
        placeholder="Name"
        value={name}
        maxLength={20}
        autoFocus={!player}
        enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {duplicate && <p className="text-chalk-red">Den Namen gibt es schon.</p>}
      <button className="btn btn-primary" disabled={!trimmed || duplicate} onClick={submit}>
        Speichern
      </button>
      <div className="flex gap-3">
        <button className="btn btn-chalk flex-1" onClick={onDone}>
          Abbrechen
        </button>
        {player && (
          <button className="btn flex-1 border-2 border-chalk-red text-chalk-red" onClick={() => setConfirmDelete(true)}>
            Löschen
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={`${player?.name} löschen?`}
        confirmLabel="Ja, löschen"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (player) remove(player.id);
          onDone();
        }}
      >
        Name und Foto werden von diesem Gerät entfernt.
      </ConfirmDialog>
    </div>
  );
}
