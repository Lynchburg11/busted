import { sfx } from './sfx';

export type PlayResult = 'ended' | 'cancelled' | 'failed';

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

// Bekannte deutsche Systemstimmen (iOS, macOS, Android, Windows) nach Stimmlage
const FEMALE = /anna|petra|helena|katja|hedda|marlene|vicki|sandy|shelley|amala|seraphina|louisa|elke|female|frau/i;
const MALE = /markus|yannick|stefan|conrad|hans|martin|reed|eddy|rocko|ralf|killian|jonas|male|mann/i;

export class TtsBackend implements AudioBackend {
  voiceURI: string | null = null;
  /** Passend zur Aufnahme-Stimme, falls keine Stimme fest gewählt ist. */
  preferredGender: 'female' | 'male' | null = null;

  private pickVoice(): SpeechSynthesisVoice | undefined {
    const chosen = voiceCache.find((v) => v.voiceURI === this.voiceURI);
    if (chosen) return chosen;
    const de = germanVoices();
    if (this.preferredGender) {
      const re = this.preferredGender === 'female' ? FEMALE : MALE;
      const match = de.find((v) => re.test(v.name) && !(this.preferredGender === 'female' ? MALE : FEMALE).test(v.name));
      if (match) return match;
    }
    return de[0];
  }
  rate = 1;
  pitch = 1;
  private finish: ((r: PlayResult) => void) | null = null;

  play(text: string): Promise<PlayResult> {
    const s = synth();
    if (!s) return Promise.resolve('ended');
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE';
      const voice = this.pickVoice();
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

const trimCache = new WeakMap<AudioBuffer, [number, number]>();

/**
 * Stille am Anfang und Ende überspringen – sonst entstehen Lücken zwischen
 * [Name] und dem folgenden Textstück (v. a. bei selbst eingesprochenen Namen).
 */
function trimSilence(buffer: AudioBuffer, threshold = 0.02, margin = 0.06): [number, number] {
  const cached = trimCache.get(buffer);
  if (cached) return cached;
  const data = buffer.getChannelData(0);
  let first = 0;
  let last = data.length - 1;
  while (first < data.length && Math.abs(data[first]) < threshold) first++;
  while (last > first && Math.abs(data[last]) < threshold) last--;
  const rate = buffer.sampleRate;
  const result: [number, number] =
    first >= last
      ? [0, buffer.duration]
      : [Math.max(0, first / rate - margin), Math.min(buffer.duration, last / rate + margin)];
  trimCache.set(buffer, result);
  return result;
}

/**
 * Spielt aufgenommene MP3s über Web Audio ab (auf iOS zuverlässiger als <audio>,
 * weil der AudioContext schon beim ersten Tippen freigeschaltet wird).
 * Ergebnis 'failed' → der Erzähler fällt auf die Sprachausgabe zurück.
 */
export class ClipBackend implements AudioBackend {
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private source: AudioBufferSourceNode | null = null;
  private finish: ((r: PlayResult) => void) | null = null;

  /** Dekodierte Clips sind groß – nur die letzten paar im Speicher halten. */
  private static readonly CACHE_SIZE = 8;

  private load(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    let p = this.buffers.get(url);
    if (p) {
      this.buffers.delete(url); // als zuletzt benutzt markieren
    } else {
      p = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${url}`);
          return res.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data));
      p.catch(() => this.buffers.delete(url));
    }
    this.buffers.set(url, p);
    while (this.buffers.size > ClipBackend.CACHE_SIZE) {
      this.buffers.delete(this.buffers.keys().next().value!);
    }
    return p;
  }

  play(_text: string, clipUrl?: string): Promise<PlayResult> {
    const ctx = sfx.getContext();
    if (!clipUrl || !ctx) return Promise.resolve('failed');
    return new Promise((resolve) => {
      let settled = false;
      const finish = (r: PlayResult) => {
        if (settled) return;
        settled = true;
        if (this.finish === finish) this.finish = null;
        resolve(r);
      };
      this.finish = finish;
      ctx.resume().catch(() => {});
      this.load(ctx, clipUrl).then(
        (buffer) => {
          if (settled) return;
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.connect(ctx.destination);
          src.onended = () => finish('ended');
          this.source = src;
          const [from, to] = trimSilence(buffer);
          src.start(0, from, to - from);
        },
        () => finish('failed'),
      );
    });
  }

  cancel() {
    const f = this.finish;
    this.finish = null;
    try {
      this.source?.stop();
    } catch {
      /* schon gestoppt */
    }
    this.source = null;
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
