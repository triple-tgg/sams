import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}));

vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import {
    buildStaffUpsertRequest,
    uploadStaffFile,
    upsertStaff,
    type StaffByIdData,
} from "./staff-management";

describe("staff profile image API flow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("uploads the image then sends the returned filePath in a complete staff upsert", async () => {
        const staff = {
            id: 163,
            code: "EMP-0163",
            title: "Mr.",
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
            positionObj: {
                id: 4, name: "Commercial Manager", isdelete: false,
                createddate: "2026-01-01", createdby: "system", updateddate: null, updatedby: null,
            },
            departmentObj: {
                id: 2, name: "Commercial", isdelete: false,
                createddate: "2026-01-01", createdby: "system", updateddate: null, updatedby: null,
            },
            staffstypeObj: {
                id: 1, code: "STAFF", name: "Staff", description: "Staff",
                isdelete: false, createddate: "2026-01-01", createdby: "system",
                updateddate: "2026-01-01", updatedby: "system",
            },
            jobTitle: "Commercial Manager",
            profileImagePath: "/old/profile.jpg",
            educations: [],
            workExperiences: [],
            staffDocumentList: [],
            staffAircraftLicenseList: [],
            staffAmelLicenseList: [],
            isActive: true,
            createddate: "2026-01-01",
            createdby: "system",
            updateddate: "2026-07-19",
            updatedby: "navee",
        } satisfies StaffByIdData;
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
                fullNameTh: "Aleks Reymer",
                employeeId: "EMP-0163",
                profileImagePath: "/uploads/staff/profile.png",
            }),
        );
    });
});
