import { useCallback, useEffect, useState } from 'react';
import { parseDone, progressKey, toggleDone } from '../../content/help/progress';

function read(id: string, stepCount: number): number[] {
    try {
        return parseDone(window.localStorage.getItem(progressKey(id)), stepCount);
    } catch {
        // Private windows and blocked site data throw on access: the ticks then live only in memory
        return [];
    }
}

function write(id: string, done: number[]): void {
    try {
        if (done.length) window.localStorage.setItem(progressKey(id), JSON.stringify(done));
        else window.localStorage.removeItem(progressKey(id));
    } catch {
        // Same as above: losing the ticks on reload is acceptable, breaking the guide is not
    }
}

/** Which steps of a guide the reader ticked as "Feito", remembered per browser. */
export function useStepProgress(id: string, stepCount: number) {
    const [done, setDone] = useState<number[]>(() => read(id, stepCount));

    useEffect(() => { setDone(read(id, stepCount)); }, [id, stepCount]);

    const toggle = useCallback((index: number) => {
        setDone(prev => {
            const next = toggleDone(prev, index);
            write(id, next);
            return next;
        });
    }, [id]);

    const reset = useCallback(() => { write(id, []); setDone([]); }, [id]);

    return { done, toggle, reset };
}
