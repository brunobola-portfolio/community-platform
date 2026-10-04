import React from 'react';
import { boldSegments } from '../../content/help/format';
import { fillTokens } from '../../content/help';
import { cn } from '../../utils/cn';

interface HelpTextProps {
    text: string;
    siteName: string;
    /** Classes for the bold button names; defaults to the reading colour. */
    boldClassName?: string;
}

/** Guide copy with {siteName} filled and **button names** in bold. */
export const HelpText: React.FC<HelpTextProps> = ({ text, siteName, boldClassName }) => (
    <>
        {boldSegments(fillTokens(text, { siteName })).map((segment, i) =>
            segment.bold
                ? <strong key={i} className={cn('font-semibold text-slate-900 dark:text-white', boldClassName)}>{segment.text}</strong>
                : <React.Fragment key={i}>{segment.text}</React.Fragment>,
        )}
    </>
);
