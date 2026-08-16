import type { StaffAircraftLicenseItem } from '@/lib/api/qa/staff-management'

/**
 * Group staffAircraftLicenseList by [familyCode, engineCode] from aircraftEngineObj.
 *
 * Format examples:
 * - No series:       "A318 (CFM56)"
 * - Single series:   "A330 - 300 (RR-TRENT-7000)"
 * - Multiple series: "A330 - 300/900 (RR-TRENT-7000)"
 *
 * @param licenses - Active (non-deleted) staffAircraftLicenseList items
 * @returns Array of grouped display label strings
 */
export function groupAircraftEngineDisplayLabels(
    licenses: StaffAircraftLicenseItem[]
): string[] {
    const groups = new Map<
        string,
        { familyCode: string; engineCode: string; seriesList: string[] }
    >()

    for (const lic of licenses) {
        const obj = lic.aircraftEngineObj
        if (!obj) continue

        const key = `${obj.familyCode}|${obj.engineCode}`
        const existing = groups.get(key)
        if (existing) {
            if (obj.series && !existing.seriesList.includes(obj.series)) {
                existing.seriesList.push(obj.series)
            }
        } else {
            groups.set(key, {
                familyCode: obj.familyCode,
                engineCode: obj.engineCode,
                seriesList: obj.series ? [obj.series] : [],
            })
        }
    }

    return Array.from(groups.values()).map((g) => {
        const seriesPart =
            g.seriesList.length > 0 ? ` - ${g.seriesList.join('/')}` : ''
        return `${g.familyCode}${seriesPart} (${g.engineCode})`
    })
}

/**
 * Group selected combination IDs using AircraftEngineCombination data.
 * Same format as groupAircraftEngineDisplayLabels but works from combination objects.
 *
 * Format examples:
 * - No series:       "A318 (CFM56)"
 * - Single series:   "A330 - 300 (RR-TRENT-7000)"
 * - Multiple series: "A330 - 300/900 (RR-TRENT-7000)"
 */
export function groupCombinationDisplayLabels(
    selectedIds: number[],
    combinations: { id: number; familyCode: string; series: string; engineCode: string }[]
): string[] {
    const groups = new Map<
        string,
        { familyCode: string; engineCode: string; seriesList: string[] }
    >()

    for (const id of selectedIds) {
        const combo = combinations.find(c => c.id === id)
        if (!combo) continue

        const key = `${combo.familyCode}|${combo.engineCode}`
        const existing = groups.get(key)
        if (existing) {
            if (combo.series && !existing.seriesList.includes(combo.series)) {
                existing.seriesList.push(combo.series)
            }
        } else {
            groups.set(key, {
                familyCode: combo.familyCode,
                engineCode: combo.engineCode,
                seriesList: combo.series ? [combo.series] : [],
            })
        }
    }

    return Array.from(groups.values()).map((g) => {
        const seriesPart =
            g.seriesList.length > 0 ? ` - ${g.seriesList.join('/')}` : ''
        return `${g.familyCode}${seriesPart} (${g.engineCode})`
    })
}
