
/**
 * Atomic UI Components
 * 
 * This file contains the foundational UI building blocks for the application.
 * It uses Tailwind CSS for styling and `tailwind-merge` + `clsx` for intelligent class merging.
 * These components are designed to be reusable, accessible, and themable.
 */

import React from 'react';
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
// Implementation lives in ./Modal.tsx; re-exported so every consumer keeps
// importing dialogs from the atomic barrel
export { Modal, type ModalProps } from './Modal';
