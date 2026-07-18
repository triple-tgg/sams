// ──────────────────────────────────────────────────────────────
// Effective-dating (temporal) scope — CR-3.
//
// Master-data rows are append-only: an edit closes out the current version
// (`validTo = now`) and inserts a new one; a delete of a referenced row is a
// close-out, never a physical delete. This is what lets a FM-CM-063 / CRS issued
// in the past be reconstructed against the master data *as it was on that date*
// (CAAT / EASA Part-145 traceability).
//
// This module is the SINGLE place the "active-only" / point-in-time condition
// lives. Do NOT scatter `validTo === null` across the codebase — call `isActiveAt`
// / `activeAt` so the rule (and any future half-open-interval tweak) stays in one
// spot. Pure + dependency-free so it can move server-side unchanged.
// ──────────────────────────────────────────────────────────────

export interface Temporal {
  /** ISO-8601 UTC — when this version became active (default = created_at). */
  validFrom: string;
  /** ISO-8601 UTC, or null when still active. */
  validTo: string | null;
}

/**
 * Is `row` the version in force at `asOf`?
 * - `asOf === undefined` → "now": the open version (`validTo === null`).
 * - otherwise → point-in-time: the half-open interval `[validFrom, validTo)`.
 *
 * Timestamps are same-format UTC ISO strings, so lexicographic compare is correct.
 */
export function isActiveAt(row: Temporal, asOf?: string): boolean {
  if (asOf === undefined) return row.validTo === null;
  return row.validFrom <= asOf && (row.validTo === null || asOf < row.validTo);
}

/** The subset of `rows` in force at `asOf` (or now when `asOf` is omitted). */
export function activeAt<T extends Temporal>(rows: T[], asOf?: string): T[] {
  return rows.filter((r) => isActiveAt(r, asOf));
}
