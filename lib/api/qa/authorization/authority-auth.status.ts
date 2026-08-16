import type { CustomerAuthValue } from "@/app/[locale]/(protected)/qa/authorization/types-v2";
import type { AuthorityLicenseCell } from "./authority-auth";

export function getAuthorityAuthCellKey(staffId: number, authorityMasterId: number): string {
  return `${staffId}:${authorityMasterId}`;
}

export function buildAuthorityAuthRecordMap(records: unknown[]): Map<string, AuthorityLicenseCell> {
  const map = new Map<string, AuthorityLicenseCell>();

  records.forEach(item => {
    if (!item || typeof item !== "object") return;
    const wrapper = item as Record<string, unknown>;
    const record = (wrapper.authorizationAuthority ?? item) as Partial<AuthorityLicenseCell>;
    const staffId = Number(record.staffId);
    const authorityMasterId = Number(
      record.authorizationAuthorityMasterId ?? record.aviationAuthorityId,
    );

    if (staffId > 0 && authorityMasterId > 0) {
      map.set(
        getAuthorityAuthCellKey(staffId, authorityMasterId),
        record as AuthorityLicenseCell,
      );
    }
  });

  return map;
}

export function resolveAuthorityLicenseCell(
  matrixCell: AuthorityLicenseCell | undefined,
  record: AuthorityLicenseCell | undefined,
): AuthorityLicenseCell | undefined {
  if (!record) return matrixCell;
  if (!matrixCell) return record;

  return {
    ...matrixCell,
    ...record,
    // The matrix API (/authority-auth/listdata) is the authoritative source for
    // status. The /authority/list record is supplementary data (record IDs,
    // aircraft, etc.) and must NOT overwrite the matrix's computed status.
    authorizationStatus: matrixCell.authorizationStatus ?? record.authorizationStatus,
    status: matrixCell.status ?? record.status,
    aviationAuthorityLicense: record.aviationAuthorityLicense ?? matrixCell.aviationAuthorityLicense,
    aviationAuthorityLicenseAircrafts:
      record.aviationAuthorityLicenseAircrafts ?? matrixCell.aviationAuthorityLicenseAircrafts,
  };
}

export function mapAuthorityApiStatus(
  apiStatus: string | null | undefined,
): CustomerAuthValue {
  if (!apiStatus) return "pending";

  switch (apiStatus.trim().toLowerCase()) {
    case "valid":
    case "val":
      return "valid";
    case "expired":
    case "exp":
      return "suspended";
    case "expiring":
    case "expi":
      return "not_complete";
    case "not approved":
    case "not_approve":
    case "not approve":
    case "nap":
    case "rej":
    case "rejected":
      return "not_approve";
    case "pending":
    case "pen":
    default:
      return "pending";
  }
}
