/**
 * Roster / manpower logic, kept free of React so it can be unit-tested.
 *
 * Model (follows the Manpower_BKK workbook the planners use today):
 * - A CS can take a flight when they hold a licence for the flight's aircraft
 *   family + engine, their SAMS authorization is a valid CRS, and — for
 *   airlines with a customer authorization scheme — they are eligible for
 *   that airline. Other airlines need the licence only.
 * - Each flight becomes work blocks (whole ground time, or receive + release
 *   for overnight aircraft) plus a walking buffer; 1 block = 1 person.
 * - Positions = peak overlapping blocks in the day shift + in the night shift.
 * - Headcount = positions × staff per position (roster pattern) × relief factor.
 */

// ── Staff ───────────────────────────────────────────────────────────────────

export interface RosterLicence {
    combinationId: number;
    familyCode: string;
    series: string;
    engineCode: string;
}

export interface RosterAirlineAuth {
    airlineId: number;
    airlineCode: string;
    isEligible: boolean;
    statusName: string;
    expiryDate: string | null;
}

export interface RosterSamsAuth {
    authNo: string;
    statusName: string;
    isCrs: boolean;
    expiryDate: string | null;
    daysToExpiry: number | null;
    aircraftTypes: string[];
}

export interface RosterTransfer {
    id: number;
    stationId: number;
    stationCode: string;
}

export interface RosterStaff {
    staffId: number;
    employeeId: string;
    name: string;
    jobTitle: string;
    isActive: boolean;
    stationId: number | null;
    stationCode: string;
    transfers: RosterTransfer[];
    licences: RosterLicence[];
    amelLicenses: { licenseNumber: string; categoryId: number; expiryDate: string }[];
    sams: RosterSamsAuth | null;
    airlineAuths: RosterAirlineAuth[];
}

/** Active staff whose SAMS authorization is a CRS that has not expired. */
export function isValidCertifyingStaff(staff: RosterStaff): boolean {
    if (!staff.isActive || !staff.sams?.isCrs) return false;
    return staff.sams.daysToExpiry === null || staff.sams.daysToExpiry >= 0;
}

export type MovementStatus = 'Permanent' | 'Rotate' | 'Transfer';

/**
 * Rotate = has active transfer rows to other stations while keeping a home
 * station; Transfer = no home station left, only transfer rows.
 */
export function movementStatus(staff: RosterStaff): MovementStatus {
    const away = staff.transfers.filter((t) => t.stationId !== staff.stationId);
    if (away.length === 0) return 'Permanent';
    return staff.stationId ? 'Rotate' : 'Transfer';
}

// ── Matching ────────────────────────────────────────────────────────────────

export function normalizeCode(value: string | null | undefined): string {
    return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** "CFM56" matches "CFM56-5B"; an empty engine on either side matches any engine. */
export function enginesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
    const na = normalizeCode(a);
    const nb = normalizeCode(b);
    if (!na || !nb) return true;
    return na === nb || na.includes(nb) || nb.includes(na);
}

export function holdsLicenceFor(staff: RosterStaff, familyCode: string, engineCode: string): boolean {
    const fam = normalizeCode(familyCode);
    if (!fam) return false;
    return staff.licences.some(
        (l) => normalizeCode(l.familyCode) === fam && enginesMatch(l.engineCode, engineCode)
    );
}

/**
 * Airlines outside `authAirlineIds` have no customer authorization scheme,
 * so a valid SAMS CRS is enough for them.
 */
export function hasAirlineAuth(
    staff: RosterStaff,
    airlineId: number | null,
    authAirlineIds: ReadonlySet<number>
): boolean {
    if (airlineId === null || !authAirlineIds.has(airlineId)) return true;
    return staff.airlineAuths.some((a) => a.airlineId === airlineId && a.isEligible);
}

// ── Flights ─────────────────────────────────────────────────────────────────

export interface RosterFlight {
    key: string;
    label: string;
    airlineId: number | null;
    airlineCode: string;
    airlineName: string;
    familyCode: string;
    engineCode: string;
    /** Local ground time. */
    start: Date;
    end: Date;
    cancelled: boolean;
}

export function typeEngineKey(familyCode: string, engineCode: string): string {
    return `${familyCode || '?'}|${engineCode || ''}`;
}

export function typeEngineLabel(familyCode: string, engineCode: string): string {
    return engineCode ? `${familyCode || '?'} (${engineCode})` : familyCode || '?';
}

export interface FlightEligibility {
    flight: RosterFlight;
    /** Valid CS at the station holding the licence. */
    licensed: RosterStaff[];
    /** Of those, the ones also authorized for the airline. */
    authorized: RosterStaff[];
}

export function evaluateFlights(
    flights: RosterFlight[],
    stationStaff: RosterStaff[],
    authAirlineIds: ReadonlySet<number>
): FlightEligibility[] {
    const certifying = stationStaff.filter(isValidCertifyingStaff);
    return flights
        .filter((f) => !f.cancelled)
        .map((flight) => {
            const licensed = certifying.filter((s) => holdsLicenceFor(s, flight.familyCode, flight.engineCode));
            const authorized = licensed.filter((s) => hasAirlineAuth(s, flight.airlineId, authAirlineIds));
            return { flight, licensed, authorized };
        });
}

// ── Parameters ──────────────────────────────────────────────────────────────

/** Defaults from the "Assumptions" sheet of the Manpower_BKK workbook. */
export interface ManpowerParams {
    /** Overnight aircraft: minutes to receive after STA. */
    receiveMinutes: number;
    /** Overnight aircraft: minutes to release before STD. */
    releaseMinutes: number;
    /** Walking buffer added after every work block. */
    bufferMinutes: number;
    /** Ground time overlapping this local window (hours) makes the aircraft "overnight". */
    nightWindowStartHour: number;
    nightWindowEndHour: number;
    /** Day shift starts here; night shift starts at nightShiftStartHour. */
    dayShiftStartHour: number;
    nightShiftStartHour: number;
    /** Roster pattern, e.g. 3 on / 3 off. */
    workDays: number;
    offDays: number;
    /** Absence per year, in days. */
    annualLeaveDays: number;
    sickLeaveDays: number;
    trainingDays: number;
    /** Count Planning flights as well as Current ones. */
    includePlanning: boolean;
}

export const DEFAULT_MANPOWER_PARAMS: ManpowerParams = {
    receiveMinutes: 45,
    releaseMinutes: 60,
    bufferMinutes: 15,
    nightWindowStartHour: 2,
    nightWindowEndHour: 4,
    dayShiftStartHour: 6,
    nightShiftStartHour: 18,
    workDays: 3,
    offDays: 3,
    annualLeaveDays: 6,
    sickLeaveDays: 30,
    trainingDays: 10,
    includePlanning: false,
};

/** Staff needed to keep one position filled every day: (on + off) / on. */
export function staffPerPosition(p: ManpowerParams): number {
    return p.workDays > 0 ? (p.workDays + p.offDays) / p.workDays : 0;
}

/** Extra headcount to cover leave, sickness and training on working days. */
export function reliefFactor(p: ManpowerParams): number {
    const cycle = p.workDays + p.offDays;
    if (cycle <= 0) return 1;
    const workDaysPerYear = (365 * p.workDays) / cycle;
    const available = workDaysPerYear - p.annualLeaveDays - p.sickLeaveDays - p.trainingDays;
    return available > 0 ? workDaysPerYear / available : 1;
}

// ── Work blocks ─────────────────────────────────────────────────────────────

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export interface WorkBlock {
    flight: RosterFlight;
    start: Date;
    /** Includes the walking buffer. */
    end: Date;
}

/** True when the ground time covers the night window and is longer than receive + release. */
export function isOvernight(flight: RosterFlight, p: ManpowerParams): boolean {
    const groundMs = flight.end.getTime() - flight.start.getTime();
    if (groundMs <= (p.receiveMinutes + p.releaseMinutes) * MINUTE_MS) return false;
    // Check the night window on each calendar day the ground time touches.
    const day = new Date(flight.start);
    day.setHours(0, 0, 0, 0);
    for (let t = day.getTime(); t < flight.end.getTime(); t += DAY_MS) {
        const ws = t + p.nightWindowStartHour * HOUR_MS;
        const we = t + p.nightWindowEndHour * HOUR_MS;
        if (flight.start.getTime() < we && flight.end.getTime() > ws) return true;
    }
    return false;
}

/** Overnight aircraft need someone only to receive and release; others for the whole ground time. */
export function workBlocks(flight: RosterFlight, p: ManpowerParams): WorkBlock[] {
    const buffer = p.bufferMinutes * MINUTE_MS;
    if (isOvernight(flight, p)) {
        const receiveEnd = flight.start.getTime() + p.receiveMinutes * MINUTE_MS;
        const releaseStart = flight.end.getTime() - p.releaseMinutes * MINUTE_MS;
        return [
            { flight, start: flight.start, end: new Date(receiveEnd + buffer) },
            { flight, start: new Date(releaseStart), end: new Date(flight.end.getTime() + buffer) },
        ];
    }
    return [{ flight, start: flight.start, end: new Date(flight.end.getTime() + buffer) }];
}

/** Peak number of intervals overlapping at one instant. */
export function peakConcurrency(intervals: { start: Date; end: Date }[]): number {
    const events: [number, number][] = [];
    for (const { start, end } of intervals) {
        if (end.getTime() <= start.getTime()) continue;
        events.push([start.getTime(), 1], [end.getTime(), -1]);
    }
    // Ends sort before starts at the same instant: back-to-back blocks share one person.
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let current = 0;
    let peak = 0;
    for (const [, delta] of events) {
        current += delta;
        if (current > peak) peak = current;
    }
    return peak;
}

export interface ShiftPeak {
    day: number;
    night: number;
}

/**
 * Peak positions per shift for each day. A block belongs to the shift it
 * starts in; the night shift runs from nightShiftStartHour to the next
 * day's dayShiftStartHour and counts toward the day it starts on.
 */
export function shiftPeaksByDay(blocks: WorkBlock[], weekStart: Date, days: number, p: ManpowerParams): ShiftPeak[] {
    return Array.from({ length: days }, (_, d) => {
        const base = weekStart.getTime() + d * DAY_MS;
        const dayFrom = base + p.dayShiftStartHour * HOUR_MS;
        const nightFrom = base + p.nightShiftStartHour * HOUR_MS;
        const nightTo = base + DAY_MS + p.dayShiftStartHour * HOUR_MS;
        const inRange = (from: number, to: number) =>
            blocks.filter((b) => b.start.getTime() >= from && b.start.getTime() < to);
        return {
            day: peakConcurrency(inRange(dayFrom, nightFrom)),
            night: peakConcurrency(inRange(nightFrom, nightTo)),
        };
    });
}

// ── Analysis ────────────────────────────────────────────────────────────────

export interface Requirement {
    /** Peak positions per shift per day (index 0 = week start). */
    peaks: ShiftPeak[];
    /** Highest day-shift and night-shift positions across the week. */
    dayPositions: number;
    nightPositions: number;
    positions: number;
    /** positions × staff per position. */
    rosterStaff: number;
    /** rosterStaff × relief factor, rounded up. */
    required: number;
}

export function computeRequirement(
    flights: RosterFlight[],
    weekStart: Date,
    days: number,
    p: ManpowerParams
): Requirement {
    const blocks = flights.flatMap((f) => workBlocks(f, p));
    const peaks = shiftPeaksByDay(blocks, weekStart, days, p);
    const dayPositions = Math.max(0, ...peaks.map((x) => x.day));
    const nightPositions = Math.max(0, ...peaks.map((x) => x.night));
    const positions = dayPositions + nightPositions;
    const rosterStaff = Math.ceil(positions * staffPerPosition(p));
    return {
        peaks,
        dayPositions,
        nightPositions,
        positions,
        rosterStaff,
        required: Math.ceil(rosterStaff * reliefFactor(p)),
    };
}

export interface ShortageRow extends Requirement {
    key: string;
    label: string;
    familyCode: string;
    engineCode: string;
    /** Airline only on authorization rows. */
    airlineId?: number | null;
    airlineCode?: string;
    flightCount: number;
    /** Valid CS at the station who can take these flights. */
    available: number;
    shortage: number;
}

export interface ManpowerAnalysis {
    /** Whole station. */
    overall: Requirement & { available: number; shortage: number; flightCount: number };
    typeEngine: ShortageRow[];
    authorization: ShortageRow[];
    /** Flights nobody at the station can certify for the airline. */
    riskFlights: FlightEligibility[];
}

/** Planning flights are left out unless includePlanning is set. */
export interface AnalysisFlight extends RosterFlight {
    planning: boolean;
}

interface Group {
    sample: RosterFlight;
    flights: RosterFlight[];
    staff: Set<number>;
}

function addToGroup(map: Map<string, Group>, key: string, flight: RosterFlight, staff: RosterStaff[]) {
    let group = map.get(key);
    if (!group) {
        group = { sample: flight, flights: [], staff: new Set() };
        map.set(key, group);
    }
    group.flights.push(flight);
    staff.forEach((s) => group!.staff.add(s.staffId));
}

function buildRows(groups: Map<string, Group>, weekStart: Date, days: number, p: ManpowerParams, withAirline: boolean): ShortageRow[] {
    const rows: ShortageRow[] = [];
    for (const [key, { sample, flights, staff }] of groups) {
        const req = computeRequirement(flights, weekStart, days, p);
        rows.push({
            ...req,
            key,
            label: typeEngineLabel(sample.familyCode, sample.engineCode),
            familyCode: sample.familyCode,
            engineCode: sample.engineCode,
            ...(withAirline ? { airlineId: sample.airlineId, airlineCode: sample.airlineCode } : {}),
            flightCount: flights.length,
            available: staff.size,
            shortage: Math.max(0, req.required - staff.size),
        });
    }
    return rows.sort(
        (a, b) =>
            b.shortage - a.shortage ||
            (a.airlineCode ?? '').localeCompare(b.airlineCode ?? '') ||
            a.label.localeCompare(b.label, undefined, { numeric: true })
    );
}

export function analyzeManpower(
    flights: AnalysisFlight[],
    stationStaff: RosterStaff[],
    authAirlineIds: ReadonlySet<number>,
    weekStart: Date,
    days: number,
    p: ManpowerParams
): ManpowerAnalysis {
    const inScope = flights.filter((f) => p.includePlanning || !f.planning);
    const evaluated = evaluateFlights(inScope, stationStaff, authAirlineIds);

    const byType = new Map<string, Group>();
    const byAuth = new Map<string, Group>();
    for (const { flight, licensed, authorized } of evaluated) {
        const typeKey = typeEngineKey(flight.familyCode, flight.engineCode);
        addToGroup(byType, typeKey, flight, licensed);
        // Only airlines with a customer authorization scheme can be short of authorization.
        if (flight.airlineId !== null && authAirlineIds.has(flight.airlineId)) {
            addToGroup(byAuth, `${flight.airlineId}|${typeKey}`, flight, authorized);
        }
    }

    const counted = evaluated.map((e) => e.flight);
    const overallReq = computeRequirement(counted, weekStart, days, p);
    const available = stationStaff.filter(isValidCertifyingStaff).length;

    return {
        overall: {
            ...overallReq,
            flightCount: counted.length,
            available,
            shortage: Math.max(0, overallReq.required - available),
        },
        typeEngine: buildRows(byType, weekStart, days, p, false),
        authorization: buildRows(byAuth, weekStart, days, p, true),
        riskFlights: evaluated.filter((e) => e.authorized.length === 0),
    };
}

// ── Type / Engine headcount ─────────────────────────────────────────────────

export interface TypeEngineCount {
    key: string;
    familyCode: string;
    engineCode: string;
    label: string;
    /** Staff holding the licence. */
    licensed: RosterStaff[];
    /** Of those, valid CS (SAMS CRS not expired). */
    certifying: RosterStaff[];
}

/** One row per family + engine, counting each person once even with several series. */
export function countByTypeEngine(staff: RosterStaff[]): TypeEngineCount[] {
    const rows = new Map<string, TypeEngineCount>();
    for (const person of staff) {
        const seen = new Set<string>();
        for (const l of person.licences) {
            const key = typeEngineKey(l.familyCode, l.engineCode);
            if (seen.has(key)) continue;
            seen.add(key);
            let row = rows.get(key);
            if (!row) {
                row = {
                    key,
                    familyCode: l.familyCode,
                    engineCode: l.engineCode,
                    label: typeEngineLabel(l.familyCode, l.engineCode),
                    licensed: [],
                    certifying: [],
                };
                rows.set(key, row);
            }
            row.licensed.push(person);
            if (isValidCertifyingStaff(person)) row.certifying.push(person);
        }
    }
    return Array.from(rows.values()).sort(
        (a, b) =>
            a.familyCode.localeCompare(b.familyCode, undefined, { numeric: true }) ||
            a.engineCode.localeCompare(b.engineCode, undefined, { numeric: true })
    );
}
