import React, { useId } from 'react';
import { LABEL_CLASS } from '../constants';

interface FieldProps {
    label: string;
    /** Short helper line under the control. */
    hint?: string;
    className?: string;
    /** A single form control; it receives the generated id and aria wiring. */
    children: React.ReactElement<{ id?: string; required?: boolean; 'aria-describedby'?: string; 'aria-required'?: boolean }>;
}

/**
 * Label + control pair for the backoffice. Generates the id so the label is
 * clickable and announced, and marks required controls visually, which the
 * bare label/input siblings never did.
 */
export const Field: React.FC<FieldProps> = ({ label, hint, className, children }) => {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const required = Boolean(children.props.required);
    return (
        <div className={className}>
            <label htmlFor={id} className={LABEL_CLASS}>
                {label}
                {required && <span aria-hidden="true" className="ml-1 text-brand-400">*</span>}
            </label>
            {React.cloneElement(children, { id, 'aria-describedby': hintId, 'aria-required': required || undefined })}
            {hint && <p id={hintId} className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    );
};
