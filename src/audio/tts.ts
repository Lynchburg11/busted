export type PlayResult = 'ended' | 'cancelled';

export interface AudioBackend {
  play(text: string, clipUrl?: string): Promise<PlayResult>;
  cancel(): void;
}

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export const ttsSupported = () => !!synth();

let voiceCache: SpeechSynthesisVoice[] = [];

/** Stimmen werden (v. a. in Chrome/iOS) asynchron geladen. */
export function loadVoices(timeoutMs = 3000): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) return Promise.resolve((voiceCache = now));
  return new Promise((resolve) => {
    const done = () => {
      s.removeEventListener('voiceschanged', done);
      clearTimeout(t);
      resolve((voiceCache = s.getVoices()));
    };
    const t = setTimeout(done, timeoutMs);
    s.addEventListener('voiceschanged', done);
  });
}

export function germanVoices(all = voiceCache): SpeechSynthesisVoice[] {
  const de = all.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('de'));
  // de-DE zuerst, lokale (offline) Stimmen bevorzugt
  return de.sort(
    (a, b) =>
      Number(b.lang === 'de-DE') - Number(a.lang === 'de-DE') ||
      Number(b.localService) - Number(a.localService) ||
      a.name.localeCompare(b.name),
  );
}

/** Wortbasierte Schätzung der Sprechdauer – Fallback, falls onend nicht feuert. */
export function estimateMs(text: string, rate = 1): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(800, (words * 420) / Math.max(rate, 0.3));
}

export class TtsBackend implements AudioBackend {
  voiceURI: string | null = null;
  rate = 1;
  pitch = 1;
  private finish: ((r: PlayResult) => void) | null = null;

  play(text: string): Promise<PlayResult> {
    const s = synth();
    if (!s) return Promise.resolve('ended');
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE';
      const voice = voiceCache.find((v) => v.voiceURI === this.voiceURI) ?? germanVoices()[0];
      if (voice) u.voice = voice;
      u.rate = this.rate;
      u.pitch = this.pitch;
      let settled = false;
      const finish = (r: PlayResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this.finish === finish) this.finish = null;
        resolve(r);
      };
      const timer = setTimeout(() => finish('ended'), estimateMs(text, this.rate) + 5000);
      u.onend = () => finish('ended');
      u.onerror = (e) => finish(e.error === 'interrupted' || e.error === 'canceled' ? 'cancelled' : 'ended');
      this.finish = finish;
      // Chrome hängt manchmal im Pausenzustand fest
      if (s.paused) s.resume();
      s.speak(u);
    });
  }

  cancel() {
    const f = this.finish;
    this.finish = null;
    synth()?.cancel();
    f?.('cancelled');
  }
}

/** iOS: Sprachausgabe muss einmal innerhalb einer Nutzergeste gestartet werden. */
export function unlockSpeech() {
  const s = synth();
  if (!s) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  u.lang = 'de-DE';
  s.speak(u);
}

/** Spielt aufgenommene MP3s ab (ersetzt TTS, wenn eine Aufnahme existiert). */
export class ClipBackend implements AudioBackend {
  private audio: HTMLAudioElement | null = null;
  private finish: ((r: PlayResult) => void) | null = null;

  play(_text: string, clipUrl?: string): Promise<PlayResult> {
    if (!clipUrl) return Promise.resolve('ended');
    return new Promise((resolve) => {
      const audio = new Audio(clipUrl);
      this.audio = audio;
      let settled = false;
      const finish = (r: PlayResult) => {
        if (settled) return;
        settled = true;
        if (this.finish === finish) this.finish = null;
        resolve(r);
      };
      this.finish = finish;
      audio.onended = () => finish('ended');
      audio.onerror = () => finish('ended');
      audio.play().catch(() => finish('ended'));
    });
  }

  cancel() {
    const f = this.finish;
    this.finish = null;
    this.audio?.pause();
    f?.('cancelled');
  }
}

/** Ohne Ton: Text wird nur angezeigt, Dauer geschätzt. */
export class SilentBackend implements AudioBackend {
  private finish: ((r: PlayResult) => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  play(text: string): Promise<PlayResult> {
    return new Promise((resolve) => {
      const finish = (r: PlayResult) => {
        clearTimeout(this.timer);
        if (this.finish === finish) this.finish = null;
        resolve(r);
      };
      this.finish = finish;
      this.timer = setTimeout(() => finish('ended'), estimateMs(text) * 0.8);
    });
  }

  cancel() {
    const f = this.finish;
    this.finish = null;
    f?.('cancelled');
  }
}
