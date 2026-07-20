import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import {
  getMonitoringCrsDetail,
  getMonitoringCrsList,
  getMonitoringCrsSummary,
  type MonitoringCrsListRequest,
} from "./monitoring-crs";

describe("monitoring CRS API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts the matrix filters to the backend-owned monitoring route", async () => {
    const request: MonitoringCrsListRequest = {
      searchKeyword: "",
      coverageStatus: "",
      samsStatus: "",
      airlineId: null,
      hasIssues: true,
      expiryWarningDays: 90,
      page: 1,
      perPage: 20,
    };
    const response = { message: "success", responseData: {}, page: 1, perPage: 20, total: 0, totalAll: 0, error: "" };
    axiosMock.post.mockResolvedValueOnce({ data: response });

    await expect(getMonitoringCrsList(request)).resolves.toBe(response);
    expect(axiosMock.post).toHaveBeenCalledWith("/authorization/monitoring-crs/listdata", request);
  });

  it("gets staff detail with the warning window", async () => {
    const response = { message: "success", responseData: {}, error: "" };
    axiosMock.get.mockResolvedValueOnce({ data: response });

    await expect(getMonitoringCrsDetail(163, 90)).resolves.toBe(response);
    expect(axiosMock.get).toHaveBeenCalledWith("/authorization/monitoring-crs/byid/163", {
      params: { expiryWarningDays: 90 },
    });
  });

  it("gets the global monitoring summary", async () => {
    const response = { message: "success", responseData: {}, error: "" };
    axiosMock.get.mockResolvedValueOnce({ data: response });

    await expect(getMonitoringCrsSummary(90)).resolves.toBe(response);
    expect(axiosMock.get).toHaveBeenCalledWith("/authorization/monitoring-crs/summary", {
      params: { expiryWarningDays: 90 },
    });
  });
});
