/**
 * Registrations as a spreadsheet: the list at the door, the teams for the
 * draw, the phone numbers for the day-before reminder.
 *
 * Portuguese Excel opens CSV with ";" as the separator and needs a UTF-8 byte
 * order mark to show "ç" and "ã" instead of mojibake, so both are written.
 */

export interface CsvRegistration {
    name?: string;
    email?: string;
    phone?: string;
    status: string;
    timestamp?: number;
    customData?: Record<string, string | number | boolean>;
    eventTitle?: string;
}

export interface CsvField {
    id: string;
    label: string;
}

const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', confirmed: 'Confirmada', cancelled: 'Cancelada' };

export function csvCell(value: unknown): string {
    const text = value === undefined || value === null ? '' : String(value);
    // A leading = + - @ turns a cell into a formula in Excel; a quote defuses it
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function registrationsCsv(rows: CsvRegistration[], fields: CsvField[] = [], withEvent = false): string {
    const header = [
        ...(withEvent ? ['Evento'] : []),
        'Nome', 'Email', 'Telemóvel', 'Estado', 'Inscrito em',
        ...fields.map((f) => f.label),
    ];
    const lines = rows.map((r) => [
        ...(withEvent ? [r.eventTitle ?? ''] : []),
        r.name ?? '',
        r.email ?? '',
        r.phone ?? '',
        STATUS_LABELS[r.status] ?? r.status,
        r.timestamp ? new Date(r.timestamp).toLocaleString('pt-PT') : '',
        ...fields.map((f) => r.customData?.[f.id] ?? ''),
    ]);
    return `\uFEFF${[header, ...lines].map((line) => line.map(csvCell).join(';')).join('\r\n')}\r\n`;
}

/** File name that sorts by date and says what it holds. */
export function csvFileName(eventSlug: string | undefined, now: Date = new Date()): string {
    const day = now.toISOString().slice(0, 10);
    return `inscricoes-${eventSlug || 'todos-os-eventos'}-${day}.csv`;
}

export function downloadCsv(content: string, fileName: string): void {
    const href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
}
