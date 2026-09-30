/**
 * Event dates are stored as text, usually without a timezone ("2026-12-01T21:00"):
 * the admin types the wall-clock time at the venue. `new Date()` reads such a
 * string as UTC on the server, which is an hour off in Portugal during summer
 * time, so registrations would close an hour early or late.
 */

/**
 * No timezone field exists in settings and every instance so far is Portuguese,
 * so the default lives here. Pass another IANA zone to `parseEventDate` when an
 * instance needs it.
 */
export const DEFAULT_TIMEZONE = "Europe/Lisbon";

const NAIVE_DATETIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

/** Offset of `timeZone` from UTC at the instant `at`, in milliseconds. */
function zoneOffset(at: number, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(new Date(at));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return asUtc - Math.floor(at / 1000) * 1000;
}

/**
 * Milliseconds since the epoch for an event date. A string with no offset is
 * read as wall-clock time in `timeZone`; one with "Z" or an explicit offset is
 * taken as written. NaN when the text is not a date at all.
 */
export function parseEventDate(date: string, timeZone: string = DEFAULT_TIMEZONE): number {
    const match = NAIVE_DATETIME.exec(date.trim());
    if (!match) return new Date(date).getTime();
    const [, y, mo, d, h = "0", mi = "0", s = "0"] = match;
    const wallClock = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    try {
        // The offset at the wall-clock instant can differ from the one at the result
        // across a DST change, so it is applied twice
        const first = wallClock - zoneOffset(wallClock, timeZone);
        return wallClock - zoneOffset(first, timeZone);
    } catch {
        return wallClock;
    }
}
