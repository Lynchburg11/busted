import type { ReactNode } from 'react';
import { Avatar } from '../../components/Avatar';
import { CAMP_NAMES, ROLES } from '../../config/roles';
import type { Camp, RoleId } from '../../game/types';

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

export function RoleCard({ role, camp }: { role: RoleId; camp?: Camp }) {
  const r = ROLES[role];
  const c = camp ?? r.camp;
  return (
    <div className="paper flex min-h-72 flex-col items-center justify-center gap-2 text-center">
      <div className="text-8xl leading-none">{r.emoji}</div>
      <div className="font-marker text-4xl leading-tight">{r.name}</div>
      <div className={`rounded-full px-4 text-xl ${c === 'lehrer' ? 'bg-stamp/15 text-stamp' : 'bg-ink/10 text-ink'}`}>
        {CAMP_NAMES[c]}
      </div>
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
