import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './UIComponents';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/** Shared empty state for lists and dialogs; themed for light and dark. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/5 ring-1 ring-slate-900/10 dark:bg-white/5 dark:ring-white/10">
      <Icon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="mb-2 font-serif text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
    {description && (
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    )}
    {action && (
      <Button variant="outline" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);
