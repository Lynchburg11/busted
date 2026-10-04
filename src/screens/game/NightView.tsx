import { useState } from 'react';
import { line, type Line } from '../../audio/lines';
import { sfx } from '../../audio/sfx';
import { Avatar } from '../../components/Avatar';
import { PlayerGrid } from '../../components/PlayerGrid';
import { CAMP_NAMES, ROLES } from '../../config/roles';
import { schuelersprecherOptions } from '../../game/engine';
import { alivePlayers, getPlayer, inspectRole, isStepActive, validTargets } from '../../game/rules';
import type { GamePlayer, GameState, NightStepId, NightSubmitData } from '../../game/types';
import { randomBetween, useScript } from '../../lib/script';
import { useGame } from '../../store/game';
import { NeutralScreen, RoleCard, StepHeader } from './common';

/** Schein-Aufrufe dauern zufällig lang, damit niemand am Timing etwas erkennt. */
const DUMMY_MS: [number, number] = [5000, 11000];
const AFTER_SUBMIT_MS: [number, number] = [800, 2200];

export function NightView({ game }: { game: GameState }) {
  if (game.phase.type !== 'night') return null;
  const { stepIndex, steps } = game.phase;
  return <NightStep key={`${game.round}-${stepIndex}`} game={game} step={steps[stepIndex]} first={stepIndex === 0} />;
}

function openLines(game: GameState, step: NightStepId): Line[] {
  switch (step) {
    case 'verkupplerin':
      return [line('verkupplerin_open')];
    case 'gruppenarbeit':
      return [line('gruppenarbeit_open')];
    case 'streber':
      return [line(game.round === 1 ? 'streber_open_first' : 'streber_open')];
    case 'vertrauensschueler':
      return [line('vertrauensschueler_open')];
    case 'klassensprecher':
      return [line('klassensprecher_open')];
    case 'lehrer': {
      const spicker = game.options.callAllRoles || game.deck.includes('spicker');
      return spicker ? [line('lehrer_open'), line('spicker_hint')] : [line('lehrer_open')];
    }
    case 'schuelersprecher':
      return [line('schuelersprecher_open')];
  }
}

const closeLine = (step: NightStepId): Line => line(`${step}_close`);

function NightStep({ game, step, first }: { game: GameState; step: NightStepId; first: boolean }) {
  const dispatch = useGame((s) => s.dispatch);
  const active = isStepActive(game, step);
  const [mode, setMode] = useState<'wait' | 'act'>('wait');
  const [submitted, setSubmitted] = useState<NightSubmitData | null>(null);

  useScript(async (ctx) => {
    if (first) {
      if (game.round === 1) {
        await ctx.say(line('revealDone'));
        await ctx.wait(2500);
      }
      await ctx.gong();
      await ctx.say(line('pauseStart'));
      sfx.startAmbience();
      await ctx.wait(2000);
    }
    sfx.startAmbience();
    await ctx.say(openLines(game, step));
    if (step === 'gruppenarbeit') {
      await ctx.wait(randomBetween(6000, 8000));
      await ctx.say(closeLine(step));
      dispatch({ type: 'NIGHT_SUBMIT', step });
      return;
    }
    if (active) {
      setMode('act');
      return;
    }
    await ctx.wait(randomBetween(...DUMMY_MS));
    await ctx.say(closeLine(step));
    dispatch({ type: 'NIGHT_SUBMIT', step });
  }, []);

  useScript(async (ctx) => {
    if (!submitted) return;
    setMode('wait');
    await ctx.wait(randomBetween(...AFTER_SUBMIT_MS));
    await ctx.say(closeLine(step));
    dispatch({ type: 'NIGHT_SUBMIT', step, data: submitted });
  }, [submitted]);

  if (mode === 'wait') return <NeutralScreen />;

  const submit = (data: NightSubmitData) => setSubmitted(data);
  switch (step) {
    case 'verkupplerin':
      return <VerkupplerinAction game={game} onSubmit={submit} />;
    case 'streber':
      return <StreberAction game={game} onSubmit={submit} />;
    case 'vertrauensschueler':
      return (
        <PickOne
          game={game}
          step={step}
          emoji={ROLES.vertrauensschueler.emoji}
          title="Vertrauensschüler"
          text="Wen beschützt du in dieser Pause?"
          disabledLabel="zuletzt geschützt"
          confirmLabel="Beschützen"
          onConfirm={(targetId) => submit({ targetId })}
        />
      );
    case 'klassensprecher':
      return <KlassensprecherAction game={game} onSubmit={submit} />;
    case 'lehrer':
      return (
        <PickOne
          game={game}
          step={step}
          emoji={ROLES.lehrer.emoji}
          title="Lehrerzimmer"
          text="Wen erwischt ihr? Einigt euch lautlos."
          confirmLabel="Erwischen!"
          onConfirm={(targetId) => submit({ targetId })}
        />
      );
    case 'schuelersprecher':
      return <SchuelersprecherAction game={game} onSubmit={submit} />;
    default:
      return <NeutralScreen />;
  }
}

// ---------------------------------------------------------------------------

function ConfirmBar({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick(): void }) {
  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-board via-board to-transparent pt-4">
      <button className="btn btn-primary w-full text-2xl" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

/** Alle Lebenden zeigen; nicht wählbare ausgegraut. */
function gridFor(game: GameState, step: NightStepId) {
  const valid = new Set(validTargets(game, step).map((p) => p.id));
  const all = alivePlayers(game);
  return { all, disabled: all.filter((p) => !valid.has(p.id)).map((p) => p.id) };
}

function PickOne(props: {
  game: GameState;
  step: NightStepId;
  emoji: string;
  title: string;
  text: string;
  confirmLabel: string;
  disabledLabel?: string;
  onConfirm(id: string): void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const { all, disabled } = gridFor(props.game, props.step);
  return (
    <div className="fade-in flex flex-1 flex-col">
      <StepHeader emoji={props.emoji} title={props.title}>
        {props.text}
      </StepHeader>
      <PlayerGrid
        players={all}
        disabled={disabled}
        disabledLabel={props.disabledLabel}
        selected={sel ? [sel] : []}
        onSelect={(id) => setSel(id === sel ? null : id)}
      />
      <ConfirmBar label={props.confirmLabel} disabled={!sel} onClick={() => sel && props.onConfirm(sel)} />
    </div>
  );
}

function VerkupplerinAction({ game, onSubmit }: { game: GameState; onSubmit(d: NightSubmitData): void }) {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : [s[1], id]));
  return (
    <div className="fade-in flex flex-1 flex-col">
      <StepHeader emoji={ROLES.verkupplerin.emoji} title="Gruppenarbeit">
        Wähle zwei Spieler (du darfst dich selbst wählen).
      </StepHeader>
      <PlayerGrid players={alivePlayers(game)} selected={sel} onSelect={toggle} />
      <ConfirmBar
        label={sel.length === 2 ? 'Gruppenarbeit bilden' : `Noch ${2 - sel.length} wählen`}
        disabled={sel.length !== 2}
        onClick={() => onSubmit({ pair: [sel[0], sel[1]] })}
      />
    </div>
  );
}

function StreberAction({ game, onSubmit }: { game: GameState; onSubmit(d: NightSubmitData): void }) {
  const model = getPlayer(game, game.streber.modelId);
  if (!model) {
    return (
      <PickOne
        game={game}
        step="streber"
        emoji={ROLES.streber.emoji}
        title="Dein Vorbild"
        text="Zu wem schaust du auf? Scheidet dein Vorbild aus, wirst du Lehrer."
        confirmLabel="Vorbild wählen"
        onConfirm={(modelId) => onSubmit({ modelId })}
      />
    );
  }
  const news = game.streber.switched && !game.streber.notified;
  return (
    <div className="fade-in flex flex-1 flex-col items-center justify-center gap-4 text-center">
      {game.streber.switched ? (
        <>
          <div className="text-7xl">{ROLES.lehrer.emoji}</div>
          <h2 className="chalk-title text-3xl">{news ? 'Dein Vorbild ist raus!' : 'Du bist Lehrer'}</h2>
          <p className="chalk max-w-xs text-2xl leading-snug">
            {news ? 'Du bist jetzt Lehrer. ' : ''}Bleib wach, wenn gleich die Lehrer aufgerufen werden, und erwische mit
            ihnen zusammen.
          </p>
        </>
      ) : (
        <>
          <Avatar name={model.name} playerId={model.id} size={130} />
          <p className="chalk max-w-xs text-2xl leading-snug">
            Dein Vorbild <b>{model.name}</b> ist noch dabei. Du bleibst im {CAMP_NAMES.schueler}.
          </p>
        </>
      )}
      <button className="btn btn-primary mt-4 w-full max-w-xs" onClick={() => onSubmit({})}>
        Verstanden
      </button>
    </div>
  );
}

function KlassensprecherAction({ game, onSubmit }: { game: GameState; onSubmit(d: NightSubmitData): void }) {
  const [target, setTarget] = useState<GamePlayer | null>(null);
  if (!target) {
    return (
      <PickOne
        game={game}
        step="klassensprecher"
        emoji={ROLES.klassensprecher.emoji}
        title="Klassensprecher"
        text="Wessen Rolle willst du sehen?"
        confirmLabel="Rolle ansehen"
        onConfirm={(id) => setTarget(getPlayer(game, id) ?? null)}
      />
    );
  }
  const seen = inspectRole(game, target);
  return (
    <div className="fade-in flex flex-1 flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={target.name} playerId={target.id} size={72} />
        <span className="chalk-title text-3xl">{target.name} ist …</span>
      </div>
      <div className="w-full">
        <RoleCard role={seen.role} camp={seen.camp} maxDvh={50} />
      </div>
      <div className="flex-1" />
      <button className="btn btn-primary w-full text-2xl" onClick={() => onSubmit({ targetId: target.id })}>
        Gemerkt
      </button>
    </div>
  );
}

function SchuelersprecherAction({ game, onSubmit }: { game: GameState; onSubmit(d: NightSubmitData): void }) {
  const { victimId, canSave, canBust } = schuelersprecherOptions(game);
  const victim = getPlayer(game, victimId);
  const [save, setSave] = useState(false);
  const [bustMode, setBustMode] = useState(false);
  const [bustId, setBustId] = useState<string | null>(null);

  if (bustMode) {
    const { all, disabled } = gridFor(game, 'schuelersprecher');
    return (
      <div className="fade-in flex flex-1 flex-col">
        <StepHeader emoji="⚡" title="Auffliegen lassen">
          Wen lässt du auffliegen? Das geht nur einmal im Spiel.
        </StepHeader>
        <PlayerGrid
          players={all}
          disabled={disabled}
          selected={bustId ? [bustId] : []}
          onSelect={(id) => setBustId(id === bustId ? null : id)}
        />
        <div className="sticky bottom-0 flex gap-3 bg-gradient-to-t from-board via-board to-transparent pt-4">
          <button
            className="btn btn-chalk flex-1"
            onClick={() => {
              setBustId(null);
              setBustMode(false);
            }}
          >
            Zurück
          </button>
          <button className="btn btn-primary flex-1" disabled={!bustId} onClick={() => setBustMode(false)}>
            Übernehmen
          </button>
        </div>
      </div>
    );
  }

  const bustTarget = getPlayer(game, bustId);
  return (
    <div className="fade-in flex flex-1 flex-col gap-4">
      <StepHeader emoji={ROLES.schuelersprecher.emoji} title="Schülersprecher" />
      <div className="card-chalk flex flex-col items-center gap-2 p-4 text-center">
        {victim ? (
          <>
            <div className="text-xl text-chalk-dim">Die Lehrer haben erwischt:</div>
            <Avatar name={victim.name} playerId={victim.id} size={110} />
            <div className="chalk-title text-3xl">{victim.name}</div>
          </>
        ) : (
          <div className="text-2xl">In dieser Pause haben die Lehrer niemanden erwischt.</div>
        )}
      </div>

      {victim && (
        <button
          className={`btn ${save ? 'btn-primary' : 'btn-chalk'}`}
          disabled={!canSave}
          onClick={() => setSave(!save)}
        >
          {canSave ? (save ? `✓ ${victim.name} wird gerettet` : `🛟 ${victim.name} retten (1×)`) : 'Rettung schon verbraucht'}
        </button>
      )}
      <button
        className={`btn ${bustTarget ? 'btn-danger' : 'btn-chalk'}`}
        disabled={!canBust}
        onClick={() => (bustTarget ? setBustId(null) : setBustMode(true))}
      >
        {canBust
          ? bustTarget
            ? `⚡ ${bustTarget.name} fliegt auf (antippen zum Aufheben)`
            : '⚡ Jemanden auffliegen lassen (1×)'
          : 'Auffliegen lassen schon verbraucht'}
      </button>

      <div className="flex-1" />
      <button className="btn btn-primary w-full text-2xl" onClick={() => onSubmit({ save, bustId })}>
        {save || bustTarget ? 'Fertig' : 'Nichts tun'}
      </button>
    </div>
  );
}
