// ──────────────────────────────────────────────────────────────
// Aircraft & Engine — Master Data types
//
// `aircraft_engine_combination` is the single source of truth. Every
// other table derives/joins from it. Engine names are NEVER free text:
// they resolve through `engine_code` (FK) into `engine_master`.
//
// These interfaces mirror the DB schema documented in
// documents/aircraft-engine/schema.sql — keep them in sync.
// ──────────────────────────────────────────────────────────────

import type { Temporal } from "./aircraftEngine.temporal";

/** Review lifecycle for authorization-group changes (draft → review → publish). */
export type ReviewStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED";

/**
 * Auto-computed completeness of a group's membership/validation — CR-1.
 * Independent of the manual `reviewStatus`: downstream (FM-CM-063) requires BOTH
 * `reviewStatus === "PUBLISHED"` AND `completenessStatus === "complete"`.
 *  - `draft`      = no members yet (empty group; allowed, supports parallel work)
 *  - `incomplete` = has members but a validation issue is outstanding
 *  - `complete`   = has members and no outstanding issue
 */
export type CompletenessStatus = "draft" | "incomplete" | "complete";

export type ClassicNeo = "CLASSIC" | "NEO";

/** aircraft_family (family_code PK) */
export interface AircraftFamily {
  familyCode: string;
  familyName: string;
}

/** engine_master (engine_code PK) — controlled vocabulary for every engine dropdown */
export interface EngineMaster {
  engineCode: string;
  engineName: string;
  manufacturer: string;
  notes: string;
  updatedBy: string;
  /** ISO-8601 UTC. Rendered to local at display time via dateTimeUtils.fromApiFormat. */
  updatedAtUtc: string;
}

/**
 * aircraft_engine_combination — the atomic unit: one family + series + engine.
 *
 * Effective-dated (CR-3): `id` is the STABLE logical identity; edits are
 * append-only (close out the current version, insert a new one sharing the same
 * `id`). At most one version per `id` is active (`validTo === null`) at a time,
 * so `authorization_group_member.combinationId` FKs stay stable across edits.
 */
export interface AircraftEngineCombination extends Temporal {
  id: number;
  familyCode: string;
  /** Optional; empty when the family has no sub-series (e.g. A318). */
  series: string;
  engineCode: string;
  /** Derived + persisted: `{family}{-series?} ({engineName})`. Read-only in the UI. */
  displayLabel: string;
  updatedBy: string;
  updatedAtUtc: string;
}

/**
 * authorization_group_member — the temporal junction (CR-3).
 * Append-only: adding a combination inserts a row; removing it closes the row out
 * (`validTo = now`) rather than deleting, so a group's membership can be
 * reconstructed as it was at any past instant.
 */
export interface AuthGroupMember extends Temporal {
  groupId: string;
  combinationId: number;
}

/**
 * authorization_type_group (group_id PK).
 * Membership lives in the `authorization_group_member` junction table; in the mock
 * store it is denormalised onto `memberCombinationIds` for convenience.
 *
 * `legacyEngineLabels` holds not-yet-reconciled free-text engine names imported from
 * the old Excel files. The validation layer flags any that fail to resolve against
 * engine_master — this is how pre-migration drift ("IAE V500", "RR211 …") surfaces
 * without reintroducing a free-text engine column into the clean schema.
 */
export interface AuthorizationTypeGroup {
  groupId: string;
  groupLabel: string;
  /** Active membership (validTo IS NULL), derived from the temporal junction on read. */
  memberCombinationIds: number[];
  reviewStatus: ReviewStatus;
  /** Auto-computed (CR-1). Recomputed on every membership/validation change; never set by hand. */
  completenessStatus: CompletenessStatus;
  /**
   * Precomputed engine roll-up (CR-4). Regenerated at the same trigger point as
   * `completenessStatus`. Read paths consume THIS; the junction is only touched
   * when membership is edited or the roll-up is regenerated.
   */
  engineListCached: string[];
  /**
   * Per-customer override (CR-2). `null` = global default shared by all airlines;
   * a value = override scoped to that airline (`airlines.id`). Resolution prefers a
   * customer's own group over the global one — see `resolveGroupsForCustomer`.
   */
  customerId: number | null;
  /** UTC instant the completenessStatus last became non-`complete` (for banner staleness escalation, CR-1). */
  incompleteSinceUtc?: string | null;
  legacyEngineLabels?: string[];
  submittedBy?: string;
  submittedAtUtc?: string;
  reviewedBy?: string;
  publishedBy?: string;
  publishedAtUtc?: string;
  updatedBy: string;
  updatedAtUtc: string;
}

/** aircraft_system_config (icao_code PK) */
export interface AircraftSystemConfig {
  icaoCode: string;
  familyCode: string;
  modelVariant: string;
  classicNeo: ClassicNeo;
  engineCount: number;
  generatorCount: number;
  hydraulicCount: number;
  hasApu: boolean;
  /** Legacy free-text engine label from the old Systems-master Excel; validated, not authoritative. */
  legacyEngineLabel?: string;
  updatedBy: string;
  updatedAtUtc: string;
}

// ── Data-quality findings ─────────────────────────────────────

export type DataQualityCategory =
  | "ORPHAN" // combination not in any authorization group
  | "MISSING_CONFIG" // family in combinations but absent from system config (or reverse)
  | "NAMING" // engine label elsewhere doesn't match engine_master exactly
  | "STALE_GROUP"; // group stuck below `complete` — escalates to red past the SLA (CR-1)

/** Banner severity. A single `red` finding escalates the whole banner (CR-1). */
export type DataQualitySeverity = "amber" | "red";

export interface DataQualityFinding {
  id: string;
  category: DataQualityCategory;
  message: string;
  /** Defaults to `amber` when unset. `red` = past the completeness SLA (CR-1). */
  severity?: DataQualitySeverity;
  /** Suggested correction (e.g. the nearest engine_master name). */
  suggestion?: string;
}

// ── Referential-integrity guard result (soft-block deletes) ───

export interface ReferenceCheck {
  blocked: boolean;
  /** Human-readable list of what still references the record. */
  references: string[];
}
