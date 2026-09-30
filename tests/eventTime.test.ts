import { describe, expect, it } from 'vitest';
import { isEventPast, isEventUpcoming } from '../utils/eventTime';

const local = (h: number, m = 0) => new Date(2026, 5, 15, h, m, 0, 0);

describe('isEventUpcoming', () => {
    it('treats an event earlier today as past', () => {
        expect(isEventUpcoming(local(10).toISOString(), local(18))).toBe(false);
        expect(isEventPast(local(10).toISOString(), local(18))).toBe(true);
    });

    it('treats an event later today as upcoming', () => {
        expect(isEventUpcoming(local(21).toISOString(), local(18))).toBe(true);
        expect(isEventPast(local(21).toISOString(), local(18))).toBe(false);
    });

    it('keeps a date-only event upcoming until the day ends', () => {
        expect(isEventUpcoming(local(0).toISOString(), local(18))).toBe(true);
        expect(isEventUpcoming(local(0).toISOString(), new Date(2026, 5, 16, 0, 1))).toBe(false);
    });

    it('never reports an invalid date as upcoming or past', () => {
        expect(isEventUpcoming('not a date')).toBe(false);
        expect(isEventPast('not a date')).toBe(false);
    });
});
