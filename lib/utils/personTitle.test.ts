import { describe, it, expect } from "vitest";
import { formatEnglishName, formatThaiName, toThaiTitle, toEnglishTitle } from "./personTitle";

describe("personTitle", () => {
    it("maps titles between languages", () => {
        expect(toThaiTitle("Mr.")).toBe("นาย");
        expect(toThaiTitle("Ms")).toBe("นางสาว");
        expect(toThaiTitle("Mrs.")).toBe("นาง");
        expect(toEnglishTitle("นาย")).toBe("Mr.");
        expect(toEnglishTitle("Miss")).toBe("Ms.");
    });

    it("puts the Thai title on the Thai name", () => {
        expect(formatThaiName("Mr.", "สัณห์มนัส เรืองศรี")).toBe("นายสัณห์มนัส เรืองศรี");
        expect(formatThaiName("นาย", "นายเดชา ใจดี")).toBe("นายเดชา ใจดี");
    });

    it("puts the English title on the English name without doubling it", () => {
        expect(formatEnglishName("Mr.", "Sanmanas Ruangsri")).toBe("Mr. Sanmanas Ruangsri");
        expect(formatEnglishName("นาย", "Mr. Decha Jaidee")).toBe("Mr. Decha Jaidee");
    });

    it("leaves a Thai name that only looks like it starts with a title", () => {
        expect(formatThaiName("Ms.", "นางนวล สุขใจ")).toBe("นางสาวนางนวล สุขใจ");
    });

    it("handles missing values", () => {
        expect(formatThaiName(null, "สมชาย")).toBe("สมชาย");
        expect(formatEnglishName("Mr.", null)).toBe("");
        expect(formatEnglishName("Capt", "John")).toBe("Capt. John");
    });
});
