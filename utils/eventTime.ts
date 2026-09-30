/**
 * One definition of "upcoming" for every public list. Comparing the event's own
 * instant in local time means an event at 10:00 is past at 18:00 on the same
 * day; comparing against midnight (or a UTC date string) keeps it "next" until
 * the day ends and disagrees with the registration gate.
 */

/**
 * An event saved without a time lands on local midnight. It has no hour to
 * expire at, so it stays upcoming until the end of that day.
 */
function effectiveEnd(start: Date): number {
    const allDay = start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0;
    if (!allDay) return start.getTime();
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return end.getTime();
}

/** False for an unparseable date, so a bad record never shows as "next". */
export function isEventUpcoming(iso: string, now: Date = new Date()): boolean {
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return false;
    return effectiveEnd(start) >= now.getTime();
}

export function isEventPast(iso: string, now: Date = new Date()): boolean {
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return false;
    return !isEventUpcoming(iso, now);
}
