// ──────────────────────────────────────────────────────────────
// In-memory test fixture for the Aircraft & Engine master-data domain.
//
// Production hooks use aircraftEngine.ts and the backend REST API. This store is
// retained for deterministic pure-logic tests of temporal history, completeness,
// customer overrides, and roll-up caching. Keep the seed drift intact because
// those tests intentionally exercise the anti-drift rules.
//
// Effective dating (CR-3): combinations and group membership are append-only and
// effective-dated (validFrom/validTo). Edits close out the current version and
// insert a new one; deletes of referenced rows are close-outs. Reads default to
// "active now" but accept an `asOf` for point-in-time reconstruction. The
// active-only condition lives in aircraftEngine.temporal.ts — not inlined here.
//
// Derived group data (CR-1 completeness, CR-4 engine roll-up) is recomputed at a
// single trigger point (`recomputeAllGroups`) on every write that can affect it.
// ──────────────────────────────────────────────────────────────

import type {
  AircraftEngineCombination,
  AircraftFamily,
  AircraftSystemConfig,
  AuthGroupMember,
  AuthorizationTypeGroup,
  EngineMaster,
  ReferenceCheck,
} from "./aircraftEngine.types";
import { activeAt, isActiveAt } from "./aircraftEngine.temporal";
import {
  computeCompletenessStatus,
  filterDownstreamGroups,
  resolveGroupsForCustomer,
  rollUpGroupEngines,
} from "./aircraftEngine.validation";

/** Actor stamped on writes. SWAP POINT: replace with the session user. */
export const MOCK_ACTOR = "master.data.admin";

const SEED_TS = "2026-06-01T03:00:00.000Z";

/** Simulate network latency so loading states are exercised (skipped under tests). */
const latency = () =>
  process.env.VITEST ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, 180));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export const nowUtc = () => new Date().toISOString();

// ── Display-label derivation (single source of the format rule) ──
export function buildDisplayLabel(
  familyCode: string,
  series: string,
  engineName: string,
): string {
  const base = series ? `${familyCode}-${series}` : familyCode;
  return `${base} (${engineName})`;
}

// ── Seed: aircraft_family ─────────────────────────────────────
let families: AircraftFamily[] = [
  { familyCode: "B737", familyName: "Boeing 737" },
  { familyCode: "A318", familyName: "Airbus A318" },
  { familyCode: "A319", familyName: "Airbus A319" },
  { familyCode: "A320", familyName: "Airbus A320" },
  { familyCode: "A321", familyName: "Airbus A321" },
  { familyCode: "B777", familyName: "Boeing 777" },
  { familyCode: "A330", familyName: "Airbus A330" },
  { familyCode: "B787", familyName: "Boeing 787" },
  { familyCode: "B767", familyName: "Boeing 767" },
  { familyCode: "A350", familyName: "Airbus A350" },
  { familyCode: "E190", familyName: "Embraer E190" },
];

// ── Seed: engine_master (controlled vocabulary) ───────────────
const engineSeed: Array<[string, string, string, string]> = [
  ["CFM56", "CFM56", "CFM International", "Classic narrow/wide-body"],
  ["LEAP1A", "CFM LEAP-1A", "CFM International", "A320neo family"],
  ["LEAP1B", "CFM LEAP-1B", "CFM International", "B737 MAX family"],
  ["V2500", "V2500", "IAE", "A320ceo family"],
  ["PW1100G", "IAE PW1100G", "IAE / Pratt & Whitney", "A320neo family (GTF)"],
  ["TRENT800", "RB211 Trent 800", "Rolls-Royce", "B777 classic"],
  ["GE90", "GE90", "GE Aerospace", "B777 classic"],
  ["TRENT700", "RR Trent 700", "Rolls-Royce", "A330ceo"],
  ["CF6", "GE CF6", "GE Aerospace", "A330ceo, B767"],
  ["PW4000", "PW4000", "Pratt & Whitney", "A330ceo, B767"],
  ["TRENT7000", "RR Trent 7000", "Rolls-Royce", "A330neo"],
  ["TRENT1000", "RB211 Trent 1000", "Rolls-Royce", "B787"],
  ["GENX", "GEnx", "GE Aerospace", "B787"],
  ["RB211", "RB211", "Rolls-Royce", "B767 classic"],
  ["TRENTXWB", "RR Trent XWB", "Rolls-Royce", "A350"],
  ["PW1900G", "PW1900G", "Pratt & Whitney", "E190/195-E2 (GTF)"],
];
let engines: EngineMaster[] = engineSeed.map(([engineCode, engineName, manufacturer, notes]) => ({
  engineCode,
  engineName,
  manufacturer,
  notes,
  updatedBy: MOCK_ACTOR,
  updatedAtUtc: SEED_TS,
}));

const engineNameOf = (engineCode: string) =>
  engines.find((e) => e.engineCode === engineCode)?.engineName ?? engineCode;

// ── Seed: aircraft_engine_combination (source of truth) ───────
// [familyCode, series, engineCode]
const comboSeed: Array<[string, string, string]> = [
  ["B737", "600", "CFM56"], ["B737", "700", "CFM56"], ["B737", "800", "CFM56"], ["B737", "900", "CFM56"],
  ["B737", "7", "LEAP1B"], ["B737", "8", "LEAP1B"], ["B737", "9", "LEAP1B"], ["B737", "10", "LEAP1B"], ["B737", "8200", "LEAP1B"],
  ["A318", "", "CFM56"],
  ["A319", "", "CFM56"], ["A319", "", "V2500"], ["A319", "", "PW1100G"], ["A319", "", "LEAP1A"],
  ["A320", "", "CFM56"], ["A320", "", "V2500"], ["A320", "", "PW1100G"], ["A320", "", "LEAP1A"],
  ["A321", "", "CFM56"], ["A321", "", "V2500"], ["A321", "", "PW1100G"], ["A321", "", "LEAP1A"],
  ["B777", "200", "TRENT800"], ["B777", "200", "GE90"], ["B777", "300", "TRENT800"], ["B777", "300", "GE90"],
  ["B777", "300ER", "TRENT800"], ["B777", "300ER", "GE90"], ["B777", "F", "TRENT800"], ["B777", "F", "GE90"],
  ["A330", "200", "TRENT700"], ["A330", "200", "CF6"], ["A330", "200", "PW4000"],
  ["A330", "300", "TRENT700"], ["A330", "300", "CF6"], ["A330", "300", "PW4000"],
  ["A330", "800", "TRENT7000"], ["A330", "900", "TRENT7000"],
  ["B787", "8", "TRENT1000"], ["B787", "8", "GENX"], ["B787", "9", "TRENT1000"], ["B787", "9", "GENX"], ["B787", "10", "TRENT1000"], ["B787", "10", "GENX"],
  ["B767", "200", "PW4000"], ["B767", "200", "RB211"], ["B767", "300", "PW4000"], ["B767", "300", "RB211"],
  ["A350", "900", "TRENTXWB"], ["A350", "1000", "TRENTXWB"],
  ["E190", "", "PW1900G"],
];
let combinations: AircraftEngineCombination[] = comboSeed.map(([familyCode, series, engineCode], i) => ({
  id: i + 1,
  familyCode,
  series,
  engineCode,
  displayLabel: buildDisplayLabel(familyCode, series, engineNameOf(engineCode)),
  validFrom: SEED_TS,
  validTo: null,
  updatedBy: MOCK_ACTOR,
  updatedAtUtc: SEED_TS,
}));
let comboSeq = combinations.length;

/** Resolve ACTIVE combination ids for a family (optionally limited to a set of series). */
const memberIds = (familyCode: string, series?: string[]) =>
  activeAt(combinations)
    .filter((c) => c.familyCode === familyCode && (!series || series.includes(c.series)))
    .map((c) => c.id);

// ── Seed: authorization_type_group + membership (temporal junction) ──
// Intentional drift baked in:
//  • "B737-7/8/9" excludes the -10 and -8200 combos → ORPHANs, and leaves the
//    group INCOMPLETE (same family+engine series unbound) — exercises CR-1.
//  • "A318/A319/A320/A321" carries an unreconciled legacy label "IAE V500" →
//    NAMING finding, and the group is INCOMPLETE until reconciled.
type GroupSeed = {
  groupId: string;
  groupLabel: string;
  members: number[];
  reviewStatus: "DRAFT" | "IN_REVIEW" | "PUBLISHED";
  legacyEngineLabels?: string[];
};
const groupSeed: GroupSeed[] = [
  { groupId: "AG-737NG", groupLabel: "B737-600/700/800/900", members: memberIds("B737", ["600", "700", "800", "900"]), reviewStatus: "PUBLISHED" },
  { groupId: "AG-737MAX", groupLabel: "B737-7/8/9", members: memberIds("B737", ["7", "8", "9"]), reviewStatus: "PUBLISHED" },
  { groupId: "AG-A320", groupLabel: "A318/A319/A320/A321", members: [...memberIds("A318"), ...memberIds("A319"), ...memberIds("A320"), ...memberIds("A321")], reviewStatus: "PUBLISHED", legacyEngineLabels: ["IAE V500"] },
  { groupId: "AG-777", groupLabel: "B777-200/300/300ER", members: memberIds("B777"), reviewStatus: "PUBLISHED" },
  { groupId: "AG-330", groupLabel: "A330-200/300/800/900", members: memberIds("A330"), reviewStatus: "PUBLISHED" },
  { groupId: "AG-787", groupLabel: "B787-8/9/10", members: memberIds("B787"), reviewStatus: "PUBLISHED" },
  { groupId: "AG-767", groupLabel: "B767-200/300", members: memberIds("B767"), reviewStatus: "PUBLISHED" },
  { groupId: "AG-350", groupLabel: "A350-900/1000", members: memberIds("A350"), reviewStatus: "PUBLISHED" },
  { groupId: "AG-E190", groupLabel: "ERJ-190", members: memberIds("E190"), reviewStatus: "PUBLISHED" },
];

let groupMembers: AuthGroupMember[] = groupSeed.flatMap((g) =>
  g.members.map((combinationId) => ({ groupId: g.groupId, combinationId, validFrom: SEED_TS, validTo: null })),
);

let authGroups: AuthorizationTypeGroup[] = groupSeed.map((g) => ({
  groupId: g.groupId,
  groupLabel: g.groupLabel,
  memberCombinationIds: [], // filled by recomputeAllGroups() below
  reviewStatus: g.reviewStatus,
  completenessStatus: "draft", // recomputed below
  engineListCached: [], // recomputed below
  customerId: null, // all seed groups are global (CR-2)
  legacyEngineLabels: g.legacyEngineLabels,
  publishedBy: g.reviewStatus === "PUBLISHED" ? MOCK_ACTOR : undefined,
  publishedAtUtc: g.reviewStatus === "PUBLISHED" ? SEED_TS : undefined,
  updatedBy: MOCK_ACTOR,
  updatedAtUtc: SEED_TS,
}));
let groupSeq = authGroups.length;

// ── Seed: aircraft_system_config ──────────────────────────────
// Intentional drift: no rows for A318 or A350 → MISSING_CONFIG findings.
// One legacy free-text engine label "RR211 Trent 1000" → NAMING finding.
type SysTuple = [string, string, "CLASSIC" | "NEO", string, number, number, number, boolean, string?];
const sysSeed: SysTuple[] = [
  ["A319", "A319-100", "CLASSIC", "A319", 2, 2, 4, true],
  ["A319", "A319neo", "NEO", "A19N", 2, 2, 4, true],
  ["A320", "A320-200", "CLASSIC", "A320", 2, 2, 4, true],
  ["A320", "A320neo", "NEO", "A20N", 2, 2, 4, true],
  ["A321", "A321-200", "CLASSIC", "A321", 2, 2, 4, true],
  ["A321", "A321neo / LR / XLR", "NEO", "A21N", 2, 2, 4, true],
  ["A330", "A330-200", "CLASSIC", "A332", 2, 2, 4, true],
  ["A330", "A330-300", "CLASSIC", "A333", 2, 2, 4, true],
  ["A330", "A330-800neo", "NEO", "A338", 2, 2, 4, true],
  ["A330", "A330-900neo", "NEO", "A339", 2, 2, 4, true],
  ["B737", "737-800 (NG)", "CLASSIC", "B738", 2, 2, 3, true],
  ["B737", "737-900ER (NG)", "CLASSIC", "B739", 2, 2, 3, true],
  ["B737", "737 MAX 8", "NEO", "B38M", 2, 2, 3, true],
  ["B737", "737 MAX 9", "NEO", "B39M", 2, 2, 3, true],
  ["B767", "767-200", "CLASSIC", "B762", 2, 2, 4, true],
  ["B767", "767-300ER", "CLASSIC", "B763", 2, 2, 4, true],
  ["B767", "767-400ER", "CLASSIC", "B764", 2, 2, 4, true],
  ["B777", "777-200", "CLASSIC", "B772", 2, 2, 4, true],
  ["B777", "777-200LR", "CLASSIC", "B77L", 2, 2, 4, true],
  ["B777", "777-300", "CLASSIC", "B773", 2, 2, 4, true],
  ["B777", "777-300ER", "CLASSIC", "B77W", 2, 2, 4, true],
  ["B777", "777F (Freighter)", "CLASSIC", "B77F", 2, 2, 4, true],
  ["B787", "787-8 Dreamliner", "NEO", "B788", 2, 4, 4, true, "RR211 Trent 1000"],
  ["B787", "787-9 Dreamliner", "NEO", "B789", 2, 4, 4, true],
  ["B787", "787-10 Dreamliner", "NEO", "B78X", 2, 4, 4, true],
  ["E190", "E190 (E1)", "CLASSIC", "E190", 2, 2, 4, true],
  ["E190", "E195 (E1)", "CLASSIC", "E195", 2, 2, 4, true],
  ["E190", "E190-E2", "NEO", "E290", 2, 2, 4, true],
  ["E190", "E195-E2", "NEO", "E295", 2, 2, 4, true],
];
let systemConfigs: AircraftSystemConfig[] = sysSeed.map(
  ([familyCode, modelVariant, classicNeo, icaoCode, engineCount, generatorCount, hydraulicCount, hasApu, legacyEngineLabel]) => ({
    icaoCode,
    familyCode,
    modelVariant,
    classicNeo,
    engineCount,
    generatorCount,
    hydraulicCount,
    hasApu,
    legacyEngineLabel,
    updatedBy: MOCK_ACTOR,
    updatedAtUtc: SEED_TS,
  }),
);

// ══════════════════════════════════════════════════════════════
// Derived-data recompute — the SINGLE trigger point for CR-1 (completeness
// status) and CR-4 (engine-list cache). Called after any write that can change a
// group's active membership, its combinations, or the engine vocabulary.
// ══════════════════════════════════════════════════════════════

/** Active member combination ids for a group at `asOf` (or now). */
function activeMemberIds(groupId: string, asOf?: string): number[] {
  const seen = new Set<number>();
  for (const m of groupMembers) {
    if (m.groupId === groupId && isActiveAt(m, asOf)) seen.add(m.combinationId);
  }
  return Array.from(seen);
}

/**
 * Recompute `memberCombinationIds`, `engineListCached` (CR-4) and
 * `completenessStatus` (CR-1) for every group from the active junction + combos.
 * Also maintains `incompleteSinceUtc` (when the group first left `complete`),
 * which the banner uses to escalate amber → red past the SLA.
 */
function recomputeAllGroups(at: string = nowUtc()): void {
  const activeCombos = activeAt(combinations);
  authGroups = authGroups.map((g) => {
    const memberCombinationIds = activeMemberIds(g.groupId);
    const view = { ...g, memberCombinationIds };
    const engineListCached = rollUpGroupEngines(view, activeCombos, engines);
    const completenessStatus = computeCompletenessStatus(view, activeCombos, engines);
    let incompleteSinceUtc = g.incompleteSinceUtc ?? null;
    if (completenessStatus === "complete") {
      incompleteSinceUtc = null;
    } else if (g.completenessStatus === "complete" || incompleteSinceUtc == null) {
      // Newly non-complete (or first computation): start the staleness clock.
      incompleteSinceUtc = g.completenessStatus === "complete" ? at : (g.updatedAtUtc ?? at);
    }
    return { ...g, memberCombinationIds, engineListCached, completenessStatus, incompleteSinceUtc };
  });
}
recomputeAllGroups(SEED_TS); // seed derived columns

// ══════════════════════════════════════════════════════════════
// Async "API" — one function per operation the hooks call.
// ══════════════════════════════════════════════════════════════

// ── engine_master ──
export async function fetchEngines(): Promise<EngineMaster[]> {
  await latency();
  return clone(engines);
}
export async function upsertEngine(input: EngineMaster): Promise<EngineMaster> {
  await latency();
  const record: EngineMaster = { ...input, updatedBy: MOCK_ACTOR, updatedAtUtc: nowUtc() };
  const idx = engines.findIndex((e) => e.engineCode === input.engineCode);
  if (idx >= 0) engines[idx] = record;
  else engines = [...engines, record];
  // Keep denormalised combination labels in step with any engine-name change
  // (rewrite the ACTIVE version of every referencing combination).
  combinations = combinations.map((c) =>
    c.engineCode === record.engineCode && c.validTo === null
      ? { ...c, displayLabel: buildDisplayLabel(c.familyCode, c.series, record.engineName) }
      : c,
  );
  recomputeAllGroups();
  return clone(record);
}
export function checkEngineReferences(engineCode: string): ReferenceCheck {
  const refs = activeAt(combinations).filter((c) => c.engineCode === engineCode);
  return {
    blocked: refs.length > 0,
    references: refs.map((c) => `combination: ${c.displayLabel}`),
  };
}
export async function deleteEngine(engineCode: string): Promise<void> {
  await latency();
  if (checkEngineReferences(engineCode).blocked) {
    throw new Error("REFERENCED");
  }
  engines = engines.filter((e) => e.engineCode !== engineCode);
}

// ── aircraft_family ──
export async function fetchFamilies(): Promise<AircraftFamily[]> {
  await latency();
  return clone(families);
}
export async function addFamily(input: AircraftFamily): Promise<AircraftFamily> {
  await latency();
  if (families.some((f) => f.familyCode === input.familyCode)) {
    throw new Error("DUPLICATE");
  }
  families = [...families, { ...input }];
  return clone(input);
}

// ── aircraft_engine_combination (effective-dated, append-only) ──
/** Active combinations at `asOf` (or now for the default read path). */
export async function fetchCombinations(asOf?: string): Promise<AircraftEngineCombination[]> {
  await latency();
  return clone(activeAt(combinations, asOf));
}
export interface CombinationInput {
  id?: number;
  familyCode: string;
  series: string;
  engineCode: string;
}
export async function upsertCombination(input: CombinationInput): Promise<AircraftEngineCombination> {
  await latency();
  const displayLabel = buildDisplayLabel(input.familyCode, input.series, engineNameOf(input.engineCode));
  const at = nowUtc();
  if (input.id) {
    // Edit = append-only: close out the current active version, insert a new one
    // that reuses the same stable `id` (so member FKs are unaffected).
    const current = combinations.find((c) => c.id === input.id && c.validTo === null);
    if (!current) throw new Error("NOT_FOUND");
    combinations = combinations.map((c) =>
      c.id === input.id && c.validTo === null ? { ...c, validTo: at } : c,
    );
    const record: AircraftEngineCombination = {
      id: input.id,
      familyCode: input.familyCode,
      series: input.series,
      engineCode: input.engineCode,
      displayLabel,
      validFrom: at,
      validTo: null,
      updatedBy: MOCK_ACTOR,
      updatedAtUtc: at,
    };
    combinations = [...combinations, record];
    recomputeAllGroups(at);
    return clone(record);
  }
  const record: AircraftEngineCombination = {
    id: ++comboSeq,
    familyCode: input.familyCode,
    series: input.series,
    engineCode: input.engineCode,
    displayLabel,
    validFrom: at,
    validTo: null,
    updatedBy: MOCK_ACTOR,
    updatedAtUtc: at,
  };
  combinations = [...combinations, record];
  recomputeAllGroups(at);
  return clone(record);
}
export function checkCombinationReferences(id: number): ReferenceCheck {
  const refGroupIds = new Set(
    activeAt(groupMembers).filter((m) => m.combinationId === id).map((m) => m.groupId),
  );
  const refs = authGroups.filter((g) => refGroupIds.has(g.groupId));
  return {
    blocked: refs.length > 0,
    references: refs.map((g) => `authorization group: ${g.groupLabel}`),
  };
}
/** True if this combination id has EVER been a group member (active or historical). */
function everReferenced(id: number): boolean {
  return groupMembers.some((m) => m.combinationId === id);
}
export async function deleteCombination(id: number): Promise<void> {
  await latency();
  // Soft-block: cannot delete while it is an ACTIVE member (existing UX).
  if (checkCombinationReferences(id).blocked) {
    throw new Error("REFERENCED");
  }
  if (everReferenced(id)) {
    // Was referenced historically (e.g. by a past FM-CM-063) → close out, never
    // hard delete, so that past record stays reconstructable (CR-3).
    const at = nowUtc();
    combinations = combinations.map((c) =>
      c.id === id && c.validTo === null ? { ...c, validTo: at } : c,
    );
    return;
  }
  // Never referenced anywhere → hard delete is safe (existing behaviour).
  combinations = combinations.filter((c) => c.id !== id);
}

// ── authorization_type_group ──
export interface FetchAuthGroupsOptions {
  /** Point-in-time reconstruction (CR-3). Defaults to "active now". */
  asOf?: string;
  /**
   * Downstream gate (CR-1). When true, returns only groups usable by FM-CM-063:
   * reviewStatus PUBLISHED AND completenessStatus complete. The Master Data admin
   * UI omits this to see every group. When a `customerId` is supplied the
   * per-customer resolution (CR-2) is applied first.
   */
  downstream?: boolean;
  customerId?: number | null;
}
export async function fetchAuthGroups(opts: FetchAuthGroupsOptions = {}): Promise<AuthorizationTypeGroup[]> {
  await latency();
  const { asOf, downstream, customerId } = opts;

  let result: AuthorizationTypeGroup[];
  if (asOf === undefined) {
    // "Now" read: serve the maintained cache directly (CR-4 — no live junction join).
    result = clone(authGroups);
  } else {
    // Point-in-time: reconstruct membership + roll-up + status as of `asOf`.
    const activeCombos = activeAt(combinations, asOf);
    result = authGroups.map((g) => {
      const memberCombinationIds = activeMemberIds(g.groupId, asOf);
      const view = { ...g, memberCombinationIds };
      return clone({
        ...g,
        memberCombinationIds,
        engineListCached: rollUpGroupEngines(view, activeCombos, engines),
        completenessStatus: computeCompletenessStatus(view, activeCombos, engines),
      });
    });
  }

  if (downstream) {
    const scoped = customerId == null ? result : resolveGroupsForCustomer(result, customerId);
    result = filterDownstreamGroups(scoped);
  }
  return result;
}
export interface AuthGroupInput {
  groupId?: string;
  groupLabel: string;
  memberCombinationIds: number[];
  /** CR-2: null/undefined = global default; a value = override for that airline. */
  customerId?: number | null;
}
/** Create or edit a group. Any change lands it back in DRAFT — never live immediately. */
export async function saveAuthGroupDraft(input: AuthGroupInput): Promise<AuthorizationTypeGroup> {
  await latency();
  const at = nowUtc();
  const desired = new Set(input.memberCombinationIds);
  const groupId = input.groupId ?? `AG-${++groupSeq}`;

  if (input.groupId) {
    const idx = authGroups.findIndex((g) => g.groupId === input.groupId);
    if (idx < 0) throw new Error("NOT_FOUND");
  }

  // Append-only membership diff against the current active set (CR-3).
  const current = new Set(activeMemberIds(groupId));
  groupMembers = groupMembers.map((m) =>
    m.groupId === groupId && m.validTo === null && !desired.has(m.combinationId)
      ? { ...m, validTo: at } // removed → close out
      : m,
  );
  for (const combinationId of desired) {
    if (!current.has(combinationId)) {
      groupMembers = [...groupMembers, { groupId, combinationId, validFrom: at, validTo: null }];
    }
  }

  if (input.groupId) {
    authGroups = authGroups.map((g) =>
      g.groupId === input.groupId
        ? {
            ...g,
            groupLabel: input.groupLabel,
            customerId: input.customerId === undefined ? g.customerId : input.customerId,
            reviewStatus: "DRAFT",
            submittedBy: undefined, submittedAtUtc: undefined, reviewedBy: undefined,
            updatedBy: MOCK_ACTOR, updatedAtUtc: at,
          }
        : g,
    );
  } else {
    authGroups = [
      ...authGroups,
      {
        groupId,
        groupLabel: input.groupLabel,
        memberCombinationIds: [],
        reviewStatus: "DRAFT",
        completenessStatus: "draft",
        engineListCached: [],
        customerId: input.customerId ?? null,
        updatedBy: MOCK_ACTOR, updatedAtUtc: at,
      },
    ];
  }

  recomputeAllGroups(at);
  return clone(authGroups.find((g) => g.groupId === groupId)!);
}
export type AuthGroupTransition = "SUBMIT" | "PUBLISH" | "REJECT";
export async function transitionAuthGroup(groupId: string, action: AuthGroupTransition): Promise<AuthorizationTypeGroup> {
  await latency();
  const idx = authGroups.findIndex((g) => g.groupId === groupId);
  if (idx < 0) throw new Error("NOT_FOUND");
  const g = authGroups[idx];
  let next: AuthorizationTypeGroup;
  if (action === "SUBMIT") {
    next = { ...g, reviewStatus: "IN_REVIEW", submittedBy: MOCK_ACTOR, submittedAtUtc: nowUtc(), updatedBy: MOCK_ACTOR, updatedAtUtc: nowUtc() };
  } else if (action === "PUBLISH") {
    next = { ...g, reviewStatus: "PUBLISHED", reviewedBy: MOCK_ACTOR, publishedBy: MOCK_ACTOR, publishedAtUtc: nowUtc(), updatedBy: MOCK_ACTOR, updatedAtUtc: nowUtc() };
  } else {
    next = { ...g, reviewStatus: "DRAFT", reviewedBy: MOCK_ACTOR, submittedBy: undefined, submittedAtUtc: undefined, updatedBy: MOCK_ACTOR, updatedAtUtc: nowUtc() };
  }
  authGroups = authGroups.map((x) => (x.groupId === groupId ? next : x));
  return clone(next);
}

// ── aircraft_system_config ──
export async function fetchSystemConfigs(): Promise<AircraftSystemConfig[]> {
  await latency();
  return clone(systemConfigs);
}
export interface SystemConfigInput {
  icaoCode: string;
  familyCode: string;
  modelVariant: string;
  classicNeo: "CLASSIC" | "NEO";
  engineCount: number;
  generatorCount: number;
  hydraulicCount: number;
  hasApu: boolean;
  isNew?: boolean;
}
export async function upsertSystemConfig(input: SystemConfigInput): Promise<AircraftSystemConfig> {
  await latency();
  const idx = systemConfigs.findIndex((s) => s.icaoCode === input.icaoCode);
  if (input.isNew && idx >= 0) throw new Error("DUPLICATE");
  const existing = idx >= 0 ? systemConfigs[idx] : undefined;
  const record: AircraftSystemConfig = {
    icaoCode: input.icaoCode,
    familyCode: input.familyCode,
    modelVariant: input.modelVariant,
    classicNeo: input.classicNeo,
    engineCount: input.engineCount,
    generatorCount: input.generatorCount,
    hydraulicCount: input.hydraulicCount,
    hasApu: input.hasApu,
    legacyEngineLabel: existing?.legacyEngineLabel,
    updatedBy: MOCK_ACTOR,
    updatedAtUtc: nowUtc(),
  };
  if (idx >= 0) systemConfigs = systemConfigs.map((s) => (s.icaoCode === input.icaoCode ? record : s));
  else systemConfigs = [...systemConfigs, record];
  return clone(record);
}
export async function deleteSystemConfig(icaoCode: string): Promise<void> {
  await latency();
  systemConfigs = systemConfigs.filter((s) => s.icaoCode !== icaoCode);
}

// ── Test-only helpers (not used by the app) ───────────────────
/** Read the raw temporal membership rows — used by tests to assert append-only. */
export function __getGroupMembers(): AuthGroupMember[] {
  return clone(groupMembers);
}
/** Read the raw (all-versions) combination rows — used by tests. */
export function __getAllCombinationVersions(): AircraftEngineCombination[] {
  return clone(combinations);
}
