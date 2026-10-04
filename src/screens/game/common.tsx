import { useState, type ReactNode } from 'react';
import { Avatar } from '../../components/Avatar';
import { CAMP_NAMES, ROLES } from '../../config/roles';
import type { Camp, RoleId } from '../../game/types';
import { CARD_RATIO, LOGO_URL, cardUrl } from '../../lib/assets';

/** Neutraler Bildschirm während der Pause – verrät nichts. */
export function NeutralScreen({ text = 'Augen zu …' }: { text?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="pulse-soft text-7xl">😴</div>
      <div className="chalk-title text-3xl opacity-80">{text}</div>
      <div className="text-lg text-chalk-dim">Pause – Köpfe auf den Tisch</div>
    </div>
  );
}

/** Platz für eine Karte: so groß wie möglich, aber nie breiter als der Bildschirm. */
export function CardFrame({ children, maxDvh = 56 }: { children: ReactNode; maxDvh?: number }) {
  return (
    <div
      className="relative mx-auto"
      style={{ height: `min(${maxDvh}dvh, calc((100vw - 40px) / ${CARD_RATIO}))`, aspectRatio: `${CARD_RATIO}` }}
    >
      {children}
    </div>
  );
}

function CampChip({ camp }: { camp: Camp }) {
  return (
    <span
      className={`rounded-full px-4 py-0.5 text-lg font-bold ${camp === 'lehrer' ? 'bg-stamp text-white' : 'bg-chalk-blue text-ink'}`}
    >
      {CAMP_NAMES[camp]}
    </span>
  );
}

/** Rollenkarte (Bild aus public/cards) mit Lager; Emoji-Karte als Ersatz, falls das Bild fehlt. */
export function RoleCard({ role, camp, maxDvh }: { role: RoleId; camp?: Camp; maxDvh?: number }) {
  const r = ROLES[role];
  const c = camp ?? r.camp;
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <CardFrame maxDvh={maxDvh}>
        {broken ? (
          <div className="paper flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="text-8xl leading-none">{r.emoji}</div>
            <div className="font-marker text-3xl leading-tight">{r.name}</div>
          </div>
        ) : (
          <img
            src={cardUrl(role)}
            alt={r.name}
            draggable={false}
            onError={() => setBroken(true)}
            className="h-full w-full object-contain drop-shadow-[0_10px_20px_rgb(0_0_0/0.5)]"
          />
        )}
      </CardFrame>
      <CampChip camp={c} />
    </div>
  );
}

/** Kartenrückseite (verdeckt). */
export function CardBack({ maxDvh, children }: { maxDvh?: number; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <CardFrame maxDvh={maxDvh}>
        <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[6%] border-[6px] border-paper bg-board p-4 text-center shadow-[0_10px_20px_rgb(0_0_0/0.5)]">
          <img src={LOGO_URL} alt="" draggable={false} className="w-full" />
          {children}
        </div>
      </CardFrame>
      <span className="invisible px-4 py-0.5 text-lg">Lager</span>
    </div>
  );
}

export function PassPhone({ id, name, label, onReady, hint }: { id: string; name: string; label?: string; onReady(): void; hint?: string }) {
  return (
    <div className="fade-in flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <div className="chalk text-2xl text-chalk-dim">{label ?? 'Gib das Handy an'}</div>
      <Avatar name={name} playerId={id} size={170} className="border-4" />
      <div className="chalk-title text-5xl">{name}</div>
      {hint && <p className="max-w-xs text-lg text-chalk-dim">{hint}</p>}
      <button className="btn btn-primary mt-2 w-full max-w-xs text-2xl" onClick={onReady}>
        Ich bin {name}
      </button>
    </div>
  );
}

/** Kopfzeile für eine Pausenaktion. */
export function StepHeader({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 text-center">
      <div className="text-5xl">{emoji}</div>
      <h2 className="chalk-title text-3xl">{title}</h2>
      {children && <p className="chalk mt-1 text-xl leading-snug">{children}</p>}
    </div>
  );
}
