import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import {
  getAuthorityAuthList,
  getAuthorityLicenseDetail,
  upsertAuthorityLicense,
  type AuthorityAuthListRequest,
  type AuthorityLicenseUpsertRequest,
} from "./authority-auth";
import {
  validateAuthorityAircraftSelection,
  validateAuthorityLicenseDates,
} from "./authority-auth.validation";

describe("authority authorization API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts list filters to the authority list route", async () => {
    const request: AuthorityAuthListRequest = {
      searchKeyword: "",
      authorityId: null,
      status: "",
      page: 1,
      perPage: 20,
    };
    const response = { message: "success", responseData: {}, error: "" };
    axiosMock.post.mockResolvedValueOnce({ data: response });

    await expect(getAuthorityAuthList(request)).resolves.toBe(response);
    expect(axiosMock.post).toHaveBeenCalledWith("/authorization/authority/listdata", request);
  });

  it("gets a license detail by record id", async () => {
    const response = {
      message: "success",
      responseData: {
        id: 32,
        staffId: 163,
        staffName: "Aleks Reymer",
        employeeId: "EMP-0163",
        authorizationAuthorityMasterId: 1,
        aviationAuthorityCode: "CAAT",
        aviationAuthorityName: "Civil Aviation Authority of Thailand",
        licenseNo: "112233",
        licenseLevel: "1",
        initialIssueDate: null,
        currentIssueDate: null,
        expireDate: null,
        aircrafts: [
          {
            id: 40,
            aircraftEngineId: 1,
            code: "B767",
            name: "B767"
          }
        ],
        createddate: "2026-08-16T09:25:46.73741",
        createdby: "navee",
        updateddate: "2026-08-16T09:25:46.737423",
        updatedby: "navee"
      },
      error: ""
    };
    axiosMock.get.mockResolvedValueOnce({ data: response });

    await expect(getAuthorityLicenseDetail(1)).resolves.toBe(response);
    expect(axiosMock.get).toHaveBeenCalledWith("/authorization/authority/byid/1");
  });

  it("posts the complete upsert payload", async () => {
    const request: AuthorityLicenseUpsertRequest = {
      authorizationAuthorityId: 1,
      staffId: 163,
      authorizationAuthorityMasterId: 1,
      licenseNo: "test1234",
      licenseLevel: "1",
      initialIssueDate: "2026-07-16",
      currentIssueDate: "2026-07-16",
      expireDate: "2026-07-16",
      aircraftEngineIds: [1],
      authorizationStatusId: 1,
    };
    const response = { 
      message: "success", 
      responseData: {
        id: 32,
        staffId: 163,
        authorizationAuthorityMasterId: 1,
        licenseNo: "112233",
        licenseLevel: "1",
        initialIssueDate: "2026-07-16",
        currentIssueDate: "2026-07-16",
        expireDate: "2026-07-16",
        isdelete: false,
        createddate: "2026-08-16T09:25:46.73741+00:00",
        createdby: "navee",
        updateddate: "2026-08-16T09:25:46.7374238+00:00",
        updatedby: "navee",
        authorizationStatusId: 1
      }, 
      error: "" 
    };
    axiosMock.post.mockResolvedValueOnce({ data: response });

    await expect(upsertAuthorityLicense(request)).resolves.toBe(response);
    expect(axiosMock.post).toHaveBeenCalledWith("/authorization/authority-license/upsert", request);
  });

  it("creates a not-approved record through the upsert route", async () => {
    const request: AuthorityLicenseUpsertRequest = {
      authorizationAuthorityId: 0,
      staffId: 163,
      authorizationAuthorityMasterId: 5,
      licenseNo: null,
      licenseLevel: null,
      initialIssueDate: null,
      currentIssueDate: null,
      expireDate: null,
      aircraftEngineIds: [],
      authorizationStatusId: 2,
    };
    const response = { 
      message: "success", 
      responseData: {
        id: 33,
        staffId: 163,
        authorizationAuthorityMasterId: 5,
        licenseNo: null,
        licenseLevel: null,
        initialIssueDate: null,
        currentIssueDate: null,
        expireDate: null,
        isdelete: false,
        createddate: "2026-08-16T09:25:46.73741+00:00",
        createdby: "navee",
        updateddate: "2026-08-16T09:25:46.7374238+00:00",
        updatedby: "navee",
        authorizationStatusId: 2
      }, 
      error: "" 
    };
    axiosMock.post.mockResolvedValueOnce({ data: response });

    await expect(upsertAuthorityLicense(request)).resolves.toBe(response);
    expect(axiosMock.post).toHaveBeenCalledWith("/authorization/authority-license/upsert", request);
  });
});

describe("authority authorization form validation", () => {
  it("requires every license date", () => {
    expect(validateAuthorityLicenseDates("", "", "")).toEqual({
      initialIssueDate: "Date of Initial Issue is required",
      currentIssueDate: "Date of Current Issue is required",
      expiryDate: "Date of Expire is required",
    });
  });

  it("rejects dates that are out of sequence", () => {
    expect(validateAuthorityLicenseDates("2026-07-20", "2026-07-19", "2026-07-18")).toEqual({
      currentIssueDate: "Current Issue must be on or after Initial Issue",
    });
    expect(validateAuthorityLicenseDates("2026-07-18", "2026-07-20", "2026-07-19")).toEqual({
      expiryDate: "Expire must be on or after Current Issue",
    });
  });

  it("accepts equal or increasing valid dates", () => {
    expect(validateAuthorityLicenseDates("2026-07-18", "2026-07-18", "2026-07-20")).toEqual({});
  });

  it("requires at least one aircraft license for save", () => {
    expect(validateAuthorityAircraftSelection(0)).toBe("Select at least one Aircraft License");
    expect(validateAuthorityAircraftSelection(1)).toBeNull();
  });
});
