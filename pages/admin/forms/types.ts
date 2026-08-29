/**
 * Shared prop shapes for the entity forms rendered inside AdminFormModal.
 */

export interface FieldHelpers {
    str: (key: string, fallback?: string) => string;
    setField: (key: string, value: unknown) => void;
}

export interface NumHelper {
    num: (key: string, fallback?: number) => number;
}
