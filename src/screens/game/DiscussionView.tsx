import { useEffect, useRef, useState } from 'react';
import { line } from '../../audio/lines';
import { narrator, useNarratorUi } from '../../audio/narrator';
import { sfx } from '../../audio/sfx';
import { Avatar } from '../../components/Avatar';
import type { GameState } from '../../game/types';
import { runScript, useScript } from '../../lib/script';
import { useGame } from '../../store/game';
import { useSettings } from '../../store/settings';

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export function DiscussionView({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const total = useSettings((s) => s.discussionSeconds);
  const narratorPaused = useNarratorUi((s) => s.paused);
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const warned = useRef(false);
  const ended = useRef(false);

  useScript(async (ctx) => {
    await ctx.say(line('discussionOpen'));
    setRunning(true);
  }, []);

  const ticking = running && !narratorPaused && left > 0;

  useEffect(() => {
    if (!ticking) {
      sfx.stopTick();
      return;
    }
    sfx.startTick();
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => {
      clearInterval(t);
      sfx.stopTick();
    };
  }, [ticking]);

  useEffect(() => {
    if (left === 30 && !warned.current && total > 45) {
      warned.current = true;
      narrator.say(line('discussionWarn')).catch(() => {});
    }
    if (left === 0 && running && !ended.current) {
      ended.current = true;
      const ac = runScript(async (ctx) => {
        await ctx.gong();
        await ctx.say(line('discussionEnd'));
        await ctx.wait(1200);
        dispatch({ type: 'DISCUSSION_DONE' });
      });
      return () => ac.abort();
    }
  }, [left, running, total, dispatch]);

  const pct = (left / Math.max(total, 1)) * 100;

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <div className="text-center">
        <div className="text-xl text-chalk-dim">Klassenarbeit · Diskussion</div>
        <div className={`chalk-title text-8xl tabular-nums ${left <= 30 ? 'text-chalk-red' : ''}`}>{fmt(left)}</div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-chalk-yellow transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex w-full gap-3">
        <button className="btn btn-chalk flex-1" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
          {running ? '⏸ Anhalten' : '▶ Start'}
        </button>
        <button
          className="btn btn-chalk flex-1"
          onClick={() => {
            setLeft((l) => l + 60);
            warned.current = false;
          }}
          disabled={left === 0}
        >
          +1 Min
        </button>
      </div>

      <div className="card-chalk w-full flex-1 overflow-y-auto p-3">
        <div className="mb-2 text-lg text-chalk-dim">Noch in der Klasse:</div>
        <div className="grid grid-cols-4 gap-2">
          {game.players.map((p) => (
            <div key={p.id} className="flex flex-col items-center">
              <Avatar name={p.name} playerId={p.id} size={56} dimmed={!p.alive} />
              <span className={`w-full truncate text-center text-base ${p.alive ? '' : 'text-chalk-dim line-through'}`}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary w-full text-2xl" onClick={() => dispatch({ type: 'DISCUSSION_DONE' })}>
        Zur Klassenkonferenz →
      </button>
    </div>
  );
}
