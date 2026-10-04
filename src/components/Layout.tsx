import type { ReactNode } from 'react';

interface Props {
  title: string;
  onBack?(): void;
  children: ReactNode;
  footer?: ReactNode;
  right?: ReactNode;
}

/** Standard-Bildschirm: Kopfzeile, scrollbarer Inhalt, fixierter Fuß. */
export function Page({ title, onBack, children, footer, right }: Props) {
  return (
    <div className="safe mx-auto flex h-full max-w-lg flex-col">
      <header className="flex items-center gap-3 pb-3">
        {onBack && (
          <button className="icon-btn" aria-label="Zurück" onClick={onBack}>
            ←
          </button>
        )}
        <h1 className="chalk-title flex-1 truncate text-3xl">{title}</h1>
        {right}
      </header>
      <div className="chalk-line mb-4 opacity-60" />
      <main className="-mx-1 flex-1 overflow-y-auto px-1 pb-4">{children}</main>
      {footer && <footer className="pt-3">{footer}</footer>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange(v: boolean): void; label: string; hint?: string }) {
  return (
    <label className="flex items-center gap-4 py-3">
      <span className="flex-1">
        <span className="block text-xl">{label}</span>
        {hint && <span className="block text-base leading-snug text-chalk-dim">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} className="toggle" onClick={() => onChange(!checked)} />
    </label>
  );
}

export function Stepper({ value, min, max, onChange, format }: { value: number; min: number; max: number; onChange(v: number): void; format?(v: number): string }) {
  return (
    <div className="flex items-center gap-3">
      <button className="icon-btn" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="weniger">
        −
      </button>
      <span className="chalk-title min-w-16 text-center text-2xl">{format ? format(value) : value}</span>
      <button className="icon-btn" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="mehr">
        +
      </button>
    </div>
  );
}
