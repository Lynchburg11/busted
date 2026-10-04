import { useState, type ReactNode } from 'react';

interface Props {
  hidden: ReactNode;
  revealed: ReactNode;
  onFirstReveal?(): void;
}

/** Gedrückt halten zeigt den Inhalt, Loslassen verdeckt ihn wieder. */
export function HoldToReveal({ hidden, revealed, onFirstReveal }: Props) {
  const [open, setOpen] = useState(false);
  const show = () => {
    setOpen(true);
    onFirstReveal?.();
  };
  const hide = () => setOpen(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={open}
      onPointerDown={(e) => {
        e.preventDefault();
        show();
      }}
      onPointerUp={hide}
      onPointerCancel={hide}
      onPointerLeave={hide}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && show()}
      onKeyUp={hide}
      className="w-full touch-none select-none"
    >
      {open ? revealed : hidden}
    </div>
  );
}
