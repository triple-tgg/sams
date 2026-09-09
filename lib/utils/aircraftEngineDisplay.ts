import type { StaffAircraftLicenseItem } from '@/lib/api/qa/staff-management'

/** The three fields a display label is built from. */
interface AircraftEngineParts {
    familyCode: string
    series: string | null
    engineCode: string
}

/**
 * Build display labels, grouped by engine.
 *
 * Families that run the same engine collapse into one label, and within a
 * family its series collapse too:
 * - No series:            "A318 (CFM56)"
 * - Single series:        "A330 - 300 (RR-TRENT-7000)"
 * - Multiple series:      "A330 - 300/900 (RR-TRENT-7000)"
 * - Families on one engine: "A319/A320/A321 (V2500)"
 *
 * Engines keep the order they first appear in, so the list stays stable as
 * rows are added. Families are sorted within their engine so the label reads
 * the same no matter what order the rows arrived in, and series keep their
 * original order.
 */
function buildDisplayLabels(parts: AircraftEngineParts[]): string[] {
    // engineCode -> familyCode -> series, all insertion-ordered
    const byEngine = new Map<string, Map<string, string[]>>()

    for (const part of parts) {
        const engineCode = part.engineCode ?? ''

        let families = byEngine.get(engineCode)
        if (!families) {
            families = new Map<string, string[]>()
            byEngine.set(engineCode, families)
        }

        let seriesList = families.get(part.familyCode)
        if (!seriesList) {
            seriesList = []
            families.set(part.familyCode, seriesList)
        }

        if (part.series && !seriesList.includes(part.series)) {
            seriesList.push(part.series)
        }
    }

    return Array.from(byEngine.entries()).map(([engineCode, families]) => {
        const familyPart = Array.from(families.entries())
            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
            .map(([familyCode, seriesList]) =>
                seriesList.length > 0 ? `${familyCode} - ${seriesList.join('/')}` : familyCode
            )
            .join('/')

        // A blank engine code would otherwise render as an empty "()".
        return engineCode ? `${familyPart} (${engineCode})` : familyPart
    })
}

/**
 * Group staffAircraftLicenseList into display labels.
 *
 * @param licenses - Active (non-deleted) staffAircraftLicenseList items
 * @returns Array of grouped display label strings
 */
export function groupAircraftEngineDisplayLabels(
    licenses: StaffAircraftLicenseItem[]
): string[] {
    const parts: AircraftEngineParts[] = []
    for (const lic of licenses) {
        const obj = lic.aircraftEngineObj
        if (!obj) continue
        parts.push({
            familyCode: obj.familyCode,
            series: obj.series,
            engineCode: obj.engineCode,
        })
    }
    return buildDisplayLabels(parts)
}

/**
 * Group selected combination ids into display labels.
 * Same format as groupAircraftEngineDisplayLabels, from combination objects.
 */
export function groupCombinationDisplayLabels(
    selectedIds: number[],
    combinations: { id: number; familyCode: string; series: string; engineCode: string }[]
): string[] {
    const byId = new Map(combinations.map((c) => [c.id, c]))

    const parts: AircraftEngineParts[] = []
    for (const id of selectedIds) {
        const combo = byId.get(id)
        if (!combo) continue
        parts.push({
            familyCode: combo.familyCode,
            series: combo.series,
            engineCode: combo.engineCode,
        })
    }
    return buildDisplayLabels(parts)
}
