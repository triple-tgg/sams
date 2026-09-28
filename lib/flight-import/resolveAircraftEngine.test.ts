import { describe, expect, it } from "vitest";
import { resolveAircraftEngine } from "./resolveAircraftEngine";
import type { AircraftType } from "@/lib/api/master/aircraft-types/aircraft-types";
import type { AircraftEngineCombination } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

const types = [
  { id: 1, code: "A20N", modelName: "A320", familyCode: "A32N" },
  { id: 2, code: "B738", modelName: "B737", familyCode: "B737" },
] as unknown as AircraftType[];

const combo = (id: number, familyCode: string, series: string, engineCode: string) =>
  ({ id, familyCode, series, engineCode }) as unknown as AircraftEngineCombination;

const combos = [
  combo(10, "A320", "NEO", "LEAP-1A"),
  combo(11, "A320", "NEO", "PW1100G"),
  combo(20, "B737", "800", "CFM56"),
];

describe("resolveAircraftEngine", () => {
  it("uses the Family (modelName) of the A/C TYPE and matches series + engine", () => {
    expect(resolveAircraftEngine({ "A/C TYPE": "A20N", SERIES: "neo", ENGINE: "leap-1a" }, types, combos))
      .toEqual({ aircraftEngineId: 10, familyCode: "A320", series: "NEO", engineCode: "LEAP-1A" });
  });

  it("auto-picks the only combination of a family when the row has no series/engine", () => {
    expect(resolveAircraftEngine({ "A/C TYPE": "B738" }, types, combos))
      .toEqual({ aircraftEngineId: 20, familyCode: "B737", series: "800", engineCode: "CFM56" });
  });

  it("does not guess when a family has several combinations", () => {
    expect(resolveAircraftEngine({ "A/C TYPE": "A20N" }, types, combos))
      .toEqual({ aircraftEngineId: 0, familyCode: "A320", series: "", engineCode: "" });
  });

  it("prefers an explicit FAMILY column and falls back to the A/C TYPE value", () => {
    expect(resolveAircraftEngine({ "A/C TYPE": "XXXX", "Family Code": "B737" }, types, combos).aircraftEngineId).toBe(20);
    expect(resolveAircraftEngine({ "A/C TYPE": "E190" }, types, combos))
      .toEqual({ aircraftEngineId: 0, familyCode: "E190", series: "", engineCode: "" });
  });
});
