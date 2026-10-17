import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { cn } from '../../../utils/cn';

interface SaveBarProps {
    onSave: () => void;
    isSaving: boolean;
    /** Something differs from what is saved: say so, so nobody leaves thinking it is live. */
    dirty?: boolean;
    /** Shown while dirty: puts the form back to what is saved. */
    onDiscard?: () => void;
}

/**
 * The bar pinned to the bottom of the settings pages. On a phone the note and
 * the button stack, so the button keeps one line instead of wrapping its label.
 */
export const SaveBar: React.FC<SaveBarProps> = ({ onSave, isSaving, dirty, onDiscard }) => (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-white/10 bg-dark-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:p-4">
        <span className={cn('flex items-center gap-2 text-xs', dirty ? 'font-semibold text-amber-300' : 'text-slate-400')} aria-live="polite">
            {dirty && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />}
            {dirty ? 'Tem alterações por guardar.' : 'As alterações só ficam no portal depois de guardar.'}
        </span>
        {dirty && onDiscard && (
            <Button variant="ghost" onClick={onDiscard} disabled={isSaving} className="w-full whitespace-nowrap sm:w-auto">Descartar</Button>
        )}
        <Button onClick={onSave} disabled={isSaving} className="w-full whitespace-nowrap sm:w-auto sm:min-w-[170px]">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Guardar alterações</>}
        </Button>
    </div>
);
