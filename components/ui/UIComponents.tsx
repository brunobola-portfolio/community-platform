
/**
 * Atomic UI Components
 * 
 * This file contains the foundational UI building blocks for the application.
 * It uses Tailwind CSS for styling and `tailwind-merge` + `clsx` for intelligent class merging.
 * These components are designed to be reusable, accessible, and themable.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Re-export cn so existing consumers that import from UIComponents still work
export { cn };

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}
export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]";
  const variants = {
    default: "bg-brand-600 text-white hover:bg-brand-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_20px_rgba(223,61,50,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_30px_rgba(223,61,50,0.4)] border border-brand-500/50",
    outline: "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/50",
    ghost: "hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400",
    link: "text-brand-600 dark:text-brand-400 underline-offset-4 hover:underline",
    glass: "bg-slate-900/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:border-slate-900/20 dark:hover:border-white/20 shadow-2xl",
  };
  const sizes = {
    sm: "h-9 rounded-xl px-4 text-xs",
    md: "h-11 px-6 py-2",
    lg: "h-14 rounded-2xl px-10 text-base",
    icon: "h-11 w-11 rounded-2xl p-2",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
};

// --- Input Component ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/50 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-inner",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input";

// --- Card Components ---
// These allow for composable card structures (Card > CardHeader > CardContent)
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("rounded-[2rem] border border-slate-900/10 dark:border-white/10 bg-white dark:bg-dark-surface/50 backdrop-blur-md text-slate-800 dark:text-slate-100 shadow-2xl", className)} {...props} />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-8", className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn("font-serif text-3xl font-semibold leading-tight text-slate-900 dark:text-white", className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-8 pt-0", className)} {...props} />
);

// --- Badge Component ---
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
  color?: string;
}
export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', color, ...props }) => {
  const variants = {
    default: "border-brand-500/20 bg-brand-500/10 text-brand-700 dark:text-brand-400",
    outline: "border-slate-900/20 dark:border-white/20 bg-transparent text-slate-600 dark:text-slate-300 hover:border-brand-500/30 hover:text-brand-600 dark:hover:text-brand-400",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors backdrop-blur-md",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

// --- Modal / Dialog Component ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;

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
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => modal.querySelectorAll<HTMLElement>(focusableSelector);

    // Focus first focusable element
    const firstFocusable = getFocusable()[0];
    firstFocusable?.focus();

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    modal.addEventListener('keydown', handleKeyDown);
    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative w-full bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl transform transition-all duration-300 animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-900/5 dark:border-white/5 bg-slate-900/[0.02] dark:bg-white/[0.02]">
          <h3 id={titleId} className="text-2xl font-serif font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-3 rounded-2xl hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors border border-transparent hover:border-slate-900/10 dark:hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
