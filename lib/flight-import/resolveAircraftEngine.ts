import type { AircraftType } from "@/lib/api/master/aircraft-types/aircraft-types";
import type { AircraftEngineCombination } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

export interface ResolvedAircraftEngine {
  aircraftEngineId: number;
  familyCode: string;
  series: string;
  engineCode: string;
}

const up = (v: unknown) => String(v ?? "").trim().toUpperCase();

/**
 * Resolve the Aircraft-Engine fields for an Excel import row (same meaning as Add Flight):
 * - familyCode: optional FAMILY column → Family (modelName) of the A/C TYPE in Aircraft system config → A/C TYPE value
 * - series / engineCode: optional SERIES / ENGINE columns
 * - aircraftEngineId: the combination matching family + series + engine; when the row has no
 *   series/engine and the family has exactly one combination, that one is used. Otherwise 0.
 */
export function resolveAircraftEngine(
  row: Record<string, unknown>,
  aircraftTypes: AircraftType[],
  combinations: AircraftEngineCombination[],
): ResolvedAircraftEngine {
  const cell = (names: string[]) => {
    const key = Object.keys(row).find((k) => names.includes(up(k)));
    return key ? String(row[key] ?? "").trim() : "";
  };

  const acType = String(row["A/C TYPE"] ?? "").trim();
  const type = aircraftTypes.find((t) => up(t.code) === up(acType));
  let familyCode = cell(["FAMILY", "FAMILY CODE"]) || type?.modelName || type?.familyCode || acType;
  let series = cell(["SERIES", "SERIES / VARIANT", "VARIANT"]);
  let engineCode = cell(["ENGINE", "ENGINE CODE"]);

  const familyCombos = combinations.filter((c) => up(c.familyCode) === up(familyCode));
  let combo = familyCombos.find((c) => up(c.series) === up(series) && up(c.engineCode) === up(engineCode));
  if (!combo && !series && !engineCode && familyCombos.length === 1) combo = familyCombos[0];
  if (combo) {
    familyCode = combo.familyCode;
    series = combo.series || "";
    engineCode = combo.engineCode;
  }

  return { aircraftEngineId: combo?.id ?? 0, familyCode, series, engineCode };
}
