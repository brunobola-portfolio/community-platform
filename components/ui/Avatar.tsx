import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  name: string;
  src?: string;
  /** Sizing and shape come from the caller, so one component serves every card. */
  className?: string;
  /** "dark" is the slate tile used on team cards; "brand" the default. */
  tone?: 'brand' | 'dark';
}

/** First letters of the first and last word, never more than two. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Photo with a local initials tile as fallback. It replaces a third-party
 * avatar service, which received every author and member name on each visit.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, src, className, tone = 'brand' }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && src !== failedSrc) {
    return <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} className={cn('object-cover', className)} />;
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        'flex select-none items-center justify-center font-serif font-bold',
        tone === 'dark' ? 'bg-slate-900 text-brand-400' : 'bg-brand-700 text-white',
        className,
      )}
    >
      <span aria-hidden="true" className="text-[1.1em]">{initialsOf(name)}</span>
    </div>
  );
};
