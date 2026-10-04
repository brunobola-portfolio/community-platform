import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HELP_PARAM } from '../../../content/help';

/**
 * `?ajuda` on /admin: present (even empty) means the help tab is open, its value
 * is the tutorial being read. Replace, not push, so Back leaves the backoffice
 * instead of stepping through every guide opened.
 */
export function useHelpParam() {
    const [params, setParams] = useSearchParams();
    const isOpen = params.has(HELP_PARAM);
    const id = params.get(HELP_PARAM) || null;

    const set = useCallback((next: string | null) => {
        setParams(prev => {
            const copy = new URLSearchParams(prev);
            if (next === null) copy.delete(HELP_PARAM);
            else copy.set(HELP_PARAM, next);
            return copy;
        }, { replace: true });
    }, [setParams]);

    return { isOpen, id, set };
}
