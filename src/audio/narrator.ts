import { create } from 'zustand';
import { NARRATION } from '../config/narration';
import { splitSentences, type Line } from './lines';
import {
  ClipBackend,
  SilentBackend,
  TtsBackend,
  ttsSupported,
  unlockSpeech,
  type AudioBackend,
  type PlayResult,
} from './tts';
import { sfx } from './sfx';

interface Unit {
  text: string;
  clipUrl?: string;
}

interface NarratorUi {
  caption: string;
  speaking: boolean;
  paused: boolean;
  /** Verfügbare Aufnahme-Stimmen (Ordnernamen). */
  packs: string[];
}

/** Zustand für die Anzeige (Untertitel, Pause-Knopf). */
export const useNarratorUi = create<NarratorUi>(() => ({ caption: '', speaking: false, paused: false, packs: [] }));

export class AbortedError extends Error {
  constructor() {
    super('aborted');
    this.name = 'AbortedError';
  }
}

/**
 * Erzähler mit Warteschlange:
 * - `say()` resolved erst, wenn die Ansage komplett gesprochen ist.
 * - Pause/Weiter wirkt auf Ansagen und auf `wait()`.
 * - `repeat()` wiederholt die laufende bzw. letzte Ansage.
 * - Backend austauschbar: TTS, aufgenommene MP3s oder stumm.
 */
class Narrator {
  readonly tts = new TtsBackend();
  private clips = new ClipBackend();
  private silent = new SilentBackend();
  /** Aufgenommene Stimmen: Ordnername → vorhandene Clips ("pauseStart-0", …). */
  private packs: Record<string, Set<string>> = {};
  private clipBase = '';
  speechEnabled = true;
  /** Gewählte Aufnahme-Stimme (Ordner unter public/audio) oder null = Computerstimme. */
  private voicePack: string | null = null;

  private paused = false;
  private resumeWaiters: (() => void)[] = [];
  private current: { units: Unit[]; index: number; restart: boolean } | null = null;
  private lastUnits: Unit[] = [];
  private activeBackend: AudioBackend | null = null;
  private idleRun = 0;
  private unlocked = false;

  /** Muss in einer Nutzergeste aufgerufen werden (iOS). */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    unlockSpeech();
    sfx.unlock();
  }

  async loadClipManifest(base: string) {
    this.clipBase = `${base}audio/`;
    try {
      const res = await fetch(`${base}audio/manifest.json`, { cache: 'no-cache' });
      if (!res.ok) return;
      const data: Record<string, string[]> = await res.json();
      if (Array.isArray(data)) return;
      this.packs = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, new Set(v)]));
      useNarratorUi.setState({ packs: Object.keys(this.packs) });
    } catch {
      /* keine Aufnahmen vorhanden */
    }
  }

  setVoicePack(pack: string | null) {
    this.voicePack = pack;
    this.tts.preferredGender = pack === 'female' || pack === 'male' ? pack : null;
  }

  private get pack(): Set<string> | null {
    return this.voicePack ? (this.packs[this.voicePack] ?? null) : null;
  }

  /**
   * Passende Aufnahme zur Ansage. Fehlt genau diese Variante, wird eine andere
   * aufgenommene Variante derselben Ansage genommen – so mischen sich Aufnahme und
   * Computerstimme nicht.
   */
  private clipFor(l: Line): { id: string; text: string } | null {
    const pack = this.pack;
    if (!pack || l.hasVars) return null;
    const id = `${l.key}-${l.variant}`;
    if (pack.has(id)) return { id, text: l.text };
    const options: readonly string[] = NARRATION[l.key];
    const available = options
      .map((text, v) => ({ id: `${l.key}-${v}`, text }))
      .filter((o) => pack.has(o.id) && !/\{\w+\}/.test(o.text));
    if (!available.length) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  private toUnits(lines: Line[]): Unit[] {
    return lines.flatMap((l) => {
      const clip = this.clipFor(l);
      if (clip) return [{ text: clip.text, clipUrl: `${this.clipBase}${this.voicePack}/${clip.id}.mp3` }];
      return splitSentences(l.text).map((text) => ({ text }));
    });
  }
  private backendFor(u: Unit): AudioBackend {
    if (!this.speechEnabled) return this.silent;
    if (u.clipUrl) return this.clips;
    if (ttsSupported()) return this.tts;
    return this.silent;
  }

  private async playUnit(u: Unit): Promise<PlayResult> {
    const b = this.backendFor(u);
    this.activeBackend = b;
    useNarratorUi.setState({ caption: u.text, speaking: true });
    const r = await b.play(u.text, u.clipUrl);
    if (r !== 'failed') return r;
    // Aufnahme nicht ladbar → Computerstimme
    const fallback = this.backendFor({ text: u.text });
    this.activeBackend = fallback;
    const r2 = await fallback.play(u.text);
    return r2 === 'failed' ? 'ended' : r2;
  }

  private waitForResume(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise((r) => this.resumeWaiters.push(r));
  }

  async say(input: Line | Line[], signal?: AbortSignal): Promise<void> {
    const lines = Array.isArray(input) ? input : [input];
    if (!lines.length) return;
    this.stopIdle();
    if (this.current) this.activeBackend?.cancel();
    const units = this.toUnits(lines);
    const job = { units, index: 0, restart: false };
    this.current = job;
    this.lastUnits = units;
    const onAbort = () => this.activeBackend?.cancel();
    signal?.addEventListener('abort', onAbort);
    try {
      while (job.index < units.length) {
        if (signal?.aborted || this.current !== job) break;
        await this.waitForResume();
        if (signal?.aborted || this.current !== job) break;
        const r = await this.playUnit(units[job.index]);
        if (job.restart) {
          job.restart = false;
          job.index = 0;
          continue;
        }
        if (r === 'cancelled' && this.paused) continue; // nach "Weiter" den Satz neu sprechen
        if (r === 'cancelled') break;
        job.index++;
        if (job.index < units.length) await this.wait(120, signal);
      }
    } finally {
      signal?.removeEventListener('abort', onAbort);
      if (this.current === job) {
        this.current = null;
        useNarratorUi.setState({ speaking: false });
      }
    }
    if (signal?.aborted) throw new AbortedError();
  }

  /** Pausierbare Wartezeit. */
  async wait(ms: number, signal?: AbortSignal): Promise<void> {
    let left = ms;
    const step = 100;
    while (left > 0) {
      if (signal?.aborted) throw new AbortedError();
      await this.waitForResume();
      await new Promise((r) => setTimeout(r, Math.min(step, left)));
      left -= step;
    }
    if (signal?.aborted) throw new AbortedError();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    useNarratorUi.setState({ paused: true });
    this.activeBackend?.cancel();
    sfx.suspend();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    useNarratorUi.setState({ paused: false });
    sfx.resume();
    const w = this.resumeWaiters;
    this.resumeWaiters = [];
    w.forEach((r) => r());
  }

  togglePause() {
    if (this.paused) this.resume();
    else this.pause();
  }

  get isPaused() {
    return this.paused;
  }

  /** Laufende Ansage von vorn – oder die letzte erneut abspielen. */
  repeat() {
    if (this.paused) this.resume();
    if (this.current) {
      this.current.restart = true;
      this.activeBackend?.cancel();
      return;
    }
    if (!this.lastUnits.length) return;
    const run = ++this.idleRun;
    const units = this.lastUnits;
    (async () => {
      for (const u of units) {
        if (run !== this.idleRun || this.current) return;
        const r = await this.playUnit(u);
        if (r === 'cancelled') return;
      }
      if (run === this.idleRun && !this.current) useNarratorUi.setState({ speaking: false });
    })();
  }

  private stopIdle() {
    this.idleRun++;
    if (!this.current) this.activeBackend?.cancel();
  }

  /** Alles stoppen (z. B. Spiel beenden). */
  stop() {
    this.idleRun++;
    this.current = null;
    this.activeBackend?.cancel();
    this.resume();
    useNarratorUi.setState({ caption: '', speaking: false });
  }

  clearCaption() {
    useNarratorUi.setState({ caption: '' });
  }
}

export const narrator = new Narrator();
