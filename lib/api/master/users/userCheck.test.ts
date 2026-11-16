import { describe, expect, it } from "vitest";
import { findUserByEmail, resolveUserCheck } from "./userCheck";
import type { UserItem } from "./users.interface";

const user = (over: Partial<UserItem> = {}): UserItem => ({
    id: 7,
    username: "jdoe",
    email: "John.Doe@sams.aero",
    fullName: "John Doe",
    roleObj: { id: 2, code: "USER", name: "User", description: "", isdelete: false, createddate: "", createdby: "", updateddate: null, updatedby: null },
    isActive: true,
    flagInternal: false,
    staffEmployeeId: null,
    createdDate: "",
    createdBy: "",
    updatedDate: "",
    updatedBy: "",
    ...over,
});

describe("findUserByEmail", () => {
    it("matches exactly, ignoring case and spaces", () => {
        const list = [user({ id: 1, email: "john.doe@sams.aero.th" }), user({ id: 2 })];
        expect(findUserByEmail(list, "  john.doe@SAMS.aero ")?.id).toBe(2);
    });

    it("returns null for no match or an empty email", () => {
        expect(findUserByEmail([user()], "other@sams.aero")).toBeNull();
        expect(findUserByEmail([user()], "  ")).toBeNull();
        expect(findUserByEmail(null, "john.doe@sams.aero")).toBeNull();
    });
});

describe("resolveUserCheck", () => {
    it("is available when no account matches", () => {
        expect(resolveUserCheck(null, "E001")).toEqual({ status: "available", user: null });
    });

    it("is unlinked when the account has no employee ID", () => {
        expect(resolveUserCheck(user({ staffEmployeeId: null }), "E001").status).toBe("unlinked");
        expect(resolveUserCheck(user({ staffEmployeeId: "  " }), "E001").status).toBe("unlinked");
    });

    it("is linked-self when linked to the same employee", () => {
        expect(resolveUserCheck(user({ flagInternal: true, staffEmployeeId: "e001" }), "E001").status).toBe("linked-self");
    });

    it("is linked-other when linked to a different employee", () => {
        expect(resolveUserCheck(user({ flagInternal: true, staffEmployeeId: "E002" }), "E001").status).toBe("linked-other");
    });
});
