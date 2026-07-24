import { describe, expect, it } from "vitest";

import {
  buildAuthorityAuthRecordMap,
  getAuthorityAuthCellKey,
  mapAuthorityApiStatus,
  resolveAuthorityLicenseCell,
} from "./authority-auth.status";

describe("mapAuthorityApiStatus", () => {
  it.each(["REJ", "NAP", "Rejected", "Not Approved", "not_approve"])(
    "maps %s to the not-approved table state",
    status => {
      expect(mapAuthorityApiStatus(status)).toBe("not_approve");
    },
  );

  it("normalizes whitespace and casing from the API", () => {
    expect(mapAuthorityApiStatus("  rej  ")).toBe("not_approve");
  });

  it("maps wrapped /authority/list records by staff and authority", () => {
    const record = {
      authorizationAuthorityId: 15,
      staffId: 163,
      authorizationAuthorityMasterId: 2,
      authorizationStatus: { id: 2, code: "NAP", name: "Not Approved" },
    };

    const records = buildAuthorityAuthRecordMap([{ authorizationAuthority: record }]);

    expect(records.get(getAuthorityAuthCellKey(163, 2))).toBe(record);
  });

  it("uses the /authority/list status and record id over stale matrix values", () => {
    const matrixCell = {
      authorizationAuthorityId: 0,
      staffId: 163,
      authorizationAuthorityMasterId: 2,
      authorizationStatusId: 5,
      authorizationStatus: { id: 5, code: "PEN", name: "Pending" },
      status: "Pending",
    };
    const record = {
      ...matrixCell,
      authorizationAuthorityId: 15,
      authorizationStatusId: 2,
      authorizationStatus: { id: 2, code: "NAP", name: "Not Approved" },
      status: "NAP",
    };

    expect(resolveAuthorityLicenseCell(matrixCell as never, record as never)).toMatchObject({
      authorizationAuthorityId: 15,
      authorizationStatus: { code: "NAP" },
      status: "NAP",
    });
  });
});
