import { describe, it, expect } from 'vitest'
import {
    DEFAULT_MANPOWER_PARAMS,
    analyzeManpower,
    computeRequirement,
    countByTypeEngine,
    enginesMatch,
    hasAirlineAuth,
    holdsLicenceFor,
    isOvernight,
    isValidCertifyingStaff,
    movementStatus,
    peakConcurrency,
    reliefFactor,
    staffPerPosition,
    workBlocks,
    type AnalysisFlight,
    type RosterStaff,
} from './manpower'

const P = DEFAULT_MANPOWER_PARAMS
const WEEK = new Date(2026, 9, 5) // Mon 5 Oct 2026, local midnight

/** Local time on day `d` of the test week, "HH:mm". */
const at = (d: number, hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return new Date(2026, 9, 5 + d, h, m)
}

const flight = (over: Partial<AnalysisFlight> & { start: Date; end: Date }): AnalysisFlight => ({
    key: Math.random().toString(36),
    label: 'XX1/ XX2',
    airlineId: 1,
    airlineCode: 'XX',
    airlineName: 'Test Air',
    familyCode: 'A320',
    engineCode: 'CFM56',
    cancelled: false,
    planning: false,
    ...over,
})

const staff = (over: Partial<RosterStaff> = {}): RosterStaff => ({
    staffId: Math.floor(Math.random() * 1e6),
    employeeId: '0001',
    name: 'Test',
    jobTitle: '',
    isActive: true,
    stationId: 1,
    stationCode: 'BKK',
    transfers: [],
    licences: [{ combinationId: 1, familyCode: 'A320', series: '', engineCode: 'CFM56' }],
    amelLicenses: [],
    sams: { authNo: 'S1', statusName: 'Valid', isCrs: true, expiryDate: null, daysToExpiry: 100, aircraftTypes: [] },
    airlineAuths: [{ airlineId: 1, airlineCode: 'XX', isEligible: true, statusName: 'Approved', expiryDate: null }],
    ...over,
})

describe('parameters', () => {
    it('matches the workbook: 3 on / 3 off needs 2 staff per position', () => {
        expect(staffPerPosition(P)).toBe(2)
    })

    it('matches the workbook relief factor (182.5 / 136.5)', () => {
        expect(reliefFactor(P)).toBeCloseTo(1.336996, 5)
    })
})

describe('certifying staff', () => {
    it('needs an active, unexpired CRS authorization', () => {
        expect(isValidCertifyingStaff(staff())).toBe(true)
        expect(isValidCertifyingStaff(staff({ isActive: false }))).toBe(false)
        expect(isValidCertifyingStaff(staff({ sams: null }))).toBe(false)
        expect(isValidCertifyingStaff(staff({ sams: { ...staff().sams!, daysToExpiry: -1 } }))).toBe(false)
        expect(isValidCertifyingStaff(staff({ sams: { ...staff().sams!, isCrs: false } }))).toBe(false)
    })

    it('derives the rotate / transfer status from transfer rows', () => {
        expect(movementStatus(staff())).toBe('Permanent')
        expect(movementStatus(staff({ transfers: [{ id: 1, stationId: 2, stationCode: 'HKT' }] }))).toBe('Rotate')
        expect(
            movementStatus(staff({ stationId: null, transfers: [{ id: 1, stationId: 2, stationCode: 'HKT' }] }))
        ).toBe('Transfer')
    })
})

describe('matching', () => {
    it('matches engines loosely by normalized code', () => {
        expect(enginesMatch('CFM56', 'CFM 56-5B')).toBe(true)
        expect(enginesMatch('V2500', 'CFM56')).toBe(false)
        expect(enginesMatch('', 'CFM56')).toBe(true)
    })

    it('needs the licence for the flight family and engine', () => {
        expect(holdsLicenceFor(staff(), 'A320', 'CFM56')).toBe(true)
        expect(holdsLicenceFor(staff(), 'A320', 'V2500')).toBe(false)
        expect(holdsLicenceFor(staff(), 'B737', 'CFM56')).toBe(false)
    })

    it('only checks airline authorization for airlines that have a scheme', () => {
        const noAuth = staff({ airlineAuths: [] })
        expect(hasAirlineAuth(noAuth, 1, new Set([1]))).toBe(false)
        expect(hasAirlineAuth(noAuth, 9, new Set([1]))).toBe(true)
        expect(hasAirlineAuth(staff(), 1, new Set([1]))).toBe(true)
    })
})

describe('work blocks', () => {
    it('keeps a daytime turnaround as one block plus the walking buffer', () => {
        const f = flight({ start: at(0, '10:00'), end: at(0, '11:00') })
        expect(isOvernight(f, P)).toBe(false)
        const [b] = workBlocks(f, P)
        expect(b.start).toEqual(at(0, '10:00'))
        expect(b.end).toEqual(at(0, '11:15'))
    })

    it('splits an overnight aircraft into receive and release blocks', () => {
        const f = flight({ start: at(0, '23:00'), end: at(1, '07:00') })
        expect(isOvernight(f, P)).toBe(true)
        const blocks = workBlocks(f, P)
        expect(blocks).toHaveLength(2)
        expect(blocks[0].end).toEqual(at(1, '00:00')) // 23:00 + 45 + 15
        expect(blocks[1].start).toEqual(at(1, '06:00')) // 07:00 - 60
    })

    it('does not treat a short ground time over the night window as overnight', () => {
        const f = flight({ start: at(0, '02:30'), end: at(0, '03:30') })
        expect(isOvernight(f, P)).toBe(false)
    })
})

describe('peakConcurrency', () => {
    it('lets back-to-back blocks share one person', () => {
        expect(
            peakConcurrency([
                { start: at(0, '10:00'), end: at(0, '11:00') },
                { start: at(0, '11:00'), end: at(0, '12:00') },
            ])
        ).toBe(1)
    })

    it('counts overlapping blocks', () => {
        expect(
            peakConcurrency([
                { start: at(0, '10:00'), end: at(0, '12:00') },
                { start: at(0, '11:00'), end: at(0, '13:00') },
                { start: at(0, '11:30'), end: at(0, '11:45') },
            ])
        ).toBe(3)
    })
})

describe('computeRequirement', () => {
    it('adds the day and night peaks, then applies roster pattern and relief', () => {
        const flights = [
            flight({ start: at(0, '09:00'), end: at(0, '10:00') }),
            flight({ start: at(0, '09:30'), end: at(0, '10:30') }), // 2 at once in the day shift
            flight({ start: at(0, '20:00'), end: at(0, '21:00') }), // 1 in the night shift
        ]
        const req = computeRequirement(flights, WEEK, 7, P)
        expect(req.dayPositions).toBe(2)
        expect(req.nightPositions).toBe(1)
        expect(req.positions).toBe(3)
        expect(req.rosterStaff).toBe(6)
        expect(req.required).toBe(9) // ceil(6 × 1.337)
    })

    it('takes the busiest day of the week per shift', () => {
        const flights = [
            flight({ start: at(0, '09:00'), end: at(0, '10:00') }),
            flight({ start: at(2, '09:00'), end: at(2, '10:00') }),
            flight({ start: at(2, '09:00'), end: at(2, '10:00') }),
        ]
        const req = computeRequirement(flights, WEEK, 7, P)
        expect(req.peaks[0].day).toBe(1)
        expect(req.peaks[2].day).toBe(2)
        expect(req.dayPositions).toBe(2)
    })
})

describe('analyzeManpower', () => {
    it('reports shortage per type/engine and per airline authorization', () => {
        const flights = [
            flight({ start: at(0, '09:00'), end: at(0, '10:00') }),
            flight({ start: at(0, '20:00'), end: at(0, '21:00'), familyCode: 'B787', engineCode: 'TRENT1000', airlineId: 2, airlineCode: 'TR' }),
        ]
        const team = [staff(), staff({ airlineAuths: [] })]
        const result = analyzeManpower(flights, team, new Set([1, 2]), WEEK, 7, P)

        const a320 = result.typeEngine.find((r) => r.familyCode === 'A320')!
        expect(a320.available).toBe(2)
        expect(a320.required).toBe(3) // 1 position → 2 roster → ceil(2.67)
        expect(a320.shortage).toBe(1)

        const b787 = result.typeEngine.find((r) => r.familyCode === 'B787')!
        expect(b787.available).toBe(0)

        const xxAuth = result.authorization.find((r) => r.airlineCode === 'XX')!
        expect(xxAuth.available).toBe(1)

        expect(result.riskFlights.map((r) => r.flight.familyCode)).toEqual(['B787'])
        expect(result.overall.available).toBe(2)
    })

    it('leaves Planning and cancelled flights out by default', () => {
        const flights = [
            flight({ start: at(0, '09:00'), end: at(0, '10:00'), planning: true }),
            flight({ start: at(0, '11:00'), end: at(0, '12:00'), cancelled: true }),
        ]
        expect(analyzeManpower(flights, [staff()], new Set(), WEEK, 7, P).overall.flightCount).toBe(0)
        expect(
            analyzeManpower(flights, [staff()], new Set(), WEEK, 7, { ...P, includePlanning: true }).overall.flightCount
        ).toBe(1)
    })
})

describe('countByTypeEngine', () => {
    it('counts each person once per family + engine across series', () => {
        const person = staff({
            licences: [
                { combinationId: 1, familyCode: 'A330', series: '200', engineCode: 'TRENT700' },
                { combinationId: 2, familyCode: 'A330', series: '300', engineCode: 'TRENT700' },
            ],
        })
        const rows = countByTypeEngine([person, staff({ sams: null })])
        const a330 = rows.find((r) => r.familyCode === 'A330')!
        expect(a330.licensed).toHaveLength(1)
        const a320 = rows.find((r) => r.familyCode === 'A320')!
        expect(a320.licensed).toHaveLength(1)
        expect(a320.certifying).toHaveLength(0)
    })
})
