import { describe, it, expect } from "vitest";
import {
  splitGroupedAircraftLicenseText,
  findMatchingCombination,
  parseAndSplitAircraftLicense,
  computeRowAircraftLicenseDisplay,
} from "./aircraftLicenseSplitter";
import type { AircraftEngineCombination } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

const mockCombinations: AircraftEngineCombination[] = [
  {
    id: 1,
    familyCode: "B777",
    series: "200",
    engineCode: "GE90",
    displayLabel: "B777-200 (GE90)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    familyCode: "B777",
    series: "300",
    engineCode: "GE90",
    displayLabel: "B777-300 (GE90)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    familyCode: "A330",
    series: "300",
    engineCode: "PW4000",
    displayLabel: "A330-300 (PW4000)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 4,
    familyCode: "A330",
    series: "300",
    engineCode: "TRENT700",
    displayLabel: "A330-300 (TRENT700)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 10,
    familyCode: "B737",
    series: "600",
    engineCode: "CFM56",
    displayLabel: "B737-600 (CFM56)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 11,
    familyCode: "B737",
    series: "700",
    engineCode: "CFM56",
    displayLabel: "B737-700 (CFM56)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 12,
    familyCode: "B737",
    series: "800",
    engineCode: "CFM56",
    displayLabel: "B737-800 (CFM56)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 13,
    familyCode: "B737",
    series: "900",
    engineCode: "CFM56",
    displayLabel: "B737-900 (CFM56)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 14,
    familyCode: "B737",
    series: "7",
    engineCode: "LEAP1B",
    displayLabel: "B737-7 (LEAP-1B)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 15,
    familyCode: "B737",
    series: "8",
    engineCode: "LEAP1B",
    displayLabel: "B737-8 (LEAP-1B)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 16,
    familyCode: "B737",
    series: "9",
    engineCode: "LEAP1B",
    displayLabel: "B737-9 (LEAP-1B)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 20,
    familyCode: "Cessna",
    series: "150",
    engineCode: "O200",
    displayLabel: "Cessna-150",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 21,
    familyCode: "SOCATA",
    series: "TB-9",
    engineCode: "O320",
    displayLabel: "SOCATA TB-9",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 30,
    familyCode: "A319",
    series: "",
    engineCode: "V2500",
    displayLabel: "A319 (V2500)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 31,
    familyCode: "A320",
    series: "",
    engineCode: "V2500",
    displayLabel: "A320 (V2500)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
  {
    id: 32,
    familyCode: "A321",
    series: "",
    engineCode: "V2500",
    displayLabel: "A321 (V2500)",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: null,
    updatedBy: "test",
    updatedAtUtc: "2026-01-01T00:00:00Z",
  },
];

describe("splitGroupedAircraftLicenseText", () => {
  it("splits B777-200/300 into 2 series", () => {
    const units = splitGroupedAircraftLicenseText("B777-200/300");
    expect(units.map((u) => u.label)).toEqual(["B777-200", "B777-300"]);
  });

  it("splits A330-300 (PW4164/4168/RR-TRENT70) into 3 engines", () => {
    const units = splitGroupedAircraftLicenseText(
      "A330-300 (PW4164/4168/RR-TRENT70)"
    );
    expect(units.map((u) => u.label)).toEqual([
      "A330-300 (PW4164)",
      "A330-300 (PW4168)",
      "A330-300 (RR-TRENT70)",
    ]);
  });

  it("splits Boeing 737-600/700/800/900(CFM56) into 4 models", () => {
    const units = splitGroupedAircraftLicenseText(
      "Boeing 737-600/700/800/900(CFM56)"
    );
    expect(units.map((u) => u.label)).toEqual([
      "Boeing 737-600 (CFM56)",
      "Boeing 737-700 (CFM56)",
      "Boeing 737-800 (CFM56)",
      "Boeing 737-900 (CFM56)",
    ]);
  });

  it("splits Boeing 737-7/8/9 (CFM LEAP-1B) into 3 models", () => {
    const units = splitGroupedAircraftLicenseText(
      "Boeing 737-7/8/9 (CFM LEAP-1B)"
    );
    expect(units.map((u) => u.label)).toEqual([
      "Boeing 737-7 (CFM LEAP-1B)",
      "Boeing 737-8 (CFM LEAP-1B)",
      "Boeing 737-9 (CFM LEAP-1B)",
    ]);
  });

  it("keeps SOCATA TB-9 as single item with family SOCATA and series TB-9", () => {
    const units = splitGroupedAircraftLicenseText("SOCATA TB-9");
    expect(units).toHaveLength(1);
    expect(units[0].label).toBe("SOCATA TB-9");
    expect(units[0].family).toBe("SOCATA");
    expect(units[0].series).toBe("TB-9");
  });

  it("strips trailing note like A&P only and splits models", () => {
    const units = splitGroupedAircraftLicenseText(
      "A318/A319/A320/A321 A&P only"
    );
    expect(units.map((u) => u.label)).toEqual([
      "A318",
      "A319",
      "A320",
      "A321",
    ]);
  });
});

describe("parseAndSplitAircraftLicense", () => {
  it("resolves combinations for Boeing 737-600/700/800/900(CFM56)", () => {
    const result = parseAndSplitAircraftLicense(
      "Boeing 737-600/700/800/900(CFM56)",
      mockCombinations
    );
    expect(result).toHaveLength(4);
    expect(result.every((r) => r.matched)).toBe(true);
    expect(result.map((r) => r.combinationId)).toEqual([10, 11, 12, 13]);
  });

  it("resolves combinations for Boeing 737-7/8/9 (CFM LEAP-1B)", () => {
    const result = parseAndSplitAircraftLicense(
      "Boeing 737-7/8/9 (CFM LEAP-1B)",
      mockCombinations
    );
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.matched)).toBe(true);
    expect(result.map((r) => r.combinationId)).toEqual([14, 15, 16]);
  });

  it("resolves combinations for A330-300 (PW4164/4168/RR-TRENT70)", () => {
    const result = parseAndSplitAircraftLicense(
      "A330-300 (PW4164/4168/RR-TRENT70)",
      mockCombinations
    );
    expect(result).toHaveLength(3);
    expect(result[0].family).toBe("A330");
    expect(result[0].series).toBe("300");
    expect(result[0].engine).toBe("PW4164");
    // PW4164 -> PW4000 (id 3)
    expect(result[0].combinationId).toBe(3);
    // PW4168 -> PW4000 (id 3)
    expect(result[1].combinationId).toBe(3);
    // RR-TRENT70 -> TRENT700 (id 4)
    expect(result[2].combinationId).toBe(4);
  });

  it("resolves combinations for A319/A320/A321 (IAE V2500)", () => {
    const result = parseAndSplitAircraftLicense(
      "A319/A320/A321 (IAE V2500)",
      mockCombinations
    );
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.combinationId)).toEqual([30, 31, 32]);
  });

  it("splits B777-200/300 without engine and leaves combination unmapped (null) for manual mapping", () => {
    const result = parseAndSplitAircraftLicense(
      "B777-200/300",
      mockCombinations
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.originalText)).toEqual(["B777-200", "B777-300"]);
    expect(result.map((r) => r.combinationId)).toEqual([null, null]);
    expect(result.every((r) => r.matched)).toBe(false);
  });

  it("resolves combinations for B777-200/300 (GE90) where engine is specified", () => {
    const result = parseAndSplitAircraftLicense(
      "B777-200/300 (GE90)",
      mockCombinations
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.combinationId)).toEqual([1, 2]);
    expect(result.every((r) => r.matched)).toBe(true);
  });

  it("splits A318/A319/A320/A321 without engine and leaves combinations unmapped (null) with matched: false", () => {
    const result = parseAndSplitAircraftLicense(
      "A318/A319/A320/A321",
      mockCombinations
    );
    expect(result).toHaveLength(4);
    expect(result.every((r) => r.combinationId === null)).toBe(true);
    expect(result.every((r) => r.matched === false)).toBe(true);
  });

  it("resolves combinations for SOCATA TB-9 into 1 single record", () => {
    const result = parseAndSplitAircraftLicense(
      "SOCATA TB-9",
      mockCombinations
    );
    expect(result).toHaveLength(1);
    expect(result[0].originalText).toBe("SOCATA TB-9");
    expect(result[0].combinationId).toBe(21);
    expect(result[0].matched).toBe(true);
  });
});

describe("computeRowAircraftLicenseDisplay", () => {
  it("returns originalFallback when mappings are empty", () => {
    expect(computeRowAircraftLicenseDisplay([], mockCombinations, "Cessna-150")).toBe("Cessna-150");
    expect(computeRowAircraftLicenseDisplay(undefined, mockCombinations, "Cessna-150")).toBe("Cessna-150");
  });

  it("returns updated display text when single combination is mapped", () => {
    const mappings = [
      {
        id: "1",
        originalText: "Cessna-150",
        family: "B767",
        series: "300",
        engine: "RB211",
        combinationId: 101, // Not in mockCombinations, uses item info
        displayLabel: "B767-300 (RB211)",
        matched: true,
      },
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, mockCombinations, "Cessna-150")).toBe("B767-300 (RB211)");
  });

  it("returns joined display text when multiple different combinations are mapped", () => {
    const mappings = [
      {
        id: "1",
        originalText: "Cessna-150",
        family: "B767",
        series: "300",
        engine: "RB211",
        combinationId: 101,
        displayLabel: "B767-300 (RB211)",
        matched: true,
      },
      {
        id: "2",
        originalText: "New Combination",
        family: "A330",
        series: "800",
        engine: "RR-TRENT-7000",
        combinationId: 102,
        displayLabel: "A330-800 (RR-TRENT-7000)",
        matched: true,
      },
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, mockCombinations, "Cessna-150")).toBe(
      "B767-300 (RB211), A330-800 (RR-TRENT-7000)"
    );
  });

  it("groups series sharing family and engine", () => {
    const mappings = [
      {
        id: "1",
        originalText: "B777-200",
        family: "B777",
        series: "200",
        engine: "GE90",
        combinationId: 1, // mockCombination id 1
        displayLabel: "B777-200 (GE90)",
        matched: true,
      },
      {
        id: "2",
        originalText: "B777-300",
        family: "B777",
        series: "300",
        engine: "GE90",
        combinationId: 2, // mockCombination id 2
        displayLabel: "B777-300 (GE90)",
        matched: true,
      },
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, mockCombinations, "B777-200/300")).toBe(
      "B777-200/300 (GE90)"
    );
  });

  it("ignores unmapped 'New Combination' while retaining mapped combinations", () => {
    const mappings = [
      {
        id: "1",
        originalText: "B767-300 (RB211)",
        family: "B767",
        series: "300",
        engine: "RB211",
        combinationId: 101,
        displayLabel: "B767-300 (RB211)",
        matched: true,
      },
      {
        id: "2",
        originalText: "New Combination",
        family: "",
        series: "",
        engine: null,
        combinationId: null,
        displayLabel: null,
        matched: false,
      },
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, mockCombinations, "Cessna-150")).toBe("B767-300 (RB211)");
  });

  it("returns verbatim originalFallback when all split combinations are unmapped (e.g. A300-600/600R/A310)", () => {
    const rawExcelValue = "A300-600/600R/A310";
    const splitItems = parseAndSplitAircraftLicense(rawExcelValue, mockCombinations);
    // All 3 items should be unmapped since no engine is specified
    expect(splitItems.every((item) => !item.matched && item.combinationId === null)).toBe(true);

    const display = computeRowAircraftLicenseDisplay(splitItems, mockCombinations, rawExcelValue);
    expect(display).toBe("A300-600/600R/A310");
  });
});

describe("computeRowAircraftLicenseDisplay — families sharing one engine", () => {
  const airbusNarrowBody: AircraftEngineCombination[] = [
    { id: 201, familyCode: "A319", series: "", engineCode: "V2500", displayLabel: "A319 (V2500)",
      validFrom: "2026-01-01T00:00:00Z", validTo: null, updatedBy: "test", updatedAtUtc: "2026-01-01T00:00:00Z" },
    { id: 202, familyCode: "A320", series: "", engineCode: "V2500", displayLabel: "A320 (V2500)",
      validFrom: "2026-01-01T00:00:00Z", validTo: null, updatedBy: "test", updatedAtUtc: "2026-01-01T00:00:00Z" },
    { id: 203, familyCode: "A321", series: "", engineCode: "V2500", displayLabel: "A321 (V2500)",
      validFrom: "2026-01-01T00:00:00Z", validTo: null, updatedBy: "test", updatedAtUtc: "2026-01-01T00:00:00Z" },
  ];

  const mapping = (id: string, combinationId: number, family: string, engine: string, series = "") => ({
    id,
    originalText: family,
    family,
    series,
    engine,
    combinationId,
    displayLabel: `${family} (${engine})`,
    matched: true,
  });

  it("collapses A319, A320 and A321 on V2500 into one label", () => {
    const mappings = [
      mapping("1", 201, "A319", "V2500"),
      mapping("2", 202, "A320", "V2500"),
      mapping("3", 203, "A321", "V2500"),
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, airbusNarrowBody, "A319/A320/A321")).toBe(
      "A319/A320/A321 (V2500)"
    );
  });

  it("orders the families the same way whatever order the rows arrive in", () => {
    const mappings = [
      mapping("1", 203, "A321", "V2500"),
      mapping("2", 201, "A319", "V2500"),
      mapping("3", 202, "A320", "V2500"),
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, airbusNarrowBody, "-")).toBe(
      "A319/A320/A321 (V2500)"
    );
  });

  it("keeps each family series when families share an engine", () => {
    const combos: AircraftEngineCombination[] = [
      { id: 301, familyCode: "A330", series: "300", engineCode: "TRENT", displayLabel: "A330-300 (TRENT)",
        validFrom: "2026-01-01T00:00:00Z", validTo: null, updatedBy: "t", updatedAtUtc: "2026-01-01T00:00:00Z" },
      { id: 302, familyCode: "A350", series: "1000", engineCode: "TRENT", displayLabel: "A350-1000 (TRENT)",
        validFrom: "2026-01-01T00:00:00Z", validTo: null, updatedBy: "t", updatedAtUtc: "2026-01-01T00:00:00Z" },
    ];
    const mappings = [
      mapping("1", 301, "A330", "TRENT", "300"),
      mapping("2", 302, "A350", "TRENT", "1000"),
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, combos, "-")).toBe(
      "A330-300/A350-1000 (TRENT)"
    );
  });

  // Different engines must stay in separate, comma-joined labels.
  it("does not merge families that run different engines", () => {
    const combos: AircraftEngineCombination[] = [
      ...airbusNarrowBody,
      { id: 204, familyCode: "A320", series: "", engineCode: "CFM56", displayLabel: "A320 (CFM56)",
        validFrom: "2026-01-01T00:00:00Z", validTo: null, updatedBy: "t", updatedAtUtc: "2026-01-01T00:00:00Z" },
    ];
    const mappings = [
      mapping("1", 201, "A319", "V2500"),
      mapping("2", 204, "A320", "CFM56"),
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, combos, "-")).toBe(
      "A319 (V2500), A320 (CFM56)"
    );
  });

  it("still appends unmapped entries after the grouped label", () => {
    const mappings = [
      mapping("1", 201, "A319", "V2500"),
      mapping("2", 202, "A320", "V2500"),
      { id: "3", originalText: "Cessna-150", family: "", series: "", engine: null,
        combinationId: null, displayLabel: null, matched: false },
    ];
    expect(computeRowAircraftLicenseDisplay(mappings, airbusNarrowBody, "-")).toBe(
      "A319/A320 (V2500), Cessna-150"
    );
  });
});
