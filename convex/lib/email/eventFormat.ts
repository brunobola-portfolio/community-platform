import { DEFAULT_TIMEZONE, parseEventDate } from "../time";

/**
 * Event dates as an email states them. The server runs in UTC, so every value
 * is read and written at the venue's clock, never with `new Date(text)`.
 */

const TWO_HOURS = 2 * 60 * 60 * 1000;

/** "Sábado, 25 de outubro às 15:00"; the time is left out for an all-day event. */
export function formatWhen(date: string, timeZone: string = DEFAULT_TIMEZONE): string {
    const at = parseEventDate(date, timeZone);
    if (Number.isNaN(at)) return date;
    const instant = new Date(at);
    const day = instant.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone });
    const time = instant.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone });
    const label = `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
    return time === "00:00" ? label : `${label} às ${time}`;
}

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** A Google Calendar link; empty when the date cannot be read. */
export function calendarLink(event: { title: string; date: string; location?: string }, url?: string): string | undefined {
    const start = parseEventDate(event.date);
    if (Number.isNaN(start)) return undefined;
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        dates: `${stamp(start)}/${stamp(start + TWO_HOURS)}`,
        details: url ?? "",
        location: event.location ?? "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
