import { useMemo, useState } from 'react';
import { Page, Stepper, Toggle } from '../components/Layout';
import { CAMP_NAMES, ROLES, SPECIAL_ROLES } from '../config/roles';
import { analyzeSetup, suggestSetup, type SetupConfig } from '../game/setup';
import type { RoleId } from '../game/types';
import { useApp } from '../store/app';
import { useGame } from '../store/game';
import { usePlayers } from '../store/players';
import { useSettings } from '../store/settings';

export function SetupScreen() {
  const go = useApp((s) => s.go);
  const allPlayers = usePlayers((s) => s.players);
  const players = useMemo(() => allPlayers.filter((p) => p.active), [allPlayers]);
  const storedSetup = useGame((s) => s.setup);
  const start = useGame((s) => s.start);
  const settings = useSettings();
  const n = players.length;

  const [setup, setSetup] = useState<SetupConfig>(() => {
    if (storedSetup && analyzeSetup(storedSetup, n).errors.length === 0) return storedSetup;
    return suggestSetup(n);
  });
  const analysis = useMemo(() => analyzeSetup(setup, n), [setup, n]);
  const maxTeachers = Math.max(1, Math.floor((n - 1) / 2));

  const toggleRole = (id: RoleId) =>
    setSetup((s) => ({
      ...s,
      specials: s.specials.includes(id) ? s.specials.filter((r) => r !== id) : [...s.specials, id],
    }));

  const begin = () => {
    start(players, setup);
    go('game');
  };

  // Balance-Anzeige: −15 … +15
  const pos = Math.min(100, Math.max(0, ((analysis.score + 15) / 30) * 100));

  return (
    <Page
      title="Rollen"
      onBack={() => go('players')}
      footer={
        <button className="btn btn-primary w-full text-2xl" disabled={analysis.errors.length > 0} onClick={begin}>
          Klassenarbeit starten ✏️
        </button>
      }
    >
      <div className="card-chalk mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl">{ROLES.lehrer.emoji} Lehrer</div>
            <div className="text-base text-chalk-dim">bei {n} Spielern</div>
          </div>
          <Stepper value={setup.teacherCount} min={1} max={maxTeachers} onChange={(teacherCount) => setSetup((s) => ({ ...s, teacherCount }))} />
        </div>
        <button className="btn btn-ghost mt-2 min-h-10 w-full text-lg underline" onClick={() => setSetup(suggestSetup(n))}>
          Vorschlag für {n} Spieler übernehmen
        </button>
      </div>

      <h2 className="chalk-title mb-2 text-xl">Sonderrollen</h2>
      <ul className="mb-4 flex flex-col gap-2">
        {SPECIAL_ROLES.map((id) => {
          const r = ROLES[id];
          const on = setup.specials.includes(id);
          return (
            <li key={id}>
              <button
                aria-pressed={on}
                aria-label={`${r.name}: ${r.short}`}
                className={`card-chalk flex w-full items-center gap-3 p-3 text-left transition ${on ? 'border-chalk-yellow bg-chalk-yellow/10' : 'opacity-70'}`}
                onClick={() => toggleRole(id)}
              >
                <span className="text-3xl">{r.emoji}</span>
                <span className="flex-1">
                  <span className="block text-xl leading-tight">{r.name}</span>
                  <span className="block text-base leading-snug text-chalk-dim">{r.short}</span>
                </span>
                <span aria-hidden aria-checked={on} className="toggle" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="card-chalk mb-4 p-4">
        <div className="mb-1 flex justify-between text-base text-chalk-dim">
          <span>Lehrer im Vorteil</span>
          <span>Schüler im Vorteil</span>
        </div>
        <div className="relative h-4 rounded-full bg-gradient-to-r from-chalk-red/70 via-chalk-green/70 to-chalk-blue/70">
          <div className="absolute -top-1.5 h-7 w-2 -translate-x-1/2 rounded bg-chalk shadow" style={{ left: `${pos}%` }} />
        </div>
        <p className="mt-3 text-lg leading-snug">
          {analysis.deck.filter((r) => r === 'lehrer').length}× Lehrer
          {setup.specials.length > 0 && ', ' + SPECIAL_ROLES.filter((r) => setup.specials.includes(r)).map((r) => ROLES[r].name).join(', ')}
          {analysis.schuelerCount > 0 && `, ${analysis.schuelerCount}× Schüler`}
        </p>
        <p className="text-base text-chalk-dim">
          {CAMP_NAMES.lehrer}: {setup.teacherCount} · {CAMP_NAMES.schueler}: {Math.max(0, n - setup.teacherCount)}
        </p>
        {analysis.errors.map((e) => (
          <p key={e} className="mt-2 text-lg text-chalk-red">
            ⛔ {e}
          </p>
        ))}
        {analysis.warnings.map((w) => (
          <p key={w} className="mt-2 text-lg text-chalk-yellow">
            ⚠️ {w}
          </p>
        ))}
      </div>

      <div className="card-chalk px-4 py-1">
        <Toggle
          label="Rollen beim Ausscheiden aufdecken"
          checked={settings.revealRoles}
          onChange={(revealRoles) => settings.set({ revealRoles })}
        />
        <Toggle
          label="Geheime Abstimmung"
          hint={settings.voteMode === 'geheim' ? 'Das Handy geht reihum.' : 'Offen per Handzeichen, Stimmen werden eingetippt.'}
          checked={settings.voteMode === 'geheim'}
          onChange={(v) => settings.set({ voteMode: v ? 'geheim' : 'offen' })}
        />
      </div>
    </Page>
  );
}
