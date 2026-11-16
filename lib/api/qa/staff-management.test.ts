import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}));

vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import {
    buildStaffUpsertRequest,
    formatEducationYears,
    uploadStaffFile,
    upsertStaff,
    type StaffByIdData,
} from "./staff-management";

const makeStaff = (over: Partial<StaffByIdData> = {}): StaffByIdData => ({
    id: 163,
    code: "EMP-0163",
    titleId: 1,
    titleObj: { id: 1, nameEn: "Mr.", nameTh: "นาย", sortOrder: 10, isdelete: false },
    name: "Aleks Reymer",
    fullNameEn: "Aleks Reymer",
    dateOfBirth: "2026-05-19",
    placeOfBirth: "-",
    nationality: "Thai",
    idCardNo: "1234567890",
    phone: "099999999",
    email: "Aleks@sams.aero",
    address: "Address",
    employeeId: "EMP-0163",
    startDate: "2026-05-19",
    endWorkingDate: null,
    positionObj: {
        id: 4, code: "CM", name: "Commercial Manager", description: null, staffDepartmentId: 2,
        isdelete: false, createddate: "2026-01-01", createdby: "system", updateddate: null, updatedby: null,
    },
    departmentObj: {
        id: 2, code: "Commercial", name: "Commercial", description: null,
        isdelete: false, createddate: "2026-01-01", createdby: "system", updateddate: null, updatedby: null,
    },
    staffstypeObj: {
        id: 1, code: "STAFF", name: "Staff", description: "Staff",
        isdelete: false, createddate: "2026-01-01", createdby: "system",
        updateddate: "2026-01-01", updatedby: "system",
    },
    stationId: null,
    stationObj: null,
    jobTitle: "Commercial Manager",
    profileImagePath: "/old/profile.jpg",
    educations: [],
    workExperiences: [],
    staffDocumentList: [],
    staffAircraftLicenseList: [],
    staffAmelLicenseList: [],
    staffStationTransferList: [],
    isActive: true,
    createddate: "2026-01-01",
    createdby: "system",
    updateddate: "2026-07-19",
    updatedby: "navee",
    ...over,
});

describe("staff profile image API flow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("uploads the image then sends the returned filePath in a complete staff upsert", async () => {
        const staff = makeStaff();
        const uploadRequest = {
            FileBase64: "aW1hZ2U=",
            FileType: "staff_profile",
            ExtensionFile: "png",
            FileName: "profile",
        };
        const uploadResponse = {
            message: "success",
            responseData: [{
                filePath: "/uploads/staff/profile.png",
                fileName: "profile.png",
                fileType: "staff_profile",
            }],
            error: null,
        };
        const upsertResponse = {
            message: "success",
            responseData: [{ staffId: 163 }],
            error: "",
        };
        axiosMock.post
            .mockResolvedValueOnce({ data: uploadResponse })
            .mockResolvedValueOnce({ data: upsertResponse });

        const uploaded = await uploadStaffFile(uploadRequest);
        const payload = buildStaffUpsertRequest(staff, {
            profileImagePath: uploaded.responseData[0].filePath,
        });
        await expect(upsertStaff(payload)).resolves.toEqual(upsertResponse);

        expect(axiosMock.post).toHaveBeenNthCalledWith(
            1,
            "/master/staff-management/uploadfile",
            uploadRequest,
        );
        expect(axiosMock.post).toHaveBeenNthCalledWith(
            2,
            "/master/staff-management/upsert",
            expect.objectContaining({
                staffId: 163,
                titleId: 1,
                fullNameTh: "Aleks Reymer",
                employeeId: "EMP-0163",
                profileImagePath: "/uploads/staff/profile.png",
            }),
        );
    });
});

describe("staff education years", () => {
    it("formats start / end years, treating 0 and null as unknown", () => {
        expect(formatEducationYears(2017, 2021)).toBe("2017 – 2021");
        expect(formatEducationYears(null, 2021)).toBe("2021");
        expect(formatEducationYears(0, 2021)).toBe("2021");
        expect(formatEducationYears(2021, 2021)).toBe("2021");
        expect(formatEducationYears(2024, 0)).toBe("2024 – Present");
        expect(formatEducationYears(null, null)).toBe("");
    });

    it("sends startYear / endYear and drops deleted educations in the upsert", () => {
        const audit = { staffId: 163, createddate: "", createdby: "", updateddate: "", updatedby: "" };
        const payload = buildStaffUpsertRequest(makeStaff({
            educations: [
                { id: 1, degree: "Bachelor", institution: "KMITL", fieldOfStudy: "Aero", startYear: 2017, endYear: 2021, isdelete: false, ...audit },
                { id: 2, degree: "Master", institution: "CU", fieldOfStudy: "", startYear: null, endYear: 2023, isdelete: false, ...audit },
                { id: 3, degree: "Old", institution: "X", fieldOfStudy: "", startYear: 2000, endYear: 2004, isdelete: true, ...audit },
            ],
        }));
        expect(payload.educations).toEqual([
            { id: 1, degree: "Bachelor", institution: "KMITL", fieldOfStudy: "Aero", startYear: 2017, endYear: 2021 },
            { id: 2, degree: "Master", institution: "CU", fieldOfStudy: "", startYear: 0, endYear: 2023 },
        ]);
    });
});
