import { describe, it, expect } from 'vitest'
import {
    groupAircraftEngineDisplayLabels,
    groupCombinationDisplayLabels,
} from './aircraftEngineDisplay'

/** Minimal staffAircraftLicenseList item carrying only what the label needs. */
const lic = (familyCode: string, series: string | null, engineCode: string) =>
    ({
        id: 0,
        staffId: 0,
        aircraftEngineId: 0,
        isdelete: false,
        createddate: '',
        createdby: '',
        updateddate: '',
        updatedby: '',
        aircraftEngineObj: {
            id: 0,
            familyCode,
            series,
            engineCode,
            validFrom: null,
            validTo: null,
            updatedBy: null,
            updatedAtUtc: null,
        },
    }) as any

const combo = (id: number, familyCode: string, series: string, engineCode: string) => ({
    id,
    familyCode,
    series,
    engineCode,
})

describe('groupAircraftEngineDisplayLabels', () => {
    // The case this grouping exists for.
    it('collapses families that run the same engine into one label', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A319', null, 'V2500'),
                lic('A320', null, 'V2500'),
                lic('A321', null, 'V2500'),
            ])
        ).toEqual(['A319/A320/A321 (V2500)'])
    })

    it('keeps a single family with no series unchanged', () => {
        expect(groupAircraftEngineDisplayLabels([lic('A318', null, 'CFM56')])).toEqual([
            'A318 (CFM56)',
        ])
    })

    it('keeps a single series unchanged', () => {
        expect(groupAircraftEngineDisplayLabels([lic('A330', '300', 'RR-TRENT-7000')])).toEqual([
            'A330 - 300 (RR-TRENT-7000)',
        ])
    })

    it('joins several series of one family', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A330', '300', 'RR-TRENT-7000'),
                lic('A330', '900', 'RR-TRENT-7000'),
            ])
        ).toEqual(['A330 - 300/900 (RR-TRENT-7000)'])
    })

    it('keeps different engines in separate labels', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A319', null, 'V2500'),
                lic('A320', null, 'CFM56'),
            ])
        ).toEqual(['A319 (V2500)', 'A320 (CFM56)'])
    })

    it('carries each family series through when families share an engine', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A330', '300', 'TRENT'),
                lic('A350', '1000', 'TRENT'),
            ])
        ).toEqual(['A330 - 300/A350 - 1000 (TRENT)'])
    })

    // Labels must not change shape just because rows came back in another order.
    it('orders families the same way regardless of input order', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A321', null, 'V2500'),
                lic('A319', null, 'V2500'),
                lic('A320', null, 'V2500'),
            ])
        ).toEqual(['A319/A320/A321 (V2500)'])
    })

    it('orders families numerically, not as plain text', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('B737-100', null, 'JT8D'),
                lic('B737-20', null, 'JT8D'),
                lic('B737-9', null, 'JT8D'),
            ])
        ).toEqual(['B737-9/B737-20/B737-100 (JT8D)'])
    })

    it('lists engines in the order they first appear', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A320', null, 'CFM56'),
                lic('A319', null, 'V2500'),
            ])
        ).toEqual(['A320 (CFM56)', 'A319 (V2500)'])
    })

    it('does not repeat a series that appears twice', () => {
        expect(
            groupAircraftEngineDisplayLabels([
                lic('A330', '300', 'TRENT'),
                lic('A330', '300', 'TRENT'),
            ])
        ).toEqual(['A330 - 300 (TRENT)'])
    })

    it('skips rows with no aircraft engine attached', () => {
        const orphan = { ...lic('A320', null, 'CFM56'), aircraftEngineObj: null }
        expect(groupAircraftEngineDisplayLabels([orphan, lic('A319', null, 'V2500')])).toEqual([
            'A319 (V2500)',
        ])
    })

    it('omits the brackets when the engine code is blank', () => {
        expect(groupAircraftEngineDisplayLabels([lic('A320', null, '')])).toEqual(['A320'])
    })

    it('returns nothing for an empty list', () => {
        expect(groupAircraftEngineDisplayLabels([])).toEqual([])
    })
})

describe('groupCombinationDisplayLabels', () => {
    const combinations = [
        combo(1, 'A319', '', 'V2500'),
        combo(2, 'A320', '', 'V2500'),
        combo(3, 'A321', '', 'V2500'),
        combo(4, 'A330', '300', 'RR-TRENT-7000'),
    ]

    it('groups the selected ids the same way', () => {
        expect(groupCombinationDisplayLabels([1, 2, 3], combinations)).toEqual([
            'A319/A320/A321 (V2500)',
        ])
    })

    it('keeps a different engine in its own label', () => {
        expect(groupCombinationDisplayLabels([1, 4], combinations)).toEqual([
            'A319 (V2500)',
            'A330 - 300 (RR-TRENT-7000)',
        ])
    })

    it('ignores ids that are not in the combination list', () => {
        expect(groupCombinationDisplayLabels([1, 999], combinations)).toEqual(['A319 (V2500)'])
    })

    it('returns nothing when nothing is selected', () => {
        expect(groupCombinationDisplayLabels([], combinations)).toEqual([])
    })
})
