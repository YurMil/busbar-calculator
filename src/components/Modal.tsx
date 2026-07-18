import {useEffect, useRef, type ReactNode} from 'react';
import {X} from 'lucide-react';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({open, title, onClose, children, footer, width = 480}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const target = focusables[0] ?? dialog;
      target.focus();
    };
    focusFirst();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{maxWidth: width}}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" aria-label="Close dialog" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
