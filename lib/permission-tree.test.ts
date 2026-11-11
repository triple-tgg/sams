import { describe, it, expect } from "vitest";
import { recalcParents, type PermTreeRow } from "./permission-tree";

type Row = PermTreeRow & { code: string };

const row = (
    menuId: number,
    code: string,
    depth: number,
    parentId: number | null,
    isParent: boolean,
    over: Partial<Row> = {}
): Row => ({
    menuId,
    code,
    _depth: depth,
    _isParent: isParent,
    _parentId: parentId,
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    ...over,
});

const byCode = (rows: Row[]) => Object.fromEntries(rows.map((r) => [r.code, r]));

describe("recalcParents", () => {
    it("derives a 3-level group from its sub-groups' new values, not their stale ones", () => {
        // State that hid Master Data: sub-group stored as false, page allowed.
        const rows = [
            row(34, "MASTER_DATA", 0, null, true),
            row(35, "MASTER_ORGANIZATION", 1, 34, true),
            row(36, "MASTER_DATA_DEPARTMENT", 2, 35, false, { canView: true, canEdit: true }),
            row(44, "MASTER_SYSTEM", 1, 34, true),
            row(47, "MASTER_DATA_ROLE", 2, 44, false),
        ];
        const out = byCode(recalcParents(rows));
        expect(out.MASTER_ORGANIZATION.canView).toBe(true);
        expect(out.MASTER_DATA.canView).toBe(true);
        expect(out.MASTER_DATA.canEdit).toBe(true);
        expect(out.MASTER_SYSTEM.canView).toBe(false);
        expect(out.MASTER_DATA.canDelete).toBe(false);
    });

    it("turns a stale true parent off when no child is allowed", () => {
        const rows = [
            row(13, "QA", 0, null, true, { canView: true }),
            row(14, "QA_TRAINING", 1, 13, true, { canView: true }),
            row(15, "QA_TRAINING_MONITORING", 2, 14, false),
        ];
        const out = byCode(recalcParents(rows));
        expect(out.QA_TRAINING.canView).toBe(false);
        expect(out.QA.canView).toBe(false);
    });

    it("keeps leaf values and order, and works with string ids", () => {
        const rows = [
            { ...row(0, "HR", 0, null, true), menuId: "23" },
            { ...row(0, "HR_STAFF", 1, null, false, { canExport: true }), menuId: "24", _parentId: "23" },
            { ...row(0, "CONTRACT", 0, null, false, { canView: true }), menuId: "5" },
        ];
        const out = recalcParents(rows);
        expect(out.map((r) => r.code)).toEqual(["HR", "HR_STAFF", "CONTRACT"]);
        expect(out[0].canExport).toBe(true);
        expect(out[0].canView).toBe(false);
        expect(out[2].canView).toBe(true);
    });
});
