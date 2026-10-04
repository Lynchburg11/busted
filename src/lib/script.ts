import { useEffect, useRef } from 'react';
import type { Line } from '../audio/lines';
import { AbortedError, narrator } from '../audio/narrator';
import { sfx } from '../audio/sfx';

/** Werkzeuge für einen Ablauf (Ansage → warten → nächster Schritt). Bricht beim Unmount ab. */
export interface ScriptCtx {
  signal: AbortSignal;
  say(lines: Line | Line[]): Promise<void>;
  wait(ms: number): Promise<void>;
  gong(): Promise<void>;
  check(): void;
}

export function makeCtx(signal: AbortSignal): ScriptCtx {
  const check = () => {
    if (signal.aborted) throw new AbortedError();
  };
  return {
    signal,
    check,
    say: (lines) => narrator.say(lines, signal),
    wait: (ms) => narrator.wait(ms, signal),
    gong: async () => {
      check();
      await sfx.gong();
      check();
    },
  };
}

/**
 * Startet ein asynchrones Skript beim Mount (bzw. wenn sich `deps` ändern)
 * und bricht es beim Unmount ab.
 */
export function useScript(script: (ctx: ScriptCtx) => Promise<void>, deps: unknown[]) {
  const ref = useRef(script);
  ref.current = script;
  useEffect(() => {
    const ac = new AbortController();
    ref.current(makeCtx(ac.signal)).catch((e) => {
      if (!(e instanceof AbortedError)) console.error(e);
    });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Zufällige Wartezeit, damit Schein-Aufrufe nicht auffallen. */
export const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/** Startet ein Skript aus einem Event-Handler heraus (abbrechbar). */
export function runScript(script: (ctx: ScriptCtx) => Promise<void>): AbortController {
  const ac = new AbortController();
  script(makeCtx(ac.signal)).catch((e) => {
    if (!(e instanceof AbortedError)) console.error(e);
  });
  return ac;
}
