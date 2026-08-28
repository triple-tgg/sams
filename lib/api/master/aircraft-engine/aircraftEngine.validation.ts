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
  aircraftTypes: { modelName: string; familyCode: string | null }[];
  /** Aircraft Family codes (from /master/aircraft-family-codes-list) */
  familyCodes: { code: string }[];
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
  const { combinations, aircraftTypes, familyCodes } = data;
  const findings: DataQualityFinding[] = [];

  const comboFamilies = new Set(combinations.map((c) => c.familyCode));
  const typeFamilies = new Set(aircraftTypes.map((t) => t.modelName).filter(Boolean));
  const registeredFamilies = new Set(familyCodes.map((f) => f.code));

  // ── 1. Aircraft Family ไม่มีใน Combinations ──
  for (const code of registeredFamilies) {
    if (!comboFamilies.has(code)) {
      findings.push({
        id: `family-no-combo-${code}`,
        category: "MISSING_CONFIG",
        message: `${code} มีอยู่ใน Aircraft Family แต่ยังไม่มี Aircraft-Engine Combination`,
      });
    }
  }

  // ── 2. Aircraft Family ไม่มีใน System Config (Aircraft Types) ──
  for (const code of registeredFamilies) {
    if (!typeFamilies.has(code)) {
      findings.push({
        id: `family-no-type-${code}`,
        category: "MISSING_CONFIG",
        message: `${code} มีอยู่ใน Aircraft Family แต่ยังไม่มีข้อมูลใน Aircraft System Config`,
      });
    }
  }

  // ── 3. Combination family ที่ไม่ได้ลงทะเบียนใน Aircraft Family ──
  for (const family of comboFamilies) {
    if (!registeredFamilies.has(family)) {
      findings.push({
        id: `combo-no-family-${family}`,
        category: "MISSING_CONFIG",
        message: `${family} มีอยู่ใน Aircraft-Engine Combinations แต่ยังไม่ได้ลงทะเบียนใน Aircraft Family`,
      });
    }
  }

  // ── 4. System Config family ที่ไม่ได้ลงทะเบียนใน Aircraft Family ──
  for (const family of typeFamilies) {
    if (!registeredFamilies.has(family)) {
      findings.push({
        id: `type-no-family-${family}`,
        category: "MISSING_CONFIG",
        message: `${family} มีอยู่ใน Aircraft System Config แต่ยังไม่ได้ลงทะเบียนใน Aircraft Family`,
      });
    }
  }

  return findings;
}
