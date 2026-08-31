// ──────────────────────────────────────────────────────────────
// Data-quality validation — pure, derived entirely from the four datasets.
// No writes, no side effects. The banner and the "regenerate" preview both
// call these. Keeping it pure means it can move server-side unchanged.
// ──────────────────────────────────────────────────────────────

import type {
  AircraftEngineCombination,
  AircraftSystemConfig,
  AuthorizationTypeGroup,
  CompletenessStatus,
  DataQualityFinding,
  EngineMaster,
  ReferenceCheck,
} from "./aircraftEngine.types";
import type { AircraftType } from "../aircraft-types/aircraft-types";

// ──────────────────────────────────────────────────────────────
// Derived-data helpers consumed by the mock store.
//
// rollUpGroupEngines  (CR-4) — unique engine names for a group's active combos.
// computeCompletenessStatus (CR-1) — draft / incomplete / complete.
// resolveGroupsForCustomer  (CR-2) — prefer customer-specific over global groups.
// filterDownstreamGroups           — keep only groups that have active members.
// ──────────────────────────────────────────────────────────────

/** CR-4: derive the distinct engine names for a group from its active member combinations. */
export function rollUpGroupEngines(
  group: AuthorizationTypeGroup,
  activeCombos: AircraftEngineCombination[],
  engines: EngineMaster[],
): string[] {
  const engineCodes = new Set<string>();
  for (const combo of activeCombos) {
    if (group.memberCombinationIds.includes(combo.id)) {
      engineCodes.add(combo.engineCode);
    }
  }
  const engineMap = new Map(engines.map((e) => [e.engineCode, e.engineName]));
  return Array.from(engineCodes)
    .map((code) => engineMap.get(code) ?? code)
    .sort();
}

/**
 * CR-1: determine the completeness status of a group.
 * - `draft`      — no members at all.
 * - `incomplete`  — has members but not every member combo resolves to a known engine.
 * - `complete`    — every member combo resolves and there is at least one member.
 */
export function computeCompletenessStatus(
  group: AuthorizationTypeGroup,
  activeCombos: AircraftEngineCombination[],
  engines: EngineMaster[],
): CompletenessStatus {
  if (group.memberCombinationIds.length === 0) return "draft";

  const knownEngines = new Set(engines.map((e) => e.engineCode));
  for (const comboId of group.memberCombinationIds) {
    const combo = activeCombos.find((c) => c.id === comboId);
    if (!combo || !knownEngines.has(combo.engineCode)) return "incomplete";
  }
  return "complete";
}

/**
 * CR-2: resolve groups for a specific customer.
 * If a customer-specific override exists for the same groupLabel, prefer it
 * over the global (customerId === null) group.
 */
export function resolveGroupsForCustomer(
  groups: AuthorizationTypeGroup[],
  customerId: number,
): AuthorizationTypeGroup[] {
  const customerGroups = groups.filter((g) => g.customerId === customerId);
  const customerLabels = new Set(customerGroups.map((g) => g.groupLabel));

  // Keep all customer-specific groups + globals that have no customer override.
  const globals = groups.filter(
    (g) => g.customerId === null && !customerLabels.has(g.groupLabel),
  );
  return [...customerGroups, ...globals];
}

/** Keep only groups that have at least one active member combination. */
export function filterDownstreamGroups(
  groups: AuthorizationTypeGroup[],
): AuthorizationTypeGroup[] {
  return groups.filter((g) => g.memberCombinationIds.length > 0);
}

/** Display-label derivation used by the editor preview when the API record has not been saved yet. */
export function buildDisplayLabel(familyCode: string, series: string, engineName: string): string {
  const base = series ? `${familyCode}-${series}` : familyCode;
  return `${base} (${engineName})`;
}

/** Client-side preflight only; the backend DELETE endpoint remains authoritative. */
export function checkEngineReferences(
  engineCode: string,
  combinations: AircraftEngineCombination[],
): ReferenceCheck {
  const references = combinations
    .filter((combination) => combination.engineCode === engineCode)
    .map((combination) => `combination: ${combination.displayLabel}`);
  return { blocked: references.length > 0, references };
}

/** Client-side preflight only; the backend DELETE endpoint remains authoritative. */
export function checkCombinationReferences(
  id: number,
  groups: AuthorizationTypeGroup[],
): ReferenceCheck {
  const references = groups
    .filter((group) => group.memberCombinationIds.includes(id))
    .map((group) => `authorization group: ${group.groupLabel}`);
  return { blocked: references.length > 0, references };
}

/** Groups stuck below `complete` for longer than this escalate amber → red (CR-1). */
export const COMPLETENESS_SLA_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface Datasets {
  engines: EngineMaster[];
  combinations: AircraftEngineCombination[];
  /** Aircraft Types (from /master/aircraftTypes) — replaces old systemConfigs */
  aircraftTypes: AircraftType[];
}

// ── Levenshtein distance for "did you mean" engine suggestions ──
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(
        d[j] + 1,
        d[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return d[n];
}

/** Closest engine name in the master vocabulary to a free-text label. */
export function suggestEngineName(label: string, engines: EngineMaster[]): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  const norm = label.trim().toUpperCase();
  for (const e of engines) {
    const dist = levenshtein(norm, e.engineName.toUpperCase());
    if (dist < bestDist) {
      bestDist = dist;
      best = e.engineName;
    }
  }
  return best;
}

// ══════════════════════════════════════════════════════════════
// The full data-quality scan.
// ══════════════════════════════════════════════════════════════
export function computeDataQuality(data: Datasets): DataQualityFinding[] {
  const { combinations, aircraftTypes } = data;
  const findings: DataQualityFinding[] = [];

  const comboFamilies = new Set(combinations.map((c) => c.familyCode));
  const typeFamilies = new Set(aircraftTypes.map((t) => t.modelName).filter(Boolean));

  // Check for duplicate ICAO codes
  const icaoCounts = new Map<string, number>();
  for (const t of aircraftTypes) {
    if (t.code) {
      icaoCounts.set(t.code, (icaoCounts.get(t.code) || 0) + 1);
    }
  }

  for (const [icao, count] of icaoCounts.entries()) {
    if (count > 1) {
      findings.push({
        id: `dup-icao-${icao}`,
        category: "DUPLICATE_ICAO",
        message: `ICAO Code "${icao}" is duplicated ${count} times in Aircraft system config`,
        severity: "red",
      });
    }
  }

  // Additional checks between combinations and aircraftTypes can go here
  // For now, no strict cross-validation on families since Aircraft Family is removed.

  return findings;
}
