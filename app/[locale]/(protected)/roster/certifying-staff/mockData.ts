import type { MonitoringCrsAirline } from '@/lib/api/qa/authorization/monitoring-crs';
import type { RosterAirlineAuth, RosterStaff } from '@/lib/roster/manpower';

/**
 * Sample data for the Certifying Staff matrix (toggle "Mock data" in development).
 * Shapes match what useRosterStaff() builds from staff listdata + monitoring-crs.
 */

export const MOCK_AIRLINES: MonitoringCrsAirline[] = [
    { airlineId: 9001, code: 'ABL', name: 'Air Busan', colorForeground: '#ffffff', colorBackground: '#1d4ed8', displayOrder: 1 },
    { airlineId: 9002, code: 'AFA', name: 'Afcom', colorForeground: '#ffffff', colorBackground: '#0f766e', displayOrder: 2 },
    { airlineId: 9003, code: 'AXB', name: 'Air India Express', colorForeground: '#7c2d12', colorBackground: '#fdba74', displayOrder: 3 },
    { airlineId: 9004, code: 'CEB', name: 'Cebu Pacific', colorForeground: '#1e3a8a', colorBackground: '#fde047', displayOrder: 4 },
    { airlineId: 9005, code: 'VSV', name: 'Scat Airlines', colorForeground: null, colorBackground: null, displayOrder: 5 },
];

/** Aircraft types each mock airline is serviced on (drives the sub-columns). */
const AIRLINE_TYPES: Record<string, string[]> = {
    ABL: ['A318', 'A319', 'A320', 'A321', 'A322'],
    AFA: ['A323', 'A324', 'A325', 'A326', 'A327'],
    AXB: ['B737', 'B38M'],
    CEB: ['A320', 'A321', 'A333'],
    VSV: [],
};

const PEOPLE: [string, string, string][] = [
    ['Aleks Reymer', 'EMP-0163', 'BKK'],
    ['Chalong Siri', '0022', 'BKK'],
    ['Mr. Decha Prasert-Amporn', '0068', 'BKK'],
    ['Papoj Imudom', '0028', 'HKT'],
    ['Phaisal Sengseang', '0020', 'CNX'],
    ['Somchai Kittipong', '0041', 'BKK'],
    ['Thanawat Boonmee', '0057', 'DMK'],
    ['Wichai Rattanakul', '0073', 'BKK'],
];

const LICENCES = [
    { familyCode: 'A320', series: 'CEO', engineCode: 'CFM56' },
    { familyCode: 'A320', series: 'NEO', engineCode: 'LEAP-1A' },
    { familyCode: 'B737', series: 'NG', engineCode: 'CFM56' },
    { familyCode: 'A330', series: '', engineCode: 'TRENT 700' },
];

const STATUSES: { status: string; name: string; eligible: boolean }[] = [
    { status: 'ELIGIBLE', name: 'Approved', eligible: true },
    { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true },
    { status: 'INELIGIBLE', name: 'Expired', eligible: false },
];

/** Deterministic pseudo-random so the sample stays stable between renders. */
function rand(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

export const MOCK_STAFF: RosterStaff[] = PEOPLE.map(([name, employeeId, stationCode], i) => {
    const airlineAuths: RosterAirlineAuth[] = MOCK_AIRLINES.flatMap((a, j) => {
        const r = rand(i * 31 + j);
        if (r < 0.25) return [];
        const s = STATUSES[r > 0.9 ? 2 : r > 0.75 ? 1 : 0];
        const types = AIRLINE_TYPES[a.code].filter((_, k) => rand(i * 17 + j * 7 + k) > 0.35);
        return [
            {
                airlineId: a.airlineId,
                airlineCode: a.code,
                isEligible: s.eligible,
                statusName: s.name,
                eligibilityStatus: s.status,
                expiryDate: `2027-0${(i % 9) + 1}-15`,
                aircraftTypes: types,
            },
        ];
    });

    return {
        staffId: -(i + 1),
        employeeId,
        name,
        jobTitle: i % 3 === 0 ? 'B1 Certifying Staff' : 'B1/B2 Certifying Staff',
        isActive: true,
        stationId: null,
        stationCode,
        transfers: i === 3 ? [{ id: 1, stationId: 0, stationCode: 'BKK' }] : [],
        licences: LICENCES.filter((_, k) => rand(i * 13 + k) > 0.4).map((l, k) => ({ combinationId: 90000 + i * 10 + k, ...l })),
        amelLicenses: [{ licenseNumber: `AMEL-${1000 + i}`, categoryId: 1, expiryDate: '2028-12-31' }],
        sams: {
            authNo: `SAMS-${String(100 + i).padStart(4, '0')}`,
            statusName: 'Approved',
            isCrs: true,
            expiryDate: '2027-12-31',
            daysToExpiry: 400 - i * 40,
            aircraftTypes: ['A320', 'B737'],
        },
        airlineAuths,
    };
});
