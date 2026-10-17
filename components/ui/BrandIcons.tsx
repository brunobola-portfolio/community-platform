import React from 'react';

/**
 * Brand marks lucide-react dropped in 1.0, drawn with the same 24px grid and
 * 2px stroke as the rest of the icon set so they sit next to it unchanged.
 */

interface BrandIconProps {
    size?: number;
    className?: string;
}

const Svg: React.FC<BrandIconProps & { children: React.ReactNode }> = ({ size = 24, className, children }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {children}
    </svg>
);

export const Facebook: React.FC<BrandIconProps> = props => (
    <Svg {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></Svg>
);

export const Instagram: React.FC<BrandIconProps> = props => (
    <Svg {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Svg>
);
