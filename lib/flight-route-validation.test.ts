import { describe, expect, it } from "vitest";
import { getRouteStationErrors } from "./flight-route-validation";

const o = (v: string | null) => (v === null ? null : { value: v, label: v });
const check = (from: string | null, station: string | null, to: string | null) =>
  getRouteStationErrors(o(station), o(from), o(to));

describe("getRouteStationErrors — [Route From, Station, Route To]", () => {
  it("BKK BKK BKK: not allowed", () => {
    expect(check("BKK", "BKK", "BKK")).toEqual({
      routeFrom: expect.any(String),
      routeTo: expect.any(String),
    });
  });
  it("ALA ALA BKK: not allowed (From = Station)", () => {
    expect(check("ALA", "ALA", "BKK")).toEqual({ routeFrom: expect.any(String) });
  });
  it("BKK ALA ALA: not allowed (To = Station)", () => {
    expect(check("BKK", "ALA", "ALA")).toEqual({ routeTo: expect.any(String) });
  });
  it("ALA BKK ALA: allowed (From = To is fine)", () => {
    expect(check("ALA", "BKK", "ALA")).toEqual({});
  });
  it("ignores case/spaces and empty values", () => {
    expect(check(" bkk", "BKK", null)).toEqual({ routeFrom: expect.any(String) });
    expect(check(null, "BKK", null)).toEqual({});
    expect(check("BKK", null, "BKK")).toEqual({});
  });
});
