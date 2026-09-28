import { describe, expect, it } from "vitest";
import { computeDataQuality, seriesFromModel } from "./aircraftEngine.validation";
import type { AircraftEngineCombination } from "./aircraftEngine.types";
import type { AircraftType } from "../aircraft-types/aircraft-types";

const mkType = (overrides: Partial<AircraftType>): AircraftType => ({
  id: 1,
  code: "A333",
  name: "A333",
  modelName: "A330",
  modelSubName: "A330-300",
  classicOrNeo: "CLASSIC",
  familyCode: "A330",
  flagEnging1: true,
  flagEnging2: true,
  flagEnging3: false,
  flagEnging4: false,
  flagCsd1: true,
  flagCsd2: true,
  flagCsd3: false,
  flagCsd4: false,
  flagHydrolicGreen: true,
  flagHydrolicBlue: true,
  flagHydrolicYellow: true,
  flagApu: true,
  ...overrides,
});

const mkCombo = (familyCode: string): AircraftEngineCombination => ({
  id: 1,
  familyCode,
  series: "300",
  engineCode: "CF6",
  displayLabel: `${familyCode}-300 (CF6)`,
  updatedBy: "test",
  updatedAtUtc: "2026-01-01T00:00:00Z",
}) as unknown as AircraftEngineCombination; // only familyCode matters for this check

const noCombination = (types: AircraftType[], combos: AircraftEngineCombination[]) =>
  computeDataQuality({ engines: [], combinations: combos, aircraftTypes: types })
    .filter((f) => f.category === "NO_COMBINATION");

describe("NO_COMBINATION data-quality check", () => {
  it("flags an aircraft type whose family has no combination, with form defaults", () => {
    const [finding] = noCombination([mkType({ id: 7, code: "A19N", modelName: "A319", modelSubName: "A319neo" })], []);
    expect(finding.id).toBe("NO_COMBINATION:7");
    expect(finding.combinationPrefill).toEqual({ icaoCode: "A19N", familyCode: "A319", series: "" });
  });

  it("does not flag a family that already has a combination (case-insensitive)", () => {
    expect(noCombination([mkType({ modelName: "a330" })], [mkCombo("A330")])).toHaveLength(0);
  });

  it("derives series from '{family}-{series}' models", () => {
    const [finding] = noCombination([mkType({ modelName: "B777", modelSubName: "B777-300ER", code: "B77W" })], []);
    expect(finding.combinationPrefill?.series).toBe("300ER");
  });

  it("skips deleted aircraft types", () => {
    expect(noCombination([mkType({ isDelete: true })], [])).toHaveLength(0);
  });
});

describe("seriesFromModel", () => {
  it.each([
    ["A330", "A330-300", "300"],
    ["B737", "b737-800", "800"],
    ["A319", "A319neo", ""],
    ["A320", "", ""],
  ])("%s + %s → %s", (family, model, expected) => {
    expect(seriesFromModel(family, model)).toBe(expected);
  });
});
