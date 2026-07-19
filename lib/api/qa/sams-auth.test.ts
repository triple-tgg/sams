import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import { getSamsAuthById, getSamsAuthList, upsertSamsAuth } from "./sams-auth";

describe("SAMs Authorization API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the server-side list filters and preserves the documented response", async () => {
    const request = {
      searchKeyword: "",
      status: "",
      page: 1,
      perPage: 20,
    };
    const response = {
      message: "success",
      responseData: [
        {
          authorizationSamsId: 1,
          staffId: 163,
          employeeName: "Aleks Reymer",
          employeeId: "EMP-0163",
          authorizationNo: "34353233",
          ratingAmel: ["A319", "A19N"],
          amelExpiryDate: "2026-05-29T00:00:00",
          initialIssueDate: "2026-07-19T00:00:00",
          currentIssueDate: "2026-07-19T00:00:00",
          samsExpiryDate: "2026-07-22T00:00:00",
          samsAuthStatus: "Expiring",
          daysToExpiry: 3,
          staffAircraftLicenseList: [
            {
              id: 176,
              staffId: 163,
              isdelete: false,
              createddate: "2026-07-18T15:12:12.147853",
              createdby: "navee",
              updateddate: null,
              updatedby: null,
              aircraftTypeLicensId: 1,
              aircraftTypeLicensObj: {
                id: 1,
                code: "B737-600/700/800/900",
                name: "B737-600/700/800/900",
                description: null,
                isdelete: false,
                createddate: "2026-05-29T10:22:42.670711",
                createdby: "system",
                updateddate: null,
                updatedby: null,
              },
            },
          ],
        },
        {
          authorizationSamsId: null,
          staffId: 198,
          employeeName: "Amnuay Srichomsaeng",
          employeeId: "-",
          authorizationNo: "",
          ratingAmel: [],
          amelExpiryDate: null,
          initialIssueDate: null,
          currentIssueDate: null,
          samsExpiryDate: null,
          samsAuthStatus: "Not Issued",
          daysToExpiry: 0,
          staffAircraftLicenseList: [],
        },
      ],
      page: 1,
      perPage: 20,
      total: 134,
      totalAll: 134,
      error: "",
    };
    axiosMock.post.mockResolvedValue({ data: response });

    await expect(getSamsAuthList(request)).resolves.toEqual(response);
    expect(axiosMock.post).toHaveBeenCalledWith(
      "/authorization/sams-auth/listdata",
      request,
    );
  });

  it("loads the nested SAMs Authorization detail contract by ID", async () => {
    const response = {
      message: "success",
      responseData: {
        authorizationSamses: {
          id: 1,
          staffId: 163,
          authNo: "34353233",
          initialIssueDate: "2026-07-19T00:00:00",
          currentIssueDate: "2026-07-19T00:00:00",
          expiryDate: "2026-07-22T00:00:00",
          staffAmelLicenseId: 1,
          isCrs: true,
          isdelete: false,
          createddate: "2026-06-05T23:28:47.822705",
          createdby: "system",
          updateddate: "2026-07-19T08:33:23.668468",
          updatedby: "",
        },
        authorizationSamsAircraftTypeLicens: [
          {
            id: 6,
            authorizationSamsId: 1,
            aircraftTypeId: 1,
            isdelete: false,
            createddate: "2026-07-19T08:33:23.682954",
            createdby: "",
            updateddate: "2026-07-19T08:33:23.682974",
            updatedby: "",
          },
        ],
        staff: {
          id: 163,
          code: "EMP-0163",
          name: "Aleks Reymer",
          staffstypeid: 1,
          createddate: "2025-12-25T11:53:08.301",
          createdby: "system",
          updateddate: "2026-07-18T15:12:12.103991",
          updatedby: "navee",
          isAcive: true,
          title: "Mr.",
          jobTitle: "Commercial Manager",
          email: "Aleks@sams.aero",
          fullNameEn: "Aleks Reymer",
          dateOfBirth: "2026-05-19",
          placeOfBirth: "-",
          nationality: "Thai",
          idCardNo: "1234567890",
          phone: "099999999",
          address: "dfsadfas",
          employeeId: "EMP-0163",
          startDate: "2026-05-19",
          positionId: 0,
          profileImagePath: "",
          staffDepartmentPositionId: 0,
          airlines: null,
        },
      },
      error: "",
    };
    axiosMock.get.mockResolvedValue({ data: response });

    await expect(getSamsAuthById(1)).resolves.toEqual(response);
    expect(axiosMock.get).toHaveBeenCalledWith("/authorization/sams-auth/byid/1");
  });

  it("posts the nested SAMs Authorization upsert contract", async () => {
    const request = {
      authorizationSamses: {
        id: 1,
        staffId: 163,
        authNo: "34353233",
        initialIssueDate: "2026-07-19T00:00:00.000Z",
        currentIssueDate: "2026-07-20T00:00:00.000Z",
        expiryDate: "2026-07-22T00:00:00.000Z",
        staffAmelLicenseId: 1,
        isCrs: true,
        isdelete: false,
        createddate: "2026-06-05T23:28:47.822705",
        createdby: "system",
        updateddate: "2026-07-19T12:30:28.553Z",
        updatedby: "navee",
      },
      authorizationSamsAircraftTypeLicenId: [1, 2],
    };
    const response = {
      message: "success",
      responseData: "Saved successfully.",
      error: "",
    };
    axiosMock.post.mockResolvedValue({ data: response });

    await expect(upsertSamsAuth(request)).resolves.toEqual(response);
    expect(axiosMock.post).toHaveBeenCalledWith(
      "/authorization/sams-auth/upsert",
      request,
    );
  });
});
