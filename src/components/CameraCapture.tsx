import { useEffect, useRef, useState } from 'react';
import { fileToSquareJpeg, squareJpeg } from '../lib/image';

interface Props {
  onCapture(dataUrl: string): void;
  onCancel(): void;
}

/** Frontkamera mit Live-Vorschau; Fallback auf Datei-/Kamera-Auswahl des Systems. */
export function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Die Kamera ist in diesem Browser nicht direkt verfügbar.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
      } catch {
        setError('Kein Kamerazugriff. Du kannst stattdessen ein Foto auswählen.');
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setShot(squareJpeg(v, v.videoWidth, v.videoHeight, true));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setShot(await fileToSquareJpeg(file));
    } catch {
      setError('Das Bild konnte nicht gelesen werden.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-3xl border-4 border-chalk/70 bg-black">
        {shot ? (
          <img src={shot} alt="Vorschau" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            onLoadedData={() => setReady(true)}
            className="h-full w-full -scale-x-100 object-cover"
          />
        )}
        {!shot && !ready && !error && (
          <div className="pulse-soft absolute inset-0 flex items-center justify-center text-chalk">Kamera startet …</div>
        )}
        {!shot && error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-lg text-chalk">{error}</div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />

      {shot ? (
        <div className="flex w-full gap-3">
          <button className="btn btn-chalk flex-1" onClick={() => setShot(null)}>
            Nochmal
          </button>
          <button className="btn btn-primary flex-1" onClick={() => onCapture(shot)}>
            Übernehmen
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-3">
          {!error && (
            <button
              aria-label="Foto aufnehmen"
              disabled={!ready}
              onClick={snap}
              className="h-20 w-20 rounded-full border-4 border-chalk bg-chalk/90 shadow-lg active:scale-90 disabled:opacity-40"
            />
          )}
          <button className="btn btn-chalk w-full" onClick={() => fileRef.current?.click()}>
            📁 Foto auswählen
          </button>
          <button className="btn btn-ghost w-full" onClick={onCancel}>
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
}
