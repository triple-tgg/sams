import { describe, it, expect } from "vitest";
import {
    parseContentDispositionFilename,
    AIRCRAFT_SCHED_MAPPING_TEMPLATE_FILENAME as FALLBACK,
} from "./aircraftSchedMappingTemplate";

describe("parseContentDispositionFilename", () => {
    // The exact header this endpoint returns.
    it("reads the name the template endpoint sends", () => {
        const header =
            `attachment; filename="Aircraft Sched-Mapping.xlsx"; ` +
            `filename*=UTF-8''Aircraft%20Sched-Mapping.xlsx`;
        expect(parseContentDispositionFilename(header, FALLBACK)).toBe(
            "Aircraft Sched-Mapping.xlsx"
        );
    });

    it("prefers the encoded form so non-ASCII names survive", () => {
        const header = `attachment; filename="template.xlsx"; filename*=UTF-8''%E0%B9%81%E0%B8%9A%E0%B8%9A.xlsx`;
        expect(parseContentDispositionFilename(header, FALLBACK)).toBe("แบบ.xlsx");
    });

    it("falls back to the plain quoted name when there is no encoded form", () => {
        expect(
            parseContentDispositionFilename('attachment; filename="report.xlsx"', FALLBACK)
        ).toBe("report.xlsx");
    });

    it("accepts an unquoted name", () => {
        expect(
            parseContentDispositionFilename("attachment; filename=report.xlsx", FALLBACK)
        ).toBe("report.xlsx");
    });

    it("falls back on malformed percent-encoding rather than throwing", () => {
        const header = `attachment; filename="good.xlsx"; filename*=UTF-8''%E0%A4%A`;
        expect(parseContentDispositionFilename(header, FALLBACK)).toBe("good.xlsx");
    });

    // CORS hides this header unless the API exposes it, so the absent case is
    // the one that actually runs in the browser today.
    it("uses the fallback when the header is missing", () => {
        expect(parseContentDispositionFilename(undefined, FALLBACK)).toBe(FALLBACK);
        expect(parseContentDispositionFilename(null, FALLBACK)).toBe(FALLBACK);
        expect(parseContentDispositionFilename("", FALLBACK)).toBe(FALLBACK);
        expect(parseContentDispositionFilename("attachment", FALLBACK)).toBe(FALLBACK);
    });
});
