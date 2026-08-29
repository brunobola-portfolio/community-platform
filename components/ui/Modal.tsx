/**
 * Modal / Dialog
 *
 * The single dialog shell of the portal: header (icon, eyebrow, title,
 * description), scrollable body and an optional sticky action bar. Callers pass
 * content through the slots instead of rebuilding chrome, so every dialog keeps
 * the same rhythm, radius and focus behaviour.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Small uppercase label above the title */
  eyebrow?: string;
  /** One-line purpose statement; replaces the ad-hoc info banners in bodies */
  description?: string;
  /** Icon element for the branded chip left of the title */
  icon?: React.ReactNode;
  /** Sticky action bar pinned under the body */
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  description,
  icon,
  footer,
  children,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const baseId = useRef(`modal-${Math.random().toString(36).slice(2, 9)}`).current;
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  // Callers pass inline arrows for onClose; keeping it out of the effect deps
  // stops the focus trap from re-running (and stealing focus to the close
  // button) on every keystroke inside modal forms
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Focus trap, Escape key, and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const previousFocus = document.activeElement as HTMLElement;
    const getFocusable = () => modal.querySelectorAll<HTMLElement>(FOCUSABLE);

    // Prefer the first control of the body (usually a form field) over the
    // close button, so opening a dialog lands where the user has to act
    const firstInBody = bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstInBody ?? getFocusable()[0] ?? modal).focus();

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Multi-step dialogs unmount the focused control between steps, which
      // drops focus on <body>; the next Tab pulls it back into the dialog
      if (!modal.contains(active)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    // Bound to the document so Escape still closes after focus escapes the
    // dialog (step changes, clicks on the backdrop)
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_40px_100px_-24px_rgba(2,6,23,0.55)] ring-1 ring-slate-900/10 animate-fade-in-up sm:rounded-[1.75rem] dark:bg-dark-surface dark:ring-white/10 focus:outline-none',
          SIZE_CLASSES[size],
        )}
      >
        <header className="relative shrink-0 border-b border-slate-900/[0.06] px-6 pb-5 pt-6 sm:px-7 sm:pt-7 dark:border-white/[0.06]">
          <span
            className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-4">
            {icon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 ring-1 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-400 dark:ring-brand-500/25">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              {eyebrow && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2
                  id={titleId}
                  className="font-serif text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl dark:text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
              className="-mr-1 -mt-1 shrink-0 rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div
          ref={bodyRef}
          className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 sm:px-7"
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-900/[0.06] bg-slate-50/70 px-6 py-4 sm:px-7 dark:border-white/[0.06] dark:bg-white/[0.02]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
