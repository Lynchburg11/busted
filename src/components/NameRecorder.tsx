import { useEffect, useRef, useState } from 'react';

const MAX_MS = 3000;
const TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

interface Props {
  value?: string;
  onChange(dataUrl: string | undefined): void;
}

/** Spieler spricht den eigenen Namen ein (max. 3 Sekunden). */
export function NameRecorder({ value, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const [left, setLeft] = useState(MAX_MS);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  useEffect(
    () => () => {
      clearTimers();
      if (recRef.current?.state === 'recording') recRef.current.stop();
    },
    [],
  );

  const stop = () => {
    clearTimers();
    if (recRef.current?.state === 'recording') recRef.current.stop();
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' });
        if (blob.size > 0) onChange(await blobToDataUrl(blob));
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setLeft(MAX_MS);
      for (let t = 100; t <= MAX_MS; t += 100) timers.current.push(setTimeout(() => setLeft(MAX_MS - t), t));
      timers.current.push(setTimeout(stop, MAX_MS));
    } catch {
      setError('Kein Mikrofonzugriff. Dann spricht die Computerstimme den Namen.');
    }
  };

  const play = () => {
    if (value) new Audio(value).play().catch(() => {});
  };

  if (!supported) return null;

  return (
    <div className="card-chalk flex flex-col gap-2 p-3">
      <div className="text-lg">🎙️ Name für die Ansagen</div>
      {recording ? (
        <button className="btn btn-danger" onClick={stop}>
          ⏹ Stopp ({Math.ceil(left / 1000)} s)
        </button>
      ) : (
        <div className="flex gap-2">
          <button className="btn btn-chalk flex-1 text-lg" onClick={start}>
            {value ? 'Neu einsprechen' : 'Namen einsprechen'}
          </button>
          {value && (
            <>
              <button className="icon-btn h-14 w-14" aria-label="Anhören" onClick={play}>
                ▶
              </button>
              <button className="icon-btn h-14 w-14" aria-label="Aufnahme löschen" onClick={() => onChange(undefined)}>
                ✕
              </button>
            </>
          )}
        </div>
      )}
      <p className="text-base leading-snug text-chalk-dim">
        {error ??
          (value
            ? 'Wird in den Ansagen verwendet, z. B. „[dein Name] wurde erwischt“.'
            : 'Tippen und sofort den Namen sagen. Ohne Aufnahme spricht die Computerstimme.')}
      </p>
    </div>
  );
}
