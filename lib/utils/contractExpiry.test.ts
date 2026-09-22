import { describe, expect, it } from "vitest";
import { getContractExpiryWarning } from "./contractExpiry";

const today = new Date(2026, 8, 22, 14);

describe("getContractExpiryWarning", () => {
    it.each([
        ["2026-09-22", "under-3-months"],
        ["2026-12-21", "under-3-months"],
        ["2026-12-22", "under-6-months"],
        ["2027-03-21", "under-6-months"],
        ["2027-03-22", null],
        ["2027-04-01", null],
        ["2026-09-21", null],
        ["", null],
        ["invalid", null],
    ])("classifies expiry %s as %s", (expires, expected) => {
        expect(getContractExpiryWarning(expires, false, today)).toBe(expected);
    });

    it("never warns for contracts with no expiry", () => {
        expect(getContractExpiryWarning("2026-10-01", true, today)).toBeNull();
    });

    it("uses calendar months, including the last day of February", () => {
        const novemberEnd = new Date(2026, 10, 30);
        expect(getContractExpiryWarning("2027-02-27", false, novemberEnd)).toBe("under-3-months");
        expect(getContractExpiryWarning("2027-02-28", false, novemberEnd)).toBe("under-6-months");
    });
});
