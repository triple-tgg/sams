import { describe, it, expect } from "vitest";
import { isActiveAt, activeAt } from "./aircraftEngine.temporal";
import {
  fetchCombinations,
  upsertCombination,
  deleteCombination,
  saveAuthGroupDraft,
  fetchAuthGroups,
  __getGroupMembers,
  __getAllCombinationVersions,
} from "./aircraftEngine.mock";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("CR-3 temporal scope helper", () => {
  it("isActiveAt: open row is active now, closed row is not", () => {
    expect(isActiveAt({ validFrom: "2026-01-01T00:00:00.000Z", validTo: null })).toBe(true);
    expect(isActiveAt({ validFrom: "2026-01-01T00:00:00.000Z", validTo: "2026-02-01T00:00:00.000Z" })).toBe(false);
  });

  it("isActiveAt: point-in-time uses the half-open interval [from, to)", () => {
    const row = { validFrom: "2026-01-01T00:00:00.000Z", validTo: "2026-03-01T00:00:00.000Z" };
    expect(isActiveAt(row, "2025-12-31T23:59:59.000Z")).toBe(false); // before
    expect(isActiveAt(row, "2026-01-01T00:00:00.000Z")).toBe(true); // at from (inclusive)
    expect(isActiveAt(row, "2026-02-01T00:00:00.000Z")).toBe(true); // inside
    expect(isActiveAt(row, "2026-03-01T00:00:00.000Z")).toBe(false); // at to (exclusive)
  });

  it("activeAt filters a mixed set", () => {
    const rows = [
      { id: 1, validFrom: "2026-01-01T00:00:00.000Z", validTo: null },
      { id: 2, validFrom: "2026-01-01T00:00:00.000Z", validTo: "2026-02-01T00:00:00.000Z" },
    ];
    expect(activeAt(rows).map((r) => r.id)).toEqual([1]);
    expect(activeAt(rows, "2026-01-15T00:00:00.000Z").map((r) => r.id).sort()).toEqual([1, 2]);
  });
});

describe("CR-3 point-in-time combination reads (append-only edit)", () => {
  it("edit closes out the old version and inserts a new one under the same id", async () => {
    const before = new Date().toISOString();
    await sleep(5);
    const created = await upsertCombination({ familyCode: "A320", series: "TP1", engineCode: "CFM56" });

    const t0 = new Date().toISOString(); // after create, before edit
    await sleep(5);
    await upsertCombination({ id: created.id, familyCode: "A320", series: "TP1", engineCode: "V2500" });

    // now = edited value
    const now = await fetchCombinations();
    expect(now.find((c) => c.id === created.id)?.engineCode).toBe("V2500");

    // as-of just-after-create = original value
    const atT0 = await fetchCombinations(t0);
    expect(atT0.find((c) => c.id === created.id)?.engineCode).toBe("CFM56");

    // as-of before create = row did not exist
    const atBefore = await fetchCombinations(before);
    expect(atBefore.find((c) => c.id === created.id)).toBeUndefined();

    // exactly two physical versions, one closed + one open
    const versions = __getAllCombinationVersions().filter((c) => c.id === created.id);
    expect(versions.length).toBe(2);
    expect(versions.filter((v) => v.validTo === null).length).toBe(1);
  });
});

describe("CR-3 append-only membership + point-in-time groups", () => {
  it("removing a member closes out the junction row, keeps history", async () => {
    const g = (await fetchAuthGroups()).find((x) => x.groupId === "AG-350")!;
    const membersBefore = [...g.memberCombinationIds];
    expect(membersBefore.length).toBeGreaterThan(1);
    const removed = membersBefore[membersBefore.length - 1];
    const keep = membersBefore.filter((id) => id !== removed);

    const tMid = new Date().toISOString();
    await sleep(5);
    await saveAuthGroupDraft({ groupId: "AG-350", groupLabel: g.groupLabel, memberCombinationIds: keep });

    // active membership dropped the removed combo
    const after = (await fetchAuthGroups()).find((x) => x.groupId === "AG-350")!;
    expect(after.memberCombinationIds.sort()).toEqual(keep.sort());

    // the junction row still exists, just closed out (append-only — not deleted)
    const rows = __getGroupMembers().filter((m) => m.groupId === "AG-350" && m.combinationId === removed);
    expect(rows.length).toBe(1);
    expect(rows[0].validTo).not.toBeNull();

    // point-in-time before the edit still shows the removed member
    const past = (await fetchAuthGroups({ asOf: tMid })).find((x) => x.groupId === "AG-350")!;
    expect(past.memberCombinationIds).toContain(removed);
  });
});

describe("CR-3 delete: hard-delete only when never referenced", () => {
  it("never-referenced combination is hard-deleted", async () => {
    const c = await upsertCombination({ familyCode: "E190", series: "DELX", engineCode: "PW1900G" });
    await deleteCombination(c.id);
    expect(__getAllCombinationVersions().some((v) => v.id === c.id)).toBe(false);
  });

  it("historically-referenced combination is closed out, never physically removed", async () => {
    const c = await upsertCombination({ familyCode: "E190", series: "DELY", engineCode: "PW1900G" });
    const eg = (await fetchAuthGroups()).find((x) => x.groupId === "AG-E190")!;
    // add then remove from a group → now historically referenced but not active member
    await saveAuthGroupDraft({ groupId: "AG-E190", groupLabel: eg.groupLabel, memberCombinationIds: [...eg.memberCombinationIds, c.id] });
    await saveAuthGroupDraft({ groupId: "AG-E190", groupLabel: eg.groupLabel, memberCombinationIds: eg.memberCombinationIds });

    await deleteCombination(c.id);
    const versions = __getAllCombinationVersions().filter((v) => v.id === c.id);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every((v) => v.validTo !== null)).toBe(true);
  });

  it("active member cannot be deleted (soft-block preserved)", async () => {
    // seed combination id 1 (B737-600/CFM56) is an active member of AG-737NG
    await expect(deleteCombination(1)).rejects.toThrow("REFERENCED");
  });
});
