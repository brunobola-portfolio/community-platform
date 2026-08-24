import React from 'react';

interface LogoMarkProps {
  className?: string;
}

/**
 * Generic inline logo mark used when no logoUrl is configured: three
 * overlapping rings (community, culture, sport) drawn with currentColor so
 * the mark stays legible in both themes. Instances replace it by setting
 * Admin > Definições > URL do Logótipo (served from the brand overlay).
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="5"
    strokeLinecap="round"
    role="img"
    aria-label="Logótipo"
  >
    <circle cx="24" cy="26" r="14" />
    <circle cx="40" cy="26" r="14" />
    <circle cx="32" cy="40" r="14" />
  </svg>
);
