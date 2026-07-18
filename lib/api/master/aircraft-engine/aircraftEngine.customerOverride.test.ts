import { describe, it, expect } from "vitest";
import { resolveGroupsForCustomer } from "./aircraftEngine.validation";
import type { AuthorizationTypeGroup } from "./aircraftEngine.types";

const TS = "2026-06-01T00:00:00.000Z";
function g(over: Partial<AuthorizationTypeGroup>): AuthorizationTypeGroup {
  return {
    groupId: "G", groupLabel: "L", memberCombinationIds: [1], reviewStatus: "PUBLISHED",
    completenessStatus: "complete", engineListCached: [], customerId: null,
    updatedBy: "t", updatedAtUtc: TS, ...over,
  };
}

describe("CR-2 resolveGroupsForCustomer", () => {
  it("falls back to the global group when the customer has no override", () => {
    const groups = [g({ groupId: "glob", groupLabel: "A320", customerId: null })];
    const resolved = resolveGroupsForCustomer(groups, 7);
    expect(resolved.map((x) => x.groupId)).toEqual(["glob"]);
  });

  it("prefers the customer override over the global for the same scope", () => {
    const groups = [
      g({ groupId: "glob", groupLabel: "A320", customerId: null }),
      g({ groupId: "ov7", groupLabel: "A320", customerId: 7 }),
    ];
    const resolved = resolveGroupsForCustomer(groups, 7);
    expect(resolved.map((x) => x.groupId)).toEqual(["ov7"]); // override wins, global suppressed
    expect(resolved.length).toBe(1);
  });

  it("ignores overrides that belong to a different airline", () => {
    const groups = [
      g({ groupId: "glob", groupLabel: "A320", customerId: null }),
      g({ groupId: "ov9", groupLabel: "A320", customerId: 9 }), // belongs to airline 9
    ];
    const resolved = resolveGroupsForCustomer(groups, 7);
    expect(resolved.map((x) => x.groupId)).toEqual(["glob"]); // airline 7 sees the global
  });

  it("resolves each scope independently (mixed override + global)", () => {
    const groups = [
      g({ groupId: "glob-a", groupLabel: "A320", customerId: null }),
      g({ groupId: "ov-a", groupLabel: "A320", customerId: 7 }),
      g({ groupId: "glob-b", groupLabel: "B777", customerId: null }),
    ];
    const resolved = resolveGroupsForCustomer(groups, 7).map((x) => x.groupId).sort();
    expect(resolved).toEqual(["glob-b", "ov-a"]);
  });
});
