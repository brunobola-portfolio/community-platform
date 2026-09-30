import { describe, expect, it } from "vitest";
import { parseEventDate } from "../convex/lib/time";

describe("parseEventDate", () => {
    it("reads a naive summer time as Lisbon (UTC+1)", () => {
        expect(parseEventDate("2026-07-01T21:00")).toBe(Date.UTC(2026, 6, 1, 20, 0));
    });

    it("reads a naive winter time as Lisbon (UTC+0)", () => {
        expect(parseEventDate("2026-12-01T21:00")).toBe(Date.UTC(2026, 11, 1, 21, 0));
    });

    it("keeps an explicit offset as written", () => {
        expect(parseEventDate("2026-07-01T21:00:00Z")).toBe(Date.UTC(2026, 6, 1, 21, 0));
        expect(parseEventDate("2026-07-01T21:00:00+02:00")).toBe(Date.UTC(2026, 6, 1, 19, 0));
    });

    it("treats a date without time as local midnight", () => {
        expect(parseEventDate("2026-07-01")).toBe(Date.UTC(2026, 5, 30, 23, 0));
    });

    it("honours another timezone", () => {
        expect(parseEventDate("2026-07-01T21:00", "America/New_York")).toBe(Date.UTC(2026, 6, 2, 1, 0));
    });

    it("returns NaN for text that is not a date", () => {
        expect(Number.isNaN(parseEventDate("em breve"))).toBe(true);
    });
});
