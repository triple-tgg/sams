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
