import { create } from 'zustand';
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
}

/** Zustand für die Anzeige (Untertitel, Pause-Knopf). */
export const useNarratorUi = create<NarratorUi>(() => ({ caption: '', speaking: false, paused: false }));

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
  private clipManifest = new Set<string>();
  speechEnabled = true;

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
    try {
      const res = await fetch(`${base}audio/manifest.json`, { cache: 'no-cache' });
      if (!res.ok) return;
      const list: string[] = await res.json();
      this.clipManifest = new Set(list);
      this.clipBase = `${base}audio/`;
    } catch {
      /* keine Aufnahmen vorhanden */
    }
  }
  private clipBase = '';

  private toUnits(lines: Line[]): Unit[] {
    return lines.flatMap((l) => {
      const id = `${l.key}-${l.variant}`;
      if (!l.hasVars && this.clipManifest.has(id)) {
        return [{ text: l.text, clipUrl: `${this.clipBase}${id}.mp3` }];
      }
      return splitSentences(l.text).map((text) => ({ text }));
    });
  }

  private backendFor(u: Unit): AudioBackend {
    if (u.clipUrl) return this.clips;
    if (this.speechEnabled && ttsSupported()) return this.tts;
    return this.silent;
  }

  private async playUnit(u: Unit): Promise<PlayResult> {
    const b = this.backendFor(u);
    this.activeBackend = b;
    useNarratorUi.setState({ caption: u.text, speaking: true });
    return b.play(u.text, u.clipUrl);
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
