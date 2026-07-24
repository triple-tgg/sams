import type { AuthStatus } from "@/app/[locale]/(protected)/qa/authorization/types";

export type BindingSide = "SAMS" | "CUSTOMER";

export interface EffectiveValidity {
  effectiveValidTo: string | null;
  bindingSide: BindingSide | null;
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function computeEffectiveValidTo(
  samsValidTo: string | null | undefined,
  customerValidTo: string | null | undefined,
): EffectiveValidity {
  const samsTimestamp = toTimestamp(samsValidTo);
  const customerTimestamp = toTimestamp(customerValidTo);

  if (samsTimestamp === null || customerTimestamp === null) {
    return { effectiveValidTo: null, bindingSide: null };
  }

  if (samsTimestamp <= customerTimestamp) {
    return { effectiveValidTo: samsValidTo || null, bindingSide: "SAMS" };
  }

  return { effectiveValidTo: customerValidTo || null, bindingSide: "CUSTOMER" };
}

export function resolveMonitoringAuthStatus(
  code: string | null | undefined,
  name: string | null | undefined,
  daysToExpiry: number | null,
  expiryWarningDays: number,
): AuthStatus {
  const normalizedCode = (code || "").trim().toUpperCase();
  const normalizedName = (name || "").trim().toUpperCase();

  if (normalizedCode === "SUS" || normalizedName.includes("SUSPEND")) return "suspended";
  if (
    normalizedCode === "EXP"
    || normalizedName === "EXPIRED"
    || (daysToExpiry !== null && daysToExpiry < 0)
  ) return "expired";
  if (
    normalizedCode === "EXPIRING"
    || normalizedName.includes("EXPIRING")
    || (daysToExpiry !== null && daysToExpiry <= expiryWarningDays)
  ) return "expiring";
  if (
    normalizedCode === "VAL"
    || normalizedCode === "ACTIVE"
    || normalizedName === "VALID"
    || normalizedName === "ACTIVE"
  ) return "active";
  return "not-issued";
}

export function formatMonitoringDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatMonitoringAsOf(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted.replace(",", "")} ICT`;
}
