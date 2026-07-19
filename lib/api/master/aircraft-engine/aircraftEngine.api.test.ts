import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import {
  deleteCombination,
  deleteEngine,
  deleteSystemConfig,
  fetchAuthGroups,
  fetchCombinations,
  fetchEngines,
  fetchSystemConfigs,
  saveAuthGroupDraft,
  transitionAuthGroup,
  upsertCombination,
  upsertEngine,
  upsertSystemConfig,
} from "./aircraftEngine";

const ok = (responseData: unknown = null) => ({ data: { message: "success", responseData, error: "" } });

describe("Aircraft-Engine API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and normalizes engines from the shared response envelope", async () => {
    axiosMock.get.mockResolvedValue(ok([{
      engineCode: "LEAP1A",
      engineName: "CFM LEAP-1A",
      manufacturer: "CFM International",
      notes: "A320neo",
      updatedby: "qa.admin",
      updateddate: "2026-07-19T01:02:03Z",
    }]));

    await expect(fetchEngines()).resolves.toEqual([expect.objectContaining({
      engineCode: "LEAP1A",
      engineName: "CFM LEAP-1A",
      updatedBy: "qa.admin",
      updatedAtUtc: "2026-07-19T01:02:03Z",
    })]);
    expect(axiosMock.get).toHaveBeenCalledWith("/master/engine");
  });

  it("loads active and point-in-time combinations with the documented query", async () => {
    axiosMock.get.mockResolvedValue(ok([{
      id: 9,
      familyCode: "B737",
      series: "8",
      engineCode: "LEAP1B",
      displayLabel: "B737-8 (CFM LEAP-1B)",
      validFrom: "2026-01-01T00:00:00Z",
      validTo: null,
    }]));

    const active = await fetchCombinations();
    expect(active[0]).toEqual(expect.objectContaining({ id: 9, familyCode: "B737", validTo: null }));
    expect(axiosMock.get).toHaveBeenNthCalledWith(1, "/master/aircraft-engine-combination", undefined);

    await fetchCombinations("2026-07-19T00:00:00Z");
    expect(axiosMock.get).toHaveBeenNthCalledWith(
      2,
      "/master/aircraft-engine-combination",
      { params: { asOf: "2026-07-19T00:00:00Z" } },
    );
  });

  it("passes downstream, customer, and asOf authorization-group filters", async () => {
    axiosMock.get.mockResolvedValue(ok([{
      groupId: "AG-737NG",
      groupLabel: "B737 NG",
      memberCombinationIds: [1, 2],
      reviewStatus: "published",
      completenessStatus: "complete",
      engineListCached: ["CFM56"],
      customerId: 12,
    }]));

    const groups = await fetchAuthGroups({
      downstream: true,
      customerId: 12,
      asOf: "2026-07-19T00:00:00Z",
    });

    expect(groups[0]).toEqual(expect.objectContaining({
      groupId: "AG-737NG",
      reviewStatus: "PUBLISHED",
      completenessStatus: "complete",
      customerId: 12,
    }));
    expect(axiosMock.get).toHaveBeenCalledWith("/master/authorization-group", {
      params: { asOf: "2026-07-19T00:00:00Z", downstream: true, customerId: 12 },
    });
  });

  it("loads and normalizes aircraft system config", async () => {
    axiosMock.get.mockResolvedValue(ok([{
      icao_code: "B738",
      family_code: "B737",
      model_variant: "737-800",
      classic_neo: "CLASSIC",
      engine_count: 2,
      generator_count: 2,
      hydraulic_count: 3,
      has_apu: true,
    }]));

    await expect(fetchSystemConfigs()).resolves.toEqual([expect.objectContaining({
      icaoCode: "B738",
      familyCode: "B737",
      hasApu: true,
    })]);
    expect(axiosMock.get).toHaveBeenCalledWith("/master/aircraft-system-config");
  });

  it("sends engine and combination upserts with the Postman request shapes", async () => {
    axiosMock.post.mockResolvedValue(ok());

    await upsertEngine({
      engineCode: "CFM56",
      engineName: "CFM56",
      manufacturer: "CFM International",
      notes: "Classic",
    });
    await upsertCombination({ familyCode: "B737", series: "800", engineCode: "CFM56" });
    await upsertCombination({ id: 7, familyCode: "B737", series: "900", engineCode: "CFM56" });

    expect(axiosMock.post).toHaveBeenNthCalledWith(1, "/master/engine", {
      engineCode: "CFM56", engineName: "CFM56", manufacturer: "CFM International", notes: "Classic",
    });
    expect(axiosMock.post).toHaveBeenNthCalledWith(2, "/master/aircraft-engine-combination", {
      familyCode: "B737", series: "800", engineCode: "CFM56",
    });
    expect(axiosMock.post).toHaveBeenNthCalledWith(3, "/master/aircraft-engine-combination", {
      id: 7, familyCode: "B737", series: "900", engineCode: "CFM56",
    });
  });

  it("sends authorization draft and transition requests", async () => {
    axiosMock.post.mockResolvedValue(ok());

    await saveAuthGroupDraft({
      groupId: "AG-737NG",
      groupLabel: "B737-600/700/800/900",
      memberCombinationIds: [1, 2],
      customerId: null,
    });
    await transitionAuthGroup("AG-737NG", "PUBLISH");

    expect(axiosMock.post).toHaveBeenNthCalledWith(1, "/master/authorization-group/draft", {
      groupId: "AG-737NG",
      groupLabel: "B737-600/700/800/900",
      memberCombinationIds: [1, 2],
      customerId: null,
    });
    expect(axiosMock.post).toHaveBeenNthCalledWith(
      2,
      "/master/authorization-group/AG-737NG/transition",
      { action: "PUBLISH" },
    );
  });

  it("sends system-config upsert and all documented delete requests", async () => {
    axiosMock.post.mockResolvedValue(ok());
    axiosMock.delete.mockResolvedValue(ok());

    await upsertSystemConfig({
      icaoCode: "B738", familyCode: "B737", modelVariant: "737-800 (NG)",
      classicNeo: "CLASSIC", engineCount: 2, generatorCount: 2,
      hydraulicCount: 3, hasApu: true, isNew: true,
    });
    await deleteSystemConfig("B738");
    await deleteEngine("CFM56");
    await deleteCombination(1);

    expect(axiosMock.post).toHaveBeenCalledWith("/master/aircraft-system-config", expect.objectContaining({
      icaoCode: "B738", isNew: true,
    }));
    expect(axiosMock.delete).toHaveBeenNthCalledWith(1, "/master/aircraft-system-config/B738");
    expect(axiosMock.delete).toHaveBeenNthCalledWith(2, "/master/engine/CFM56");
    expect(axiosMock.delete).toHaveBeenNthCalledWith(3, "/master/aircraft-engine-combination/1");
  });

  it("rejects a success-status response that carries an envelope error", async () => {
    axiosMock.get.mockResolvedValue({ data: { message: "error", responseData: null, error: "Database unavailable" } });
    await expect(fetchEngines()).rejects.toThrow("Database unavailable");
  });

  it("rejects an error envelope even when the backend leaves error text empty", async () => {
    axiosMock.post.mockResolvedValue({ data: { message: "error", responseData: null, error: "" } });
    await expect(upsertEngine({
      engineCode: "CFM56",
      engineName: "CFM56",
      manufacturer: "CFM International",
      notes: "Classic",
    })).rejects.toThrow("Aircraft-Engine API request failed");
  });
});
