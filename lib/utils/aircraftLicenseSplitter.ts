import type { AircraftEngineCombination } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

export interface SplitAircraftCombinationItem {
  id: string; // client temporary uid
  originalText: string; // e.g. "Boeing 737-600 (CFM56)"
  family?: string;
  series?: string;
  engine?: string | null;
  combinationId: number | null; // matched ID from API
  displayLabel: string | null; // official displayLabel
  matched: boolean;
}

export interface ParsedAircraftUnit {
  family: string;
  series: string;
  engine: string | null;
  label: string;
}

export function normalizeKey(str: string): string {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function normalizeFamilyCode(family: string): string {
  let f = normalizeKey(family);
  f = f.replace(/^boeing/, "b");
  f = f.replace(/^airbus/, "a");
  f = f.replace(/^embraer/, "e");
  return f;
}

export function normalizeEngineCode(engine: string): string {
  if (!engine) return "";
  let e = normalizeKey(engine);
  // Remove brand prefixes often found in text
  e = e.replace(/^cfm/, "");
  e = e.replace(/^iae/, "");
  e = e.replace(/^rr/, "");
  if (e === "trent70") e = "trent700";
  if (e.startsWith("pw41") || e.startsWith("pw40")) {
    e = "pw4000";
  }
  return e;
}

/**
 * Parses a raw aircraft license text (potentially containing multiple series,
 * engines, or grouped models) into individual atomic units.
 */
export function splitGroupedAircraftLicenseText(input: string): ParsedAircraftUnit[] {
  if (!input || !input.trim()) return [];
  let raw = input.trim();

  // Strip trailing notes like 'A&P only' or similar if outside parens
  raw = raw.replace(/\s+A&P\s+only$/i, "").trim();

  // 1. Extract engine portion in parentheses, if present
  let engines: string[] = [];
  const parenMatch = raw.match(/\(([^)]+)\)$/);
  let mainPart = raw;
  if (parenMatch) {
    const inside = parenMatch[1].trim();
    const rawEngines = inside.split("/").map((e) => e.trim()).filter(Boolean);
    let prevPrefix = "";
    for (const eng of rawEngines) {
      const match = eng.match(/^([A-Za-z]+)(\d.*)$/);
      if (match) {
        prevPrefix = match[1];
        engines.push(eng);
      } else if (/^\d+/.test(eng) && prevPrefix) {
        engines.push(prevPrefix + eng);
      } else {
        engines.push(eng);
      }
    }
    mainPart = raw.slice(0, parenMatch.index).trim();
  }

  const engineList: Array<string | null> = engines.length > 0 ? engines : [null];

  // 2. Parse mainPart (aircraft family & series)
  const aircraftModels: Array<{ family: string; series: string; full: string }> = [];

  if (mainPart.includes("/")) {
    const slashParts = mainPart.split("/").map((p) => p.trim()).filter(Boolean);
    const first = slashParts[0];
    const dashIdx = first.lastIndexOf("-");

    if (dashIdx !== -1) {
      const familyPrefix = first.slice(0, dashIdx).trim();
      const firstSeries = first.slice(dashIdx + 1).trim();

      aircraftModels.push({
        family: familyPrefix,
        series: firstSeries,
        full: `${familyPrefix}-${firstSeries}`,
      });

      for (let i = 1; i < slashParts.length; i++) {
        const part = slashParts[i];
        // If part starts with letters and has its own model number (e.g. 'A310')
        if (/^[A-Za-z]+\d+/.test(part) && !part.match(/^\d+[A-Za-z]/)) {
          const pDash = part.lastIndexOf("-");
          if (pDash !== -1) {
            const pFam = part.slice(0, pDash).trim();
            const pSer = part.slice(pDash + 1).trim();
            aircraftModels.push({
              family: pFam,
              series: pSer,
              full: `${pFam}-${pSer}`,
            });
          } else {
            aircraftModels.push({ family: part, series: "", full: part });
          }
        } else {
          // Part is a series variant under the same familyPrefix (e.g. '700', '800', '600R', '300')
          aircraftModels.push({
            family: familyPrefix,
            series: part,
            full: `${familyPrefix}-${part}`,
          });
        }
      }
    } else {
      // No dash, e.g. 'A318/A319/A320/A321'
      for (const part of slashParts) {
        aircraftModels.push({ family: part, series: "", full: part });
      }
    }
  } else {
    // Single aircraft model without slash
    // Check if format is "<Family> <Series>" e.g. "SOCATA TB-9" or "Piper PA-28" where series has a hyphen
    const spaceMatch = mainPart.match(/^([A-Za-z]+)\s+([A-Za-z]+-\w+)$/);
    if (spaceMatch) {
      aircraftModels.push({
        family: spaceMatch[1],
        series: spaceMatch[2],
        full: mainPart,
      });
    } else {
      const dashIdx = mainPart.lastIndexOf("-");
      if (dashIdx !== -1) {
        const familyPrefix = mainPart.slice(0, dashIdx).trim();
        const series = mainPart.slice(dashIdx + 1).trim();
        aircraftModels.push({
          family: familyPrefix,
          series: series,
          full: `${familyPrefix}-${series}`,
        });
      } else {
        aircraftModels.push({
          family: mainPart,
          series: "",
          full: mainPart,
        });
      }
    }
  }

  // 3. Cartesian product: aircraftModels x engineList
  const results: ParsedAircraftUnit[] = [];
  for (const ac of aircraftModels) {
    for (const eng of engineList) {
      const label = eng ? `${ac.full} (${eng})` : ac.full;
      results.push({
        family: ac.family,
        series: ac.series,
        engine: eng,
        label,
      });
    }
  }
  return results;
}

/**
 * Match a single parsed unit against combinations master list.
 */
export function findMatchingCombination(
  unit: ParsedAircraftUnit,
  combinations: AircraftEngineCombination[]
): AircraftEngineCombination | null {
  if (!combinations.length) return null;

  const unitLabelNorm = normalizeKey(unit.label);

  // 1. Direct match on displayLabel (e.g. "B737-800 (CFM56)" or master names like "SOCATA TB-9")
  const exactLabel = combinations.find(
    (c) => normalizeKey(c.displayLabel) === unitLabelNorm
  );
  if (exactLabel) return exactLabel;

  const hasEngine = Boolean(unit.engine && unit.engine.trim());

  // If the imported unit has NO engine specified, we MUST NOT guess an engine combination.
  // Master combinations are aircraft-engine pairs. A missing engine must be mapped manually.
  if (!hasEngine) {
    // Only match if a master combination genuinely has no engine requirement (empty engineCode)
    const normFam = normalizeFamilyCode(unit.family);
    const normSeries = normalizeKey(unit.series);
    const noEngineCombo = combinations.find((c) => {
      const cFam = normalizeFamilyCode(c.familyCode);
      const cSeries = normalizeKey(c.series);
      const famMatch = cFam === normFam;
      const seriesMatch = normSeries ? cSeries === normSeries : !cSeries;
      const hasNoComboEngine = !c.engineCode || !c.engineCode.trim();
      return famMatch && seriesMatch && hasNoComboEngine;
    });
    return noEngineCombo || null;
  }

  // 2. Normalized familyCode + series + engineCode match (when engine IS present)
  const normFam = normalizeFamilyCode(unit.family);
  const normSeries = normalizeKey(unit.series);
  const normEng = normalizeEngineCode(unit.engine || "");

  const exactCodeMatch = combinations.find((c) => {
    const cFam = normalizeFamilyCode(c.familyCode);
    const cSeries = normalizeKey(c.series);
    const cEng = normalizeEngineCode(c.engineCode);

    const famMatch = cFam === normFam;
    const seriesMatch = normSeries ? cSeries === normSeries : true;
    const engMatch = cEng === normEng || cEng.includes(normEng) || normEng.includes(cEng);

    return famMatch && seriesMatch && engMatch;
  });
  if (exactCodeMatch) return exactCodeMatch;

  // 3. Family + Series + Engine alias match
  if (normFam && normEng) {
    const famSeriesMatches = combinations.filter((c) => {
      const cFam = normalizeFamilyCode(c.familyCode);
      const cSeries = normalizeKey(c.series);
      return cFam === normFam && (normSeries ? cSeries === normSeries : true);
    });

    if (famSeriesMatches.length > 0) {
      // Find best engine match
      const engMatch = famSeriesMatches.find((c) => {
        const cEng = normalizeEngineCode(c.engineCode);
        return cEng.includes(normEng) || normEng.includes(cEng);
      });
      if (engMatch) return engMatch;
    }
  }

  // 4. Fuzzy / substring match on displayLabel (requires engine to match)
  if (normEng) {
    const fuzzy = combinations.find((c) => {
      const cNorm = normalizeKey(c.displayLabel);
      return (
        (cNorm.includes(normFam) || (normFam.length >= 4 && normFam.includes(cNorm))) &&
        (normSeries ? cNorm.includes(normSeries) : true) &&
        cNorm.includes(normEng)
      );
    });
    if (fuzzy) return fuzzy;
  }

  return null;
}

/**
 * Splits raw aircraft license and resolves combination IDs against master data.
 */
export function parseAndSplitAircraftLicense(
  rawText: string,
  combinations: AircraftEngineCombination[],
  rowKeyPrefix: string = ""
): SplitAircraftCombinationItem[] {
  if (!rawText || !rawText.trim()) return [];

  const units = splitGroupedAircraftLicenseText(rawText);
  if (units.length === 0) return [];

  return units.map((unit, idx) => {
    const matched = findMatchingCombination(unit, combinations);
    const uid = rowKeyPrefix ? `${rowKeyPrefix}-${idx}` : `comb-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    return {
      id: uid,
      originalText: unit.label,
      family: unit.family,
      series: unit.series,
      engine: unit.engine,
      combinationId: matched ? matched.id : null,
      displayLabel: matched ? matched.displayLabel : null,
      matched: Boolean(matched),
    };
  });
}

/**
 * Computes the main display text for an Aircraft License row based on its split combination mappings.
 * If combinations are mapped, groups them appropriately (e.g. "B777-200/300 (GE90)" or "B767-300 (RB211), A330-800 (RR-TRENT-7000)").
 * Falls back to original text if no combination is mapped or mappings is empty.
 */
export function computeRowAircraftLicenseDisplay(
  mappings: SplitAircraftCombinationItem[] | undefined,
  combinationsList: AircraftEngineCombination[],
  originalFallback: string = ""
): string {
  if (!mappings || mappings.length === 0) {
    return originalFallback;
  }

  const mappedItems = mappings.filter((m) => m.combinationId !== null);
  const unmappedItems = mappings.filter(
    (m) => m.combinationId === null && m.originalText && m.originalText !== "New Combination"
  );

  // If no combination has been mapped yet, keep original fallback from file
  if (mappedItems.length === 0) {
    if (originalFallback && originalFallback.trim() && originalFallback !== "-") {
      return originalFallback;
    }
    if (unmappedItems.length > 0) {
      return unmappedItems.map((u) => u.originalText).join(", ");
    }
    return originalFallback;
  }

  // Group mapped items by engine, then by family within that engine, so
  // families sharing one engine collapse into a single label
  // (A319 + A320 + A321 on V2500 reads "A319/A320/A321 (V2500)").
  interface FamilyGroup {
    familyCode: string;
    seriesList: string[];
    displayLabels: string[];
  }
  const byEngine = new Map<string, { engineCode: string; families: Map<string, FamilyGroup> }>();

  for (const item of mappedItems) {
    const comb = combinationsList.find((c) => c.id === item.combinationId);
    const familyCode = comb ? comb.familyCode : (item.family || "");
    const engineCode = comb ? comb.engineCode : (item.engine || "");
    const series = comb ? comb.series : (item.series || "");
    const displayLabel = comb?.displayLabel || item.displayLabel || "";

    const engineKey = engineCode.trim().toUpperCase();
    let engineGroup = byEngine.get(engineKey);
    if (!engineGroup) {
      engineGroup = { engineCode, families: new Map<string, FamilyGroup>() };
      byEngine.set(engineKey, engineGroup);
    }

    const familyKey = familyCode.trim().toUpperCase();
    let family = engineGroup.families.get(familyKey);
    if (!family) {
      family = { familyCode, seriesList: [], displayLabels: [] };
      engineGroup.families.set(familyKey, family);
    }

    if (series && !family.seriesList.includes(series)) {
      family.seriesList.push(series);
    }
    if (displayLabel && !family.displayLabels.includes(displayLabel)) {
      family.displayLabels.push(displayLabel);
    }
  }

  const mappedParts: string[] = [];
  for (const engineGroup of byEngine.values()) {
    const enginePart = engineGroup.engineCode ? ` (${engineGroup.engineCode})` : "";
    const families = Array.from(engineGroup.families.values()).sort((a, b) =>
      a.familyCode.localeCompare(b.familyCode, undefined, { numeric: true })
    );

    // A single family keeps the master's own spelling wherever it has one.
    if (families.length === 1) {
      const grp = families[0];
      if (grp.seriesList.length > 1) {
        mappedParts.push(`${grp.familyCode}-${grp.seriesList.join("/")}${enginePart}`);
      } else if (grp.displayLabels.length === 1 && grp.displayLabels[0]) {
        mappedParts.push(grp.displayLabels[0]);
      } else {
        const seriesStr = grp.seriesList.length > 0 ? `-${grp.seriesList[0]}` : "";
        mappedParts.push(`${grp.familyCode}${seriesStr}${enginePart}`);
      }
      continue;
    }

    // Several families on one engine: the engine is stated once, at the end.
    const familyParts = families.map((grp) =>
      grp.seriesList.length > 0 ? `${grp.familyCode}-${grp.seriesList.join("/")}` : grp.familyCode
    );
    mappedParts.push(`${familyParts.join("/")}${enginePart}`);
  }

  const unmappedParts = unmappedItems.map((u) => u.originalText);
  return [...mappedParts, ...unmappedParts].join(", ");
}
