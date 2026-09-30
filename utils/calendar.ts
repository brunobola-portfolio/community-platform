/**
 * "Add to calendar" for an event, as a file and as a Google Calendar link.
 *
 * The file follows RFC 5545 closely enough for the strict readers: UID and
 * DTSTAMP are mandatory (Outlook refuses the file without them), text values
 * escape commas, semicolons and newlines, and lines end in CRLF.
 */

export interface CalendarEvent {
    title: string;
    date: string;
    location?: string;
    description?: string;
    slug: string;
    url?: string;
}

/** Events carry no end time; two hours is what an evening event usually takes. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** A record with a bad date must hide the button, not throw from toISOString. */
export const canAddToCalendar = (event: Pick<CalendarEvent, 'date'>): boolean => !Number.isNaN(new Date(event.date).getTime());

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

export function icsContent(event: CalendarEvent, now: Date = new Date()): string {
    if (!canAddToCalendar(event)) return '';
    const start = new Date(event.date);
    const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Community Platform//Agenda//PT',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${event.slug}@community-platform`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${escapeIcsText(event.title)}`,
        event.location ? `LOCATION:${escapeIcsText(event.location)}` : '',
        event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : '',
        event.url ? `URL:${event.url.replace(/[\r\n]/g, '')}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean);
    return `${lines.join('\r\n')}\r\n`;
}

export function googleCalendarUrl(event: CalendarEvent): string {
    if (!canAddToCalendar(event)) return '';
    const start = new Date(event.date);
    const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${stamp(start)}/${stamp(end)}`,
        details: [event.description, event.url].filter(Boolean).join('\n\n'),
        location: event.location ?? '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Saves the .ics file; phones hand it to their calendar app. */
export function downloadIcs(event: CalendarEvent): void {
    if (!canAddToCalendar(event)) return;
    const blob = new Blob([icsContent(event)], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${event.slug}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
}
