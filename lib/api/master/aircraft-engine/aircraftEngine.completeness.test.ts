import { describe, it, expect } from "vitest";
import {
  computeCompletenessStatus,
  filterDownstreamGroups,
  computeDataQuality,
} from "./aircraftEngine.validation";
import { fetchAuthGroups, saveAuthGroupDraft } from "./aircraftEngine.mock";
import type {
  AircraftEngineCombination,
  AuthorizationTypeGroup,
  EngineMaster,
} from "./aircraftEngine.types";

const TS = "2026-06-01T00:00:00.000Z";

function mkCombo(id: number, familyCode: string, series: string, engineCode: string): AircraftEngineCombination {
  return { id, familyCode, series, engineCode, displayLabel: `${familyCode}-${series}`, validFrom: TS, validTo: null, updatedBy: "t", updatedAtUtc: TS };
}
function mkGroup(over: Partial<AuthorizationTypeGroup>): AuthorizationTypeGroup {
  return {
    groupId: "G", groupLabel: "G", memberCombinationIds: [], reviewStatus: "DRAFT",
    completenessStatus: "draft", engineListCached: [], customerId: null,
    updatedBy: "t", updatedAtUtc: TS, ...over,
  };
}
const engines: EngineMaster[] = [
  { engineCode: "LEAP1B", engineName: "CFM LEAP-1B", manufacturer: "", notes: "", updatedBy: "t", updatedAtUtc: TS },
  { engineCode: "CFM56", engineName: "CFM56", manufacturer: "", notes: "", updatedBy: "t", updatedAtUtc: TS },
];

describe("CR-1 computeCompletenessStatus", () => {
  const combos = [
    mkCombo(1, "B737", "7", "LEAP1B"),
    mkCombo(2, "B737", "8", "LEAP1B"),
    mkCombo(3, "B737", "10", "LEAP1B"), // same family+engine as 1/2
    mkCombo(4, "B737", "800", "CFM56"),
  ];

  it("draft when the group has no members", () => {
    expect(computeCompletenessStatus(mkGroup({ memberCombinationIds: [] }), combos, engines)).toBe("draft");
  });

  it("incomplete when a same-family+engine series is left unbound (missing series)", () => {
    // members 1,2 (B737/LEAP1B) but combo 3 (B737/LEAP1B) is not a member
    expect(computeCompletenessStatus(mkGroup({ memberCombinationIds: [1, 2] }), combos, engines)).toBe("incomplete");
  });

  it("incomplete when a legacy engine label doesn't resolve to the master vocabulary", () => {
    const g = mkGroup({ memberCombinationIds: [4], legacyEngineLabels: ["IAE V500"] });
    expect(computeCompletenessStatus(g, combos, engines)).toBe("incomplete");
  });

  it("complete when every same-pair series is bound and no unresolved labels", () => {
    // members 1,2,3 cover all B737/LEAP1B; combo 4 is a different pair → irrelevant
    expect(computeCompletenessStatus(mkGroup({ memberCombinationIds: [1, 2, 3] }), combos, engines)).toBe("complete");
  });
});

describe("CR-1 seed statuses (through the mock)", () => {
  it("reflects the intentional seed drift", async () => {
    const groups = await fetchAuthGroups();
    const by = (id: string) => groups.find((g) => g.groupId === id)!;
    expect(by("AG-737NG").completenessStatus).toBe("complete");
    expect(by("AG-737MAX").completenessStatus).toBe("incomplete"); // -10 / -8200 unbound
    expect(by("AG-A320").completenessStatus).toBe("incomplete"); // "IAE V500" legacy label
    expect(by("AG-777").completenessStatus).toBe("complete");
  });

  it("allows creating an empty draft group (never blocked — CR-1 item 3)", async () => {
    const created = await saveAuthGroupDraft({ groupLabel: "Parallel work", memberCombinationIds: [] });
    expect(created.completenessStatus).toBe("draft");
    expect(created.reviewStatus).toBe("DRAFT");
  });
});

describe("CR-1 downstream gate", () => {
  it("only PUBLISHED + complete groups pass", () => {
    const groups = [
      mkGroup({ groupId: "a", reviewStatus: "PUBLISHED", completenessStatus: "complete" }),
      mkGroup({ groupId: "b", reviewStatus: "PUBLISHED", completenessStatus: "incomplete" }),
      mkGroup({ groupId: "c", reviewStatus: "DRAFT", completenessStatus: "complete" }),
      mkGroup({ groupId: "d", reviewStatus: "IN_REVIEW", completenessStatus: "complete" }),
    ];
    expect(filterDownstreamGroups(groups).map((g) => g.groupId)).toEqual(["a"]);
  });
});

describe("CR-1 data-quality banner escalation", () => {
  const now = "2026-07-18T00:00:00.000Z";
  const base = { engines: [], combinations: [], systemConfigs: [] };

  it("amber for a recently-incomplete group, red once past the 3-day SLA", () => {
    const recent = mkGroup({ groupId: "R", completenessStatus: "incomplete", incompleteSinceUtc: "2026-07-17T00:00:00.000Z" }); // 1 day
    const stale = mkGroup({ groupId: "S", completenessStatus: "incomplete", incompleteSinceUtc: "2026-07-10T00:00:00.000Z" }); // 8 days

    const fRecent = computeDataQuality({ ...base, authGroups: [recent] }, now).find((f) => f.category === "STALE_GROUP")!;
    const fStale = computeDataQuality({ ...base, authGroups: [stale] }, now).find((f) => f.category === "STALE_GROUP")!;
    expect(fRecent.severity).toBe("amber");
    expect(fStale.severity).toBe("red");
  });

  it("emits no STALE_GROUP finding for a complete group", () => {
    const complete = mkGroup({ groupId: "C", completenessStatus: "complete" });
    const findings = computeDataQuality({ ...base, authGroups: [complete] }, now);
    expect(findings.some((f) => f.category === "STALE_GROUP")).toBe(false);
  });
});
