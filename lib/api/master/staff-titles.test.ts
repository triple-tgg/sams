import { describe, expect, it } from "vitest";
import { resolveStaffTitleId, sortActiveTitles, staffTitleText, type StaffTitle } from "./staff-titles";

const mr: StaffTitle = { id: 1, nameEn: "Mr.", nameTh: "นาย", sortOrder: 10 };
const ms: StaffTitle = { id: 4, nameEn: "Ms.", nameTh: "นางสาว", sortOrder: 40 };
const mrs: StaffTitle = { id: 2, nameEn: "Mrs.", nameTh: "นาง", sortOrder: 20 };

describe("resolveStaffTitleId with Miss and Ms. sharing a Thai name (staging master)", () => {
    const miss: StaffTitle = { id: 3, nameEn: "Miss", nameTh: "นางสาว", sortOrder: 30 };
    const dr: StaffTitle = { id: 5, nameEn: "Dr.", nameTh: "ดร.", sortOrder: 50 };
    const titles = [mr, mrs, miss, ms, dr];
    it("prefers the exact English name", () => {
        expect(resolveStaffTitleId("Ms.", titles)).toBe(4);
        expect(resolveStaffTitleId("Miss", titles)).toBe(3);
        expect(resolveStaffTitleId("Mrs", titles)).toBe(2);
        expect(resolveStaffTitleId("Dr.", titles)).toBe(5);
        expect(resolveStaffTitleId("ดร.", titles)).toBe(5);
    });
    it("takes the first by sortOrder for a shared Thai name", () => {
        expect(resolveStaffTitleId("นางสาว", titles)).toBe(3);
    });
});

describe("sortActiveTitles", () => {
    it("drops deleted titles and orders by sortOrder", () => {
        expect(sortActiveTitles([ms, { ...mrs, isdelete: true }, mr]).map((t) => t.id)).toEqual([1, 4]);
    });
});

describe("resolveStaffTitleId", () => {
    const titles = [mr, mrs, ms];
    it("matches English, Thai and common spellings", () => {
        expect(resolveStaffTitleId("Mr.", titles)).toBe(1);
        expect(resolveStaffTitleId("mr", titles)).toBe(1);
        expect(resolveStaffTitleId("นาง", titles)).toBe(2);
        expect(resolveStaffTitleId("Miss", titles)).toBe(4);
        expect(resolveStaffTitleId("น.ส.", titles)).toBe(4);
    });
    it("returns 0 when nothing matches", () => {
        expect(resolveStaffTitleId("Capt.", titles)).toBe(0);
        expect(resolveStaffTitleId("", titles)).toBe(0);
    });
});

describe("staffTitleText", () => {
    it("prefers titleObj and falls back to the legacy title", () => {
        expect(staffTitleText({ titleObj: mr, title: "x" })).toBe("Mr.");
        expect(staffTitleText({ title: "Dr." })).toBe("Dr.");
        expect(staffTitleText(null)).toBe("");
    });
});
