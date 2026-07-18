import { describe, it, expect } from "vitest";
import { fetchAuthGroups, fetchCombinations, fetchEngines, saveAuthGroupDraft, upsertCombination } from "./aircraftEngine.mock";
import { rollUpGroupEngines } from "./aircraftEngine.validation";

describe("CR-4 engineListCached", () => {
  it("every group's cache matches a live roll-up of its active members", async () => {
    const [groups, combos, engines] = await Promise.all([fetchAuthGroups(), fetchCombinations(), fetchEngines()]);
    for (const g of groups) {
      expect(g.engineListCached).toEqual(rollUpGroupEngines(g, combos, engines));
    }
  });

  it("regenerates the cache when membership changes", async () => {
    const g = (await fetchAuthGroups()).find((x) => x.groupId === "AG-330")!;
    expect(g.engineListCached.length).toBeGreaterThan(0);

    // Drop all members → cache must become empty.
    await saveAuthGroupDraft({ groupId: "AG-330", groupLabel: g.groupLabel, memberCombinationIds: [] });
    const emptied = (await fetchAuthGroups()).find((x) => x.groupId === "AG-330")!;
    expect(emptied.engineListCached).toEqual([]);
  });

  it("regenerates affected groups when a new combination is added to the group", async () => {
    const e190 = (await fetchAuthGroups()).find((x) => x.groupId === "AG-E190")!;
    const created = await upsertCombination({ familyCode: "E190", series: "CACHE", engineCode: "CFM56" });
    await saveAuthGroupDraft({ groupId: "AG-E190", groupLabel: e190.groupLabel, memberCombinationIds: [...e190.memberCombinationIds, created.id] });

    const after = (await fetchAuthGroups()).find((x) => x.groupId === "AG-E190")!;
    const combos = await fetchCombinations();
    const engines = await fetchEngines();
    expect(after.engineListCached).toEqual(rollUpGroupEngines(after, combos, engines));
    expect(after.engineListCached).toContain("CFM56");
  });
});
