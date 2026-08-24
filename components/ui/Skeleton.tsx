import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("animate-pulse rounded-xl bg-slate-300/70 dark:bg-slate-700/50", className)} />
);

// Composite skeletons for common patterns
export const EventCardSkeleton: React.FC = () => (
  <div className="rounded-2xl bg-slate-900/5 dark:bg-white/5 backdrop-blur-sm border border-slate-900/10 dark:border-white/10 overflow-hidden">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

export const PostCardSkeleton: React.FC = () => (
  <div className="rounded-2xl bg-slate-900/5 dark:bg-white/5 backdrop-blur-sm border border-slate-900/10 dark:border-white/10 overflow-hidden">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-6 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

export const GalleryCardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl overflow-hidden bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10">
    <div className="aspect-square bg-slate-900/10 dark:bg-white/10" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-slate-900/10 dark:bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-slate-900/10 dark:bg-white/10 rounded w-1/2" />
    </div>
  </div>
);

export const MemberCardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl overflow-hidden bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 p-6 text-center">
    <div className="w-24 h-24 rounded-full bg-slate-900/10 dark:bg-white/10 mx-auto mb-4" />
    <div className="h-4 bg-slate-900/10 dark:bg-white/10 rounded w-2/3 mx-auto mb-2" />
    <div className="h-3 bg-slate-900/10 dark:bg-white/10 rounded w-1/2 mx-auto" />
  </div>
);

export const DocumentRowSkeleton: React.FC = () => (
  <div className="animate-pulse flex items-center gap-4 p-4 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl">
    <div className="w-10 h-10 rounded-lg bg-slate-900/10 dark:bg-white/10 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-900/10 dark:bg-white/10 rounded w-1/2" />
      <div className="h-3 bg-slate-900/10 dark:bg-white/10 rounded w-1/3" />
    </div>
    <div className="w-20 h-8 rounded-lg bg-slate-900/10 dark:bg-white/10" />
  </div>
);
