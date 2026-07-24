import { describe, expect, it } from "vitest";

import {
  computeEffectiveValidTo,
  formatMonitoringAsOf,
  resolveMonitoringAuthStatus,
} from "./monitoring-crs.utils";

describe("computeEffectiveValidTo", () => {
  it("binds to SAMS when SAMS expires first", () => {
    expect(computeEffectiveValidTo("2027-03-31", "2027-09-30")).toEqual({
      effectiveValidTo: "2027-03-31",
      bindingSide: "SAMS",
    });
  });

  it("binds to the customer when the customer expires first", () => {
    expect(computeEffectiveValidTo("2027-03-31", "2026-09-15")).toEqual({
      effectiveValidTo: "2026-09-15",
      bindingSide: "CUSTOMER",
    });
  });

  it("binds equal dates to SAMS", () => {
    expect(computeEffectiveValidTo("2027-03-31", "2027-03-31")).toEqual({
      effectiveValidTo: "2027-03-31",
      bindingSide: "SAMS",
    });
  });

  it("returns no effective date when the customer date is null", () => {
    expect(computeEffectiveValidTo("2027-03-31", null)).toEqual({
      effectiveValidTo: null,
      bindingSide: null,
    });
  });

  it("keeps an expired SAMS date as the binding date", () => {
    expect(computeEffectiveValidTo("2026-07-22", "2027-03-31")).toEqual({
      effectiveValidTo: "2026-07-22",
      bindingSide: "SAMS",
    });
  });
});

describe("resolveMonitoringAuthStatus", () => {
  it("uses the same expired result for EXP in the matrix and detail", () => {
    expect(resolveMonitoringAuthStatus("EXP", "Expired", -1, 90)).toBe("expired");
  });

  it("does not treat Not Approved as valid", () => {
    expect(resolveMonitoringAuthStatus("NAP", "Not Approved", null, 90)).toBe("not-issued");
  });
});

describe("formatMonitoringAsOf", () => {
  it("renders UTC in Asia/Bangkok with the ICT abbreviation", () => {
    expect(formatMonitoringAsOf("2026-07-23T20:08:03.984227Z"))
      .toBe("24/07/2026 03:08 ICT");
  });
});
