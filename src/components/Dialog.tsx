import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Abbrechen', danger, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onCancel}>
      <div className="paper-plain fade-in w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 font-marker text-2xl">{title}</h2>
        {children && <div className="mb-5 text-lg leading-snug">{children}</div>}
        <div className="flex flex-col gap-3">
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn border-2 border-ink/40 text-ink" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, children, onClose }: { open: boolean; children: ReactNode; onClose(): void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="fade-in max-h-[95dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-board p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
