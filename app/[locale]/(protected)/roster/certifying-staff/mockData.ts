import type { MonitoringCrsAirline } from '@/lib/api/qa/authorization/monitoring-crs';
import type { RosterAirlineAuth, RosterStaff } from '@/lib/roster/manpower';
import type { AmelCertifyingStaffData, AircraftLicenceStaffData } from '@/lib/api/roster/certifyingStaff';

export const MOCK_AIRLINES: MonitoringCrsAirline[] = [
    { airlineId: 9001, code: 'ABL', name: 'Air Busan', colorForeground: '#ffffff', colorBackground: '#1d4ed8', displayOrder: 1 },
    { airlineId: 9002, code: 'AFA', name: 'Afcom', colorForeground: '#ffffff', colorBackground: '#0f766e', displayOrder: 2 },
    { airlineId: 9003, code: 'AXB', name: 'Air India Express', colorForeground: '#7c2d12', colorBackground: '#fdba74', displayOrder: 3 },
    { airlineId: 9004, code: 'CEB', name: 'Cebu Pacific', colorForeground: '#1e3a8a', colorBackground: '#fde047', displayOrder: 4 },
    { airlineId: 9005, code: 'VSV', name: 'Scat Airlines', colorForeground: null, colorBackground: null, displayOrder: 5 },
];

export const AIRLINE_TYPES: Record<string, string[]> = {
    ABL: [
        'A318 - 100 (CFM56)',
        'A319 - 100 (CFM56)',
        'A320 - CEO (CFM56)',
        'A320 - NEO (LEAP-1A)',
        'A321 - CEO (CFM56)',
        'A321 - NEO (LEAP-1A)',
        'A322 - (PW4000)',
    ],
    AFA: [
        'A320 - CEO (V2500)',
        'A320 - CEO (PW4000)',
        'A321 - 200 (PW4000)',
        'A322 - (PW4000)',
        'A323 - 200 (PW4000)',
        'A323 - F (GE90)',
        'A324 - F (GE90)',
        'A325 - F (GE90)',
        'A326 - F (GE90)',
    ],
    AXB: [
        'B38M - MAX 8 (LEAP-1B)',
        'B737 - 800 (CFM56)',
    ],
    CEB: [
        'A320 - CEO (CFM56)',
        'A321 - CEO (CFM56)',
        'A333 - 300 (Trent700)',
    ],
    VSV: [],
};

interface PersonnelSpec {
    name: string;
    employeeId: string;
    stationCode: string;
    position: string;
    acType: string;
    amelKeys: string[];
    isTransfer?: boolean;
    authOverrides?: Record<string, Record<string, { status: string; name: string; eligible: boolean }>>;
}

/** 29 staff members directly matching the Excel sheet (Image 1) & Image 2 */
const PERSONNEL: PersonnelSpec[] = [
    {
        name: 'Montree Chancharoen',
        employeeId: '0001',
        stationCode: 'BKK',
        position: 'CTO',
        acType: 'A320/A330',
        amelKeys: ['A320_V2500', 'A330_200_Trent700', 'A330_200_PW4000', 'A330_300_Trent700', 'A330_300_PW4000'],
    },
    {
        name: 'Pissanu Arunbutr',
        employeeId: '0002',
        stationCode: 'BKK',
        position: 'Chief Engineer',
        acType: 'A320/B737M',
        amelKeys: ['A320_CFM', 'A320_PW', 'B737_CFM', 'B737_LEAP1B'],
    },
    {
        name: 'Phaisal Sengseang',
        employeeId: '0020',
        stationCode: 'CNX',
        position: 'CS',
        acType: 'A320/B737NG',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'B737_CFM'],
        authOverrides: {
            ABL: { A320: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A321: { status: 'INELIGIBLE', name: 'Expired', eligible: false } },
            AXB: { B38M: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, B737: { status: 'INELIGIBLE', name: 'Expired', eligible: false } },
        },
    },
    {
        name: 'Sakkarin SukKhi',
        employeeId: '0021',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B737M',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'B737_CFM', 'B737_LEAP1B'],
    },
    {
        name: 'Paitoon Udompuech',
        employeeId: '0023',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW'],
    },
    {
        name: 'Amnuay Srichomsseng',
        employeeId: '0024',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A330/B737M/E190',
        amelKeys: [
            'A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW',
            'B737_CFM', 'B737_LEAP1B',
            'A330_200_Trent700', 'A330_200_PW4000',
            'A330_300_Trent700', 'A330_300_PW4000',
        ],
    },
    {
        name: 'Theerapong Nonteksew',
        employeeId: '0025',
        stationCode: 'DMK',
        position: 'CS',
        acType: 'A320/E190',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW'],
    },
    {
        name: 'Chanfit Leksongnean',
        employeeId: '0026',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A330',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'A330_300_Trent700', 'A350_TrentXWB'],
    },
    {
        name: 'Montean Thongrod',
        employeeId: '0027',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW'],
    },
    {
        name: 'Wasan Preechamai',
        employeeId: '0029',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B777',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'B777_Trent800', 'B777_GE90'],
    },
    {
        name: 'Pongsak Wongrak',
        employeeId: '0030',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'A350_TrentXWB'],
    },
    {
        name: 'Yuttasak Chaihongthongkul',
        employeeId: '0031',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW'],
    },
    {
        name: 'Chalong Siri',
        employeeId: '0022',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B777',
        amelKeys: ['A320_V2500', 'A320_CFM', 'B777_Trent800', 'B777_GE90'],
    },
    {
        name: 'Potal Jaisupap',
        employeeId: '0032',
        stationCode: 'HKT',
        position: 'CS',
        acType: 'A320/B737NG/E190',
        amelKeys: ['A320_V2500', 'A320_LEAP1A', '737NG_CFM'],
    },
    {
        name: 'Visit Chaiopathum',
        employeeId: '0033',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A330',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'A330_300_Trent700'],
    },
    {
        name: 'Veerapong Chivasakulchai *',
        employeeId: '0034',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A330/B777',
        amelKeys: [
            'A320_V2500', 'A320_LEAP1A',
            'A330_200_Trent700', 'A330_200_Trent7000', 'A330_200_PW4000',
            'A330_300_Trent700', 'A330_300_Trent7000', 'A330_300_PW4000',
            'B777_Trent800', 'B777_GE90',
        ],
    },
    {
        name: 'Somchai Phong buroose *',
        employeeId: '0035',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A330/B737M/E190',
        amelKeys: [
            'A320_V2500', 'A320_LEAP1A',
            'B737_CFM', 'B737_LEAP1B',
            'A330_200_Trent700', 'A330_200_Trent7000', 'A330_200_PW4000',
            'A330_300_Trent700', 'A330_300_Trent7000', 'A330_300_PW4000',
        ],
    },
    {
        name: 'Puchong Patsitepa',
        employeeId: '0036',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_CFM', 'A320_LEAP1A', 'A320_PW'],
    },
    {
        name: 'Shiravut Butmart',
        employeeId: '0037',
        stationCode: 'BKK',
        position: 'ACM',
        acType: 'A320',
        amelKeys: ['A320_CFM', 'A320_PW'],
    },
    {
        name: 'Jiroj Jirathan',
        employeeId: '0038',
        stationCode: 'DMK',
        position: 'CS',
        acType: 'A320/B737NG',
        amelKeys: ['A320_CFM', 'A320_PW', '737NG_CFM'],
    },
    {
        name: 'Norasete Phuektes',
        employeeId: '0039',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B737M',
        amelKeys: ['A320_V2500', 'A320_LEAP1A', 'B737_CFM', 'B737_LEAP1B'],
    },
    {
        name: 'Surapon Kro-tha',
        employeeId: '0040',
        stationCode: 'BKK',
        position: 'Sr. ACM',
        acType: 'A320/A350/B737NG',
        amelKeys: ['A320_V2500', 'A320_CFM', '737NG_CFM', 'A350_TrentXWB'],
    },
    {
        name: 'Chaiyo Mueyang',
        employeeId: '0042',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_CFM', 'A320_LEAP1A'],
    },
    {
        name: 'Amnuay Maledfang *',
        employeeId: '0043',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A330',
        amelKeys: ['A320_V2500'],
    },
    {
        name: 'Naphat Bungsawang',
        employeeId: '0044',
        stationCode: 'BKK',
        position: 'Chief Station',
        acType: 'A320/B737M',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'B737_CFM', 'B737_LEAP1B'],
    },
    {
        name: 'Anusorn Pothard',
        employeeId: '0045',
        stationCode: 'BKK',
        position: 'Sr. ACM',
        acType: 'A320/B737M',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'B737_CFM', 'B737_LEAP1B'],
    },
    {
        name: 'Pongnarin Wongsubun',
        employeeId: '0046',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B737NG/E190',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', '737NG_CFM'],
    },
    {
        name: 'Thawansak Bhammano',
        employeeId: '0047',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B787-9',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'B787_Trent1000', 'B787_GEnX'],
    },
    {
        name: 'Prascha Suwannarat',
        employeeId: '0048',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/A350/B737M',
        amelKeys: ['A320_V2500', 'A320_CFM', 'A320_LEAP1A', 'A320_PW', 'B737_CFM', 'B737_LEAP1B', 'A350_TrentXWB'],
    },
    // Supporting characters from image 2
    {
        name: 'Papoj Imudom',
        employeeId: '0028',
        stationCode: 'HKT',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_CFM', 'A320_LEAP1A'],
        isTransfer: true,
        authOverrides: {
            ABL: { A319: { status: 'INELIGIBLE', name: 'Expired', eligible: false }, A320: { status: 'INELIGIBLE', name: 'Expired', eligible: false }, A321: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true }, A322: { status: 'INELIGIBLE', name: 'Expired', eligible: false } },
            AXB: { B737: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true } },
        },
    },
    {
        name: 'Somchai Kittipong',
        employeeId: '0041',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320/B737NG',
        amelKeys: ['A320_CFM', 'A320_PW', 'B737_CFM'],
        authOverrides: {
            ABL: { A319: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A321: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A322: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
            AFA: { A324: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true }, A326: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A327: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
            AXB: { B38M: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, B737: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
        },
    },
    {
        name: 'Thanawat Boonmee',
        employeeId: '0057',
        stationCode: 'DMK',
        position: 'CS',
        acType: 'A320/B737NG',
        amelKeys: ['A320_CFM', 'B737_CFM'],
        authOverrides: {
            AFA: { A323: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A324: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true }, A326: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true } },
            AXB: { B38M: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
        },
    },
    {
        name: 'Mr. Decha Prasert-Amporn',
        employeeId: '0068',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_CFM'],
        authOverrides: {
            ABL: { A319: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A321: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
            AFA: { A324: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true }, A326: { status: 'INELIGIBLE', name: 'Expired', eligible: false }, A327: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true } },
            AXB: { B38M: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
        },
    },
    {
        name: 'Wichai Rattanakul',
        employeeId: '0073',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'B737NG',
        amelKeys: ['B737_CFM'],
        authOverrides: {
            ABL: { A319: { status: 'INELIGIBLE', name: 'Expired', eligible: false }, A322: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
            AFA: { A323: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A324: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A325: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A327: { status: 'AT_RISK', name: 'Approved (expiring)', eligible: true } },
            AXB: { B737: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
        },
    },
    {
        name: 'Aleks Reymer',
        employeeId: 'EMP-0163',
        stationCode: 'BKK',
        position: 'CS',
        acType: 'A320',
        amelKeys: ['A320_CFM'],
        authOverrides: {
            ABL: { A318: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, A322: { status: 'ELIGIBLE', name: 'Approved', eligible: true } },
            AXB: { B38M: { status: 'ELIGIBLE', name: 'Approved', eligible: true }, B737: { status: 'INELIGIBLE', name: 'Expired', eligible: false } },
        },
    },
];

function rand(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

export const MOCK_STAFF: (RosterStaff & { acType?: string; amelColKeys?: string[] })[] = PERSONNEL.map(
    (spec, i) => {
        // Airline authorizations
        const airlineAuths: RosterAirlineAuth[] = MOCK_AIRLINES.flatMap((a) => {
            const overrides = spec.authOverrides?.[a.code];
            const defaultAirlineTypes = AIRLINE_TYPES[a.code] || [];
            if (overrides) {
                const assignedTypes = defaultAirlineTypes.filter((t) =>
                    Object.keys(overrides).some((k) => t.startsWith(k) || k.startsWith(t) || t === k)
                );
                const typesToUse = assignedTypes.length > 0 ? assignedTypes : Object.keys(overrides);
                return typesToUse.map((t) => {
                    const ov =
                        overrides[t] ||
                        Object.entries(overrides).find(([k]) => t.startsWith(k) || k.startsWith(t))?.[1] ||
                        { eligible: true, name: 'Approved', status: 'ELIGIBLE' };
                    return {
                        airlineId: a.airlineId,
                        airlineCode: a.code,
                        isEligible: ov.eligible,
                        statusName: ov.name,
                        eligibilityStatus: ov.status,
                        expiryDate: '2027-10-15',
                        aircraftTypes: [t],
                    };
                });
            }

            const r = rand(i * 31 + a.airlineId);
            if (r < 0.4) return [];
            const types = AIRLINE_TYPES[a.code].filter((_, k) => rand(i * 17 + a.airlineId * 7 + k) > 0.45);
            if (types.length === 0) return [];
            const isAtRisk = r > 0.8;
            return [
                {
                    airlineId: a.airlineId,
                    airlineCode: a.code,
                    isEligible: true,
                    statusName: isAtRisk ? 'Approved (expiring)' : 'Approved',
                    eligibilityStatus: isAtRisk ? 'AT_RISK' : 'ELIGIBLE',
                    expiryDate: '2027-08-20',
                    aircraftTypes: types,
                },
            ];
        });

        // Synthetic licences based on AMEL keys
        const licences = spec.amelKeys.map((key, k) => {
            let familyCode = 'A320';
            let series = 'CEO';
            let engineCode = 'CFM56';
            if (key.includes('V2500')) engineCode = 'V2500';
            else if (key.includes('LEAP1A')) engineCode = 'LEAP-1A';
            else if (key.includes('LEAP1B')) { familyCode = 'B737'; series = 'MAX'; engineCode = 'LEAP-1B'; }
            else if (key.includes('PW4000')) { engineCode = 'PW4000'; }
            else if (key.includes('PW')) { engineCode = 'PW1100G'; }
            else if (key.includes('Trent7000')) { familyCode = 'A330'; series = 'NEO'; engineCode = 'TRENT 7000'; }
            else if (key.includes('Trent700')) { familyCode = 'A330'; series = 'CEO'; engineCode = 'TRENT 700'; }
            else if (key.includes('TrentXWB')) { familyCode = 'A350'; series = '900'; engineCode = 'TRENT XWB'; }
            else if (key.includes('Trent800')) { familyCode = 'B777'; series = '200'; engineCode = 'TRENT 800'; }
            else if (key.includes('GE90')) { familyCode = 'B777'; series = '300ER'; engineCode = 'GE90'; }
            else if (key.includes('Trent1000')) { familyCode = 'B787'; series = '9'; engineCode = 'TRENT 1000'; }
            else if (key.includes('GEnX')) { familyCode = 'B787'; series = '9'; engineCode = 'GENX'; }
            else if (key.includes('737')) { familyCode = 'B737'; series = 'NG'; engineCode = 'CFM56'; }

            return {
                combinationId: 90000 + i * 100 + k,
                familyCode,
                series,
                engineCode,
            };
        });

        return {
            staffId: -(i + 1),
            employeeId: spec.employeeId,
            name: spec.name,
            jobTitle: spec.position,
            acType: spec.acType,
            amelColKeys: spec.amelKeys,
            isActive: true,
            stationId: null,
            stationCode: spec.stationCode,
            transfers: spec.isTransfer ? [{ id: 1, stationId: 0, stationCode: 'BKK' }] : [],
            licences,
            amelLicenses: [{ licenseNumber: `AMEL-${1000 + i}`, categoryId: 1, expiryDate: '2028-12-31' }],
            sams: {
                authNo: `SAMS-${String(100 + i).padStart(4, '0')}`,
                statusName: 'Approved',
                isCrs: true,
                expiryDate: '2027-12-31',
                daysToExpiry: 400 - i * 10,
                aircraftTypes: spec.acType.split('/'),
            },
            airlineAuths,
        };
    }
);

export const MOCK_AMEL_DATA: AmelCertifyingStaffData = {
    columns: {
        fixedColumns: [
            { id: "no", label: "No.", width: 64, sticky: true },
            { id: "name", label: "Name", width: 160, sticky: true },
            { id: "position", label: "Position", width: 110, sticky: true },
            { id: "actype", label: "A/C Type", width: 110, sticky: true },
        ],
        groups: [
            {
                id: "A319",
                aircraft: "A319",
                columns: [
                    { id: "engine-49", label: "CFM-LEAP-1A", code: "CFM-LEAP-1A", engine: "CFM-LEAP-1A", width: 140 },
                ],
            },
            {
                id: "B767",
                aircraft: "B767",
                columns: [
                    { id: "engine-48", label: "200 RB211", code: "RB211", engine: "RB211", width: 140 },
                ],
            },
            {
                id: "B777",
                aircraft: "B777",
                columns: [
                    { id: "engine-51", label: "200 RB211-TRENT-800", code: "RB211-TRENT-800", engine: "RB211-TRENT-800", width: 140 },
                    { id: "engine-50", label: "300ER GE90", code: "GE90", engine: "GE90", width: 140 },
                ],
            },
            {
                id: "B787",
                aircraft: "B787",
                columns: [
                    { id: "engine-47", label: "9 RB211-TRENT-1000", code: "RB211-TRENT-1000", engine: "RB211-TRENT-1000", width: 140 },
                ],
            },
        ],
    },
    rows: [
        {
            id: "staff-163",
            staffNo: "EMP-0163",
            name: "Aleks Reymer",
            position: "MM",
            aircraftType: "B1.2",
            station: null,
            qualifications: {
                "engine-49": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-48": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-51": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-50": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-47": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
            },
        },
        {
            id: "staff-297",
            staffNo: "0068",
            name: "Mr. Decha Prasert-Amporn",
            position: "SE",
            aircraftType: "B1.1",
            station: null,
            qualifications: {
                "engine-49": { qualified: true, licenceNo: "1275", issueDate: "2023-03-26", expiryDate: "2028-03-25" },
                "engine-48": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-51": { qualified: true, licenceNo: "1275", issueDate: "2023-03-26", expiryDate: "2028-03-25" },
                "engine-50": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-47": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
            },
        },
        {
            id: "staff-164",
            staffNo: "0028",
            name: "Papoj Imudom",
            position: "ACI",
            aircraftType: "B1.2, B2, B1.1",
            station: "BKK",
            qualifications: {
                "engine-49": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-48": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-51": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-50": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-47": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
            },
        },
        {
            id: "staff-161",
            staffNo: "0020",
            name: "Phaisal Sangasang",
            position: "ACE",
            aircraftType: "B1.1, B1.2, B2",
            station: "BKK",
            qualifications: {
                "engine-49": { qualified: true, licenceNo: "TCAR-66.B1.1-0994", issueDate: "2024-03-15", expiryDate: "2029-03-14" },
                "engine-48": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-51": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-50": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
                "engine-47": { qualified: false, licenceNo: null, issueDate: null, expiryDate: null },
            },
        },
    ],
    pagination: {
        page: 1,
        pageSize: 20,
        totalRecords: 4,
        totalPages: 1,
    },
};

export const MOCK_AIRCRAFT_LICENCE_DATA: AircraftLicenceStaffData = {
    columns: {
        fixedColumns: [
            { id: "no", label: "No.", width: 64, sticky: true },
            { id: "name", label: "Name", width: 160, sticky: true },
            { id: "position", label: "Position", width: 110, sticky: true },
            { id: "actype", label: "A/C Type", width: 110, sticky: true },
        ],
        airlines: [
            {
                airlineId: "airline-3",
                airlineName: "Air India",
                airlineCode: "AIC",
                aircraftTypes: [
                    {
                        typeId: "A319",
                        typeName: "A319",
                        subtypes: [
                            {
                                id: "airline-3-engine-49",
                                label: "A319 (CFM-LEAP-1A)",
                                engine: "CFM-LEAP-1A",
                                width: 140,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    rows: [
        {
            id: "staff-163",
            staffNo: "EMP-0163",
            name: "Aleks Reymer",
            position: "MM",
            aircraftType: "B1.2",
            station: null,
            authorizations: {
                "airline-3": {
                    "airline-3-engine-49": {
                        status: "false",
                        authNo: null,
                        expiryDate: "2026-12-28",
                    },
                },
            },
        },
        {
            id: "staff-297",
            staffNo: "0068",
            name: "Mr. Decha Prasert-Amporn",
            position: "SE",
            aircraftType: "B1.1",
            station: null,
            authorizations: {
                "airline-3": {
                    "airline-3-engine-49": {
                        status: "false",
                        authNo: null,
                        expiryDate: null,
                    },
                },
            },
        },
        {
            id: "staff-164",
            staffNo: "0028",
            name: "Papoj Imudom",
            position: "ACI",
            aircraftType: "B1.2, B2, B1.1",
            station: "BKK",
            authorizations: {
                "airline-3": {
                    "airline-3-engine-49": {
                        status: "false",
                        authNo: null,
                        expiryDate: null,
                    },
                },
            },
        },
        {
            id: "staff-161",
            staffNo: "0020",
            name: "Phaisal Sangasang",
            position: "ACE",
            aircraftType: "B1.1, B1.2, B2",
            station: "BKK",
            authorizations: {
                "airline-3": {
                    "airline-3-engine-49": {
                        status: "false",
                        authNo: null,
                        expiryDate: null,
                    },
                },
            },
        },
    ],
    pagination: {
        page: 1,
        pageSize: 20,
        totalRecords: 4,
        totalPages: 1,
    },
};


