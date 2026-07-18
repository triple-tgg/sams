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
} from "./aircraftEngine.types";

/** Groups stuck below `complete` for longer than this escalate amber → red (CR-1). */
export const COMPLETENESS_SLA_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export interface Datasets {
  engines: EngineMaster[];
  combinations: AircraftEngineCombination[];
  authGroups: AuthorizationTypeGroup[];
  systemConfigs: AircraftSystemConfig[];
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

/** Engines rolled up from a group's member combinations — the source-of-truth view. */
export function rollUpGroupEngines(
  group: AuthorizationTypeGroup,
  combinations: AircraftEngineCombination[],
  engines: EngineMaster[],
): string[] {
  const codes = new Set(
    combinations.filter((c) => group.memberCombinationIds.includes(c.id)).map((c) => c.engineCode),
  );
  const names = Array.from(codes).map((code) => engines.find((e) => e.engineCode === code)?.engineName ?? code);
  return names.sort((a, b) => a.localeCompare(b));
}

// ══════════════════════════════════════════════════════════════
// CR-1 — auto-computed completeness status.
// Pure: derived only from the group's active membership + the datasets. Never set
// by hand. The mock recomputes it (and the CR-4 cache) on every membership change.
// ══════════════════════════════════════════════════════════════
export function computeCompletenessStatus(
  group: AuthorizationTypeGroup,
  combinations: AircraftEngineCombination[],
  engines: EngineMaster[],
): CompletenessStatus {
  const memberIds = new Set(group.memberCombinationIds);
  if (memberIds.size === 0) return "draft"; // empty group — allowed, supports parallel work

  // Issue 1: a legacy engine label that doesn't resolve to the master vocabulary.
  const engineNames = new Set(engines.map((e) => e.engineName));
  const hasUnresolvedLegacy = (group.legacyEngineLabels ?? []).some((l) => !engineNames.has(l));
  if (hasUnresolvedLegacy) return "incomplete";

  // Issue 2: a "missing series" — another active combination sharing a member's
  // (family, engine) pair exists but has not been bound into the group. This is
  // exactly the historical drift where a new MAX series was left out of its group.
  const memberPairs = new Set(
    combinations.filter((c) => memberIds.has(c.id)).map((c) => `${c.familyCode}|${c.engineCode}`),
  );
  const hasMissingSeries = combinations.some(
    (c) => !memberIds.has(c.id) && memberPairs.has(`${c.familyCode}|${c.engineCode}`),
  );
  if (hasMissingSeries) return "incomplete";

  return "complete";
}

// ══════════════════════════════════════════════════════════════
// CR-1 gate + CR-2 resolution — what downstream modules (FM-CM-063) may consume.
// ══════════════════════════════════════════════════════════════

/** Only groups usable to issue a CRS: PUBLISHED (manual) AND complete (auto). */
export function filterDownstreamGroups(groups: AuthorizationTypeGroup[]): AuthorizationTypeGroup[] {
  return groups.filter((g) => g.reviewStatus === "PUBLISHED" && g.completenessStatus === "complete");
}

/**
 * CR-2 resolution rule. For a given airline, return one group per logical scope
 * (keyed by `groupLabel`), preferring that airline's own override over the global
 * (`customerId === null`) default. Groups scoped to a *different* airline are
 * excluded. Global-only scopes fall through to the global group.
 */
export function resolveGroupsForCustomer(
  groups: AuthorizationTypeGroup[],
  customerId: number,
): AuthorizationTypeGroup[] {
  const applicable = groups.filter((g) => g.customerId === customerId || g.customerId == null);
  const byScope = new Map<string, AuthorizationTypeGroup>();
  for (const g of applicable) {
    const existing = byScope.get(g.groupLabel);
    if (!existing || (g.customerId === customerId && existing.customerId == null)) {
      byScope.set(g.groupLabel, g);
    }
  }
  return Array.from(byScope.values());
}

// ══════════════════════════════════════════════════════════════
// The full data-quality scan.
// ══════════════════════════════════════════════════════════════
export function computeDataQuality(data: Datasets, now: string = new Date().toISOString()): DataQualityFinding[] {
  const { engines, combinations, authGroups, systemConfigs } = data;
  const findings: DataQualityFinding[] = [];

  // ── 0. Groups not yet `complete` (CR-1). Amber normally; escalates to red once
  //       the group has been stuck below `complete` for longer than the SLA. ──
  const nowMs = Date.parse(now);
  for (const g of authGroups) {
    if (g.completenessStatus === "complete") continue;
    const sinceMs = g.incompleteSinceUtc ? Date.parse(g.incompleteSinceUtc) : NaN;
    const stale = Number.isFinite(sinceMs) && nowMs - sinceMs > COMPLETENESS_SLA_MS;
    findings.push({
      id: `stale-group-${g.groupId}`,
      category: "STALE_GROUP",
      severity: stale ? "red" : "amber",
      message: stale
        ? `Authorization Group "${g.groupLabel}" ค้างสถานะ ${g.completenessStatus} เกิน 3 วัน — ยังใช้ออก FM-CM-063 ไม่ได้`
        : `Authorization Group "${g.groupLabel}" ยังไม่ complete (${g.completenessStatus}) — ยังใช้ออก FM-CM-063 ไม่ได้`,
    });
  }

  // ── 1. Orphan combinations (in no authorization group) ──
  const memberSet = new Set(authGroups.flatMap((g) => g.memberCombinationIds));
  const orphans = combinations.filter((c) => !memberSet.has(c.id));
  const orphansByFamily = new Map<string, AircraftEngineCombination[]>();
  for (const o of orphans) {
    const arr = orphansByFamily.get(o.familyCode) ?? [];
    arr.push(o);
    orphansByFamily.set(o.familyCode, arr);
  }
  for (const [family, combos] of orphansByFamily) {
    const labels = combos.map((c) => (c.series ? `${family}-${c.series}` : family)).join(", ");
    findings.push({
      id: `orphan-${family}`,
      category: "ORPHAN",
      message: `${labels} มีอยู่ใน Aircraft-Engine Combinations แต่ยังไม่ถูกผูกเข้า Authorization Group ใดเลย`,
    });
  }

  // ── 2a. Family present in combinations but missing from system config ──
  const configFamilies = new Set(systemConfigs.map((s) => s.familyCode));
  const comboFamilies = Array.from(new Set(combinations.map((c) => c.familyCode)));
  for (const family of comboFamilies) {
    if (!configFamilies.has(family)) {
      findings.push({
        id: `missing-config-${family}`,
        category: "MISSING_CONFIG",
        message: `${family} มีอยู่ใน Aircraft-Engine Combinations แต่ไม่มีข้อมูลใน Aircraft System Config`,
      });
    }
  }
  // ── 2b. Reverse: family in system config with no combination ──
  const comboFamilySet = new Set(comboFamilies);
  for (const family of Array.from(configFamilies)) {
    if (!comboFamilySet.has(family)) {
      findings.push({
        id: `missing-combo-${family}`,
        category: "MISSING_CONFIG",
        message: `${family} มีอยู่ใน Aircraft System Config แต่ไม่มี Aircraft-Engine Combination`,
      });
    }
  }

  // ── 3. Engine labels elsewhere that don't match engine_master exactly ──
  const engineNames = new Set(engines.map((e) => e.engineName));
  for (const g of authGroups) {
    for (const label of g.legacyEngineLabels ?? []) {
      if (!engineNames.has(label)) {
        findings.push({
          id: `naming-group-${g.groupId}-${label}`,
          category: "NAMING",
          message: `Authorization Group "${g.groupLabel}" ใช้ชื่อเครื่องยนต์ "${label}" ซึ่งไม่มีใน Engine Master`,
          suggestion: suggestEngineName(label, engines),
        });
      }
    }
  }
  for (const s of systemConfigs) {
    const label = s.legacyEngineLabel;
    if (label && !engineNames.has(label)) {
      findings.push({
        id: `naming-config-${s.icaoCode}`,
        category: "NAMING",
        message: `Aircraft System Config (${s.icaoCode} · ${s.modelVariant}) มีชื่อเครื่องยนต์ "${label}" ซึ่งไม่ตรงกับ Engine Master`,
        suggestion: suggestEngineName(label, engines),
      });
    }
  }

  return findings;
}
