import { describe, expect, it } from "vitest";
import {
  buildEscalationSchedule,
  formatDMY,
  validateEscalationRounds,
  summarizeEscalationByRate,
  sortEscalationLog,
  type EscalationLogEntry,
  type EscalationRound,
} from "./contractEscalation";

const round = (id: number, date: string, isApplied = false, appliedDate: string | null = null): EscalationRound => ({
  id, escalationDate: date, isApplied, appliedDate, appliedBy: null,
});

describe("buildEscalationSchedule", () => {
  const base = { effectiveFrom: "2024-01-01", expiresOn: "2030-12-31", today: "2026-11-17" };

  it("uses the regular yearly date when there are no additional rounds", () => {
    const s = buildEscalationSchedule({ ...base, regularDate: "01-01", rounds: [] });
    expect(s.current?.date).toBe("2026-01-01");
    expect(s.upcoming.map((e) => e.date)).toEqual(["2027-01-01", "2028-01-01", "2029-01-01"]);
  });

  it("an additional round replaces the regular round of its year, then regular resumes", () => {
    const s = buildEscalationSchedule({
      ...base,
      regularDate: "01-01",
      rounds: [round(1, "2027-03-15"), round(2, "2028-06-01")],
    });
    expect(s.upcoming.map((e) => [e.date, e.source])).toEqual([
      ["2027-03-15", "additional"],
      ["2028-06-01", "additional"],
      ["2029-01-01", "regular"],
    ]);
  });

  it("reports whether the current round was applied", () => {
    const additional = buildEscalationSchedule({
      ...base, regularDate: "01-01", rounds: [round(1, "2026-03-01", true, "2026-03-01")],
    });
    expect(additional.current).toMatchObject({ date: "2026-03-01", source: "additional", isApplied: true });

    const regularPending = buildEscalationSchedule({
      ...base, regularDate: "01-01", rounds: [], lastEscalationAppliedDate: "2025-01-01",
    });
    expect(regularPending.current).toMatchObject({ date: "2026-01-01", isApplied: false });

    const regularDone = buildEscalationSchedule({
      ...base, regularDate: "01-01", rounds: [], lastEscalationAppliedDate: "2026-01-02T00:00:00",
    });
    expect(regularDone.current?.isApplied).toBe(true);

    const unknown = buildEscalationSchedule({ ...base, regularDate: "01-01", rounds: [] });
    expect(unknown.current?.isApplied).toBeNull();
  });

  it("keeps rounds inside the contract period", () => {
    const s = buildEscalationSchedule({
      regularDate: "01-01", rounds: [], effectiveFrom: "2026-06-01", expiresOn: "2028-06-01", today: "2026-11-17",
    });
    expect(s.current).toBeNull();
    expect(s.upcoming.map((e) => e.date)).toEqual(["2027-01-01", "2028-01-01"]);
  });

  it("29 Feb falls back to 28 Feb in non-leap years", () => {
    const s = buildEscalationSchedule({ ...base, regularDate: "02-29", rounds: [] });
    expect(s.upcoming.map((e) => e.date)).toEqual(["2027-02-28", "2028-02-29", "2029-02-28"]);
  });
});

describe("validateEscalationRounds", () => {
  const v = (rounds: EscalationRound[], opts?: { requireDate?: boolean }) =>
    validateEscalationRounds(rounds, "2024-01-01", "2030-12-31", false, opts);

  it("each round must be later than the previous round", () => {
    const errors = v([round(0, "2026-11-01"), round(0, "2026-11-01"), round(0, "2026-10-01"), round(0, "2027-01-01")]);
    expect(errors).toEqual({
      1: "Must be after Round 1 (01-Nov-2026)",
      2: "Must be after Round 2 (01-Nov-2026)",
    });
  });

  it("compares with the nearest earlier round that has a date", () => {
    const errors = v([round(0, "2027-05-01"), round(0, ""), round(0, "2027-04-01")]);
    expect(errors).toEqual({ 1: "Date is required", 2: "Must be after Round 1 (01-May-2027)" });
  });

  it("applied rounds are not reported but still count as the previous round", () => {
    expect(v([round(9, "2026-03-01", true), round(0, "2026-02-01")])).toEqual({
      1: "Must be after Round 1 (01-Mar-2026)",
    });
  });

  it("flags out-of-period dates", () => {
    expect(Object.keys(v([round(0, "2023-05-01")]))).toEqual(["0"]);
    expect(Object.keys(v([round(0, "2031-01-01")]))).toEqual(["0"]);
  });

  it("live mode skips empty rows", () => {
    expect(v([round(0, "2027-01-01"), round(0, "")], { requireDate: false })).toEqual({});
  });

  it("ignores Expires On when the contract has no expiry", () => {
    expect(validateEscalationRounds([round(0, "2040-01-01")], "2024-01-01", "2999-01-01", true)).toEqual({});
  });
});

it("formatDMY", () => {
  expect(formatDMY("2027-03-15T00:00:00")).toBe("15-Mar-2027");
  expect(formatDMY(null)).toBe("-");
});

describe("escalation log", () => {
  const entry = (id: number, date: string, rates: [number, number][]): EscalationLogEntry => ({
    id, escalationDate: date, source: "regular", appliedDate: date, appliedBy: null,
    rates: rates.map(([pricingDataId, percent]) => ({ pricingDataId, percent })),
  });

  it("sorts oldest first", () => {
    const log = sortEscalationLog([entry(2, "2026-01-01", []), entry(1, "2025-01-01", [])]);
    expect(log.map((e) => e.id)).toEqual([1, 2]);
  });

  it("counts rounds and compounds the % per rate", () => {
    const log = [entry(1, "2025-01-01", [[10, 3], [11, 5]]), entry(2, "2026-01-01", [[10, 3]])];
    expect(summarizeEscalationByRate(log, [10, 11, 12])).toEqual([
      { pricingDataId: 10, roundsApplied: 2, cumulativePercent: 6.09 },
      { pricingDataId: 11, roundsApplied: 1, cumulativePercent: 5 },
      { pricingDataId: 12, roundsApplied: 0, cumulativePercent: 0 },
    ]);
  });
});
