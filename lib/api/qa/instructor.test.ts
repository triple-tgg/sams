import { describe, it, expect } from "vitest";
import { getValidityStatus, toDateInputValue, fromDateInputValue, todayDateValue } from "./instructor";

describe("getValidityStatus", () => {
    const today = "2026-11-11";

    it("is none when Valid To is not set", () => {
        expect(getValidityStatus(null, today)).toEqual({ state: "none" });
        expect(getValidityStatus(undefined, today)).toEqual({ state: "none" });
        expect(getValidityStatus("", today)).toEqual({ state: "none" });
        expect(getValidityStatus("0001-01-01T00:00:00", today)).toEqual({ state: "none" });
    });

    it("treats Valid To as the last valid day", () => {
        expect(getValidityStatus("2026-11-11T00:00:00", today)).toEqual({ state: "expiring", daysLeft: 0 });
        expect(getValidityStatus("2026-11-10T00:00:00", today)).toEqual({ state: "expired", daysAgo: 1 });
    });

    it("flags dates within the warning window as expiring", () => {
        expect(getValidityStatus("2026-12-11T00:00:00", today)).toEqual({ state: "expiring", daysLeft: 30 });
        expect(getValidityStatus("2026-12-12T00:00:00", today)).toEqual({ state: "valid", daysLeft: 31 });
    });

    it("uses the calendar date of a UTC timestamp, not the local time", () => {
        expect(getValidityStatus("2026-11-11T23:30:00Z", today)).toEqual({ state: "expiring", daysLeft: 0 });
    });

    it("counts across a year boundary", () => {
        expect(getValidityStatus("2027-01-05", "2026-12-31")).toEqual({ state: "expiring", daysLeft: 5 });
        expect(getValidityStatus("2025-12-31", "2026-01-02")).toEqual({ state: "expired", daysAgo: 2 });
    });
});

describe("date input helpers", () => {
    it("round-trips a date without a timezone shift", () => {
        expect(fromDateInputValue("2026-11-11")).toBe("2026-11-11T00:00:00");
        expect(toDateInputValue("2026-11-11T00:00:00")).toBe("2026-11-11");
        expect(fromDateInputValue("")).toBeNull();
    });

    it("formats today as local YYYY-MM-DD", () => {
        expect(todayDateValue(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    });
});
