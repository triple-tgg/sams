import type { RosterStaff } from '@/lib/roster/manpower';

export interface AmelColumn {
    id: string;
    label: string;
    engineKey: string;
}

export interface AmelGroup {
    id: string;
    aircraft: string;
    aircraftKey: string;
    color: string;
    darkColor?: string;
    columns: AmelColumn[];
}

export const AMEL_GROUPS: AmelGroup[] = [
    {
        id: 'A320',
        aircraft: 'A320',
        aircraftKey: 'A320',
        color: '#2563eb', // blue
        darkColor: '#60a5fa',
        columns: [
            { id: 'A320_V2500', label: 'A320 - CEO (V2500)', engineKey: 'V2500' },
            { id: 'A320_PW4000', label: 'A320 - CEO (PW4000)', engineKey: 'PW4000' },
        ],
    },
    {
        id: 'A321',
        aircraft: 'A321',
        aircraftKey: 'A321',
        color: '#2563eb',
        darkColor: '#60a5fa',
        columns: [
            { id: 'A321_PW4000', label: 'A321 - 200 (PW4000)', engineKey: 'PW4000' },
        ],
    },
    {
        id: 'A322',
        aircraft: 'A322',
        aircraftKey: 'A322',
        color: '#2563eb',
        darkColor: '#60a5fa',
        columns: [
            { id: 'A322_PW4000', label: 'A322 - (PW4000)', engineKey: 'PW4000' },
        ],
    },
    {
        id: 'A323',
        aircraft: 'A323',
        aircraftKey: 'A323',
        color: '#2563eb',
        darkColor: '#60a5fa',
        columns: [
            { id: 'A323_PW4000', label: 'A323 - 200 (PW4000)', engineKey: 'PW4000' },
            { id: 'A323_GE90', label: 'A323 - F (GE90)', engineKey: 'GE90' },
        ],
    },
    {
        id: 'A324',
        aircraft: 'A324',
        aircraftKey: 'A324',
        color: '#2563eb',
        darkColor: '#60a5fa',
        columns: [
            { id: 'A324_GE90', label: 'A324 - F (GE90)', engineKey: 'GE90' },
        ],
    },
    {
        id: 'A325',
        aircraft: 'A325',
        aircraftKey: 'A325',
        color: '#2563eb',
        darkColor: '#60a5fa',
        columns: [
            { id: 'A325_GE90', label: 'A325 - F (GE90)', engineKey: 'GE90' },
        ],
    },
    {
        id: 'A326',
        aircraft: 'A326',
        aircraftKey: 'A326',
        color: '#2563eb',
        darkColor: '#60a5fa',
        columns: [
            { id: 'A326_GE90', label: 'A325 - F (GE90)', engineKey: 'GE90' },
        ],
    },
];

export const TOTAL_AMEL_COLUMNS = AMEL_GROUPS.reduce((acc, g) => acc + g.columns.length, 0);

/**
 * Check if a staff member is qualified for a specific aircraft group & engine column.
 */
export function hasAmelQualification(
    staff: RosterStaff & { amelColKeys?: string[] },
    group: AmelGroup,
    col: AmelColumn
): boolean {
    // 1. Direct explicit keys (from mock data or custom annotations)
    if (staff.amelColKeys && staff.amelColKeys.length > 0) {
        if (staff.amelColKeys.includes(col.id)) return true;
        // Match specific engine/subtype variations
        if (col.id === 'A320_V2500' && (staff.amelColKeys.includes('A320_V2500') || staff.amelColKeys.includes('V2500'))) return true;
        if (col.id === 'A320_PW4000' && (staff.amelColKeys.includes('A320_PW') || staff.amelColKeys.includes('A320_PW4000') || staff.amelColKeys.includes('A320_CFM'))) return true;
        if (col.id === 'A321_PW4000' && (staff.amelColKeys.includes('A321_PW4000') || staff.amelColKeys.includes('A320_LEAP1A') || staff.amelColKeys.includes('A321_200_PW4000'))) return true;
        if (col.id === 'A322_PW4000' && (staff.amelColKeys.includes('A322_PW4000') || staff.amelColKeys.includes('A322'))) return true;
        if (col.id === 'A323_PW4000' && (staff.amelColKeys.includes('A323_PW4000') || staff.amelColKeys.includes('A323_200_PW4000'))) return true;
        if (col.id === 'A323_GE90' && (staff.amelColKeys.includes('A323_GE90') || staff.amelColKeys.includes('A323_F_GE90') || staff.amelColKeys.includes('B777_GE90'))) return true;
        if (col.id === 'A324_GE90' && (staff.amelColKeys.includes('A324_GE90') || staff.amelColKeys.includes('A324_F_GE90') || staff.amelColKeys.includes('B737_CFM'))) return true;
        if (col.id === 'A325_GE90' && (staff.amelColKeys.includes('A325_GE90') || staff.amelColKeys.includes('A325_F_GE90') || staff.amelColKeys.includes('B737_LEAP1B'))) return true;
        if (col.id === 'A326_GE90' && (staff.amelColKeys.includes('A326_GE90') || staff.amelColKeys.includes('A326_F_GE90') || staff.amelColKeys.includes('737NG_CFM'))) return true;
        if (staff.amelColKeys.some((k) => k === col.id || k === `${group.aircraftKey}_${col.engineKey}`)) return true;
    }

    // 2. Derive from staff.licences
    if (!staff.licences || staff.licences.length === 0) return false;

    return staff.licences.some((lic) => {
        const fam = (lic.familyCode || '').toUpperCase();
        const ser = (lic.series || '').toUpperCase();
        const eng = (lic.engineCode || '').toUpperCase();

        // Match aircraft group (A320, A321, A322, A323, A324, A325, A326)
        let matchAircraft = false;
        if (fam.includes(group.aircraftKey) || ser.includes(group.aircraftKey)) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A320' && (fam.includes('320') || fam.includes('A320'))) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A321' && (fam.includes('321') || fam.includes('A321'))) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A322' && (fam.includes('322') || fam.includes('A322'))) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A323' && (fam.includes('323') || fam.includes('A323'))) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A324' && (fam.includes('324') || fam.includes('A324'))) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A325' && (fam.includes('325') || fam.includes('A325'))) {
            matchAircraft = true;
        } else if (group.aircraftKey === 'A326' && (fam.includes('326') || fam.includes('A326'))) {
            matchAircraft = true;
        }
        if (!matchAircraft) return false;

        // Match engine
        switch (col.engineKey) {
            case 'V2500':
                return eng.includes('V2500') || eng.includes('IAE');
            case 'PW4000':
                return eng.includes('PW4000') || eng.includes('PW4') || eng.includes('PW');
            case 'GE90':
                return eng.includes('GE90') || eng.includes('GE');
            default:
                return eng.includes(col.engineKey.toUpperCase());
        }
    });
}

/**
 * Get formatted A/C Type summary (e.g. A320/A330, A320/B737M, etc.)
 */
export function getStaffAcTypeSummary(staff: RosterStaff & { acType?: string; amelColKeys?: string[] }): string {
    if (staff.acType) return staff.acType;

    const types = new Set<string>();
    if (staff.amelColKeys) {
        if (staff.amelColKeys.some((k) => k.startsWith('A320'))) types.add('A320');
        if (staff.amelColKeys.some((k) => k.startsWith('A321'))) types.add('A321');
        if (staff.amelColKeys.some((k) => k.startsWith('A322'))) types.add('A322');
        if (staff.amelColKeys.some((k) => k.startsWith('A323'))) types.add('A323');
        if (staff.amelColKeys.some((k) => k.startsWith('A324'))) types.add('A324');
        if (staff.amelColKeys.some((k) => k.startsWith('A325'))) types.add('A325');
        if (staff.amelColKeys.some((k) => k.startsWith('A326'))) types.add('A326');
        if (staff.amelColKeys.some((k) => k.startsWith('B737') || k.startsWith('737MAX'))) types.add('B737M');
        if (staff.amelColKeys.some((k) => k.startsWith('737NG'))) types.add('B737NG');
        if (staff.amelColKeys.some((k) => k.startsWith('A330'))) types.add('A330');
        if (staff.amelColKeys.some((k) => k.startsWith('A350'))) types.add('A350');
        if (staff.amelColKeys.some((k) => k.startsWith('B777'))) types.add('B777');
        if (staff.amelColKeys.some((k) => k.startsWith('B787'))) types.add('B787-9');
        if (staff.amelColKeys.some((k) => k.startsWith('B767'))) types.add('B767');
    }

    staff.licences.forEach((l) => {
        const fam = l.familyCode?.toUpperCase() || '';
        const ser = l.series?.toUpperCase() || '';
        if (fam.includes('A320') || fam.includes('320')) types.add('A320');
        else if (fam.includes('A321') || fam.includes('321')) types.add('A321');
        else if (fam.includes('A322') || fam.includes('322')) types.add('A322');
        else if (fam.includes('A323') || fam.includes('323')) types.add('A323');
        else if (fam.includes('A324') || fam.includes('324')) types.add('A324');
        else if (fam.includes('A325') || fam.includes('325')) types.add('A325');
        else if (fam.includes('A326') || fam.includes('326')) types.add('A326');
        else if (ser.includes('MAX')) types.add('B737M');
        else if (fam.includes('737') || ser.includes('NG')) types.add('B737NG');
        else if (fam.includes('A330')) types.add('A330');
        else if (fam.includes('A350')) types.add('A350');
        else if (fam.includes('777')) types.add('B777');
        else if (fam.includes('787')) types.add('B787');
        else if (fam.includes('767')) types.add('B767');
        else if (fam) types.add(fam);
    });

    if (types.size === 0 && staff.sams?.aircraftTypes?.length) {
        return staff.sams.aircraftTypes.join('/');
    }

    return Array.from(types).join('/') || '—';
}

export const AC_COLOR_MAP: Record<string, string> = {
    A320: 'text-amber-600 dark:text-amber-400',
    A321: 'text-amber-700 dark:text-amber-300',
    A322: 'text-orange-600 dark:text-orange-400',
    A323: 'text-emerald-600 dark:text-emerald-400',
    A324: 'text-teal-600 dark:text-teal-400',
    A325: 'text-cyan-600 dark:text-cyan-400',
    A326: 'text-blue-600 dark:text-blue-400',
    A330: 'text-purple-600 dark:text-purple-400',
    B737M: 'text-blue-600 dark:text-blue-400',
    B737NG: 'text-blue-700 dark:text-blue-400',
    '737M': 'text-blue-600 dark:text-blue-400',
    '737NG': 'text-blue-700 dark:text-blue-400',
    A350: 'text-amber-600 dark:text-amber-400',
    B777: 'text-emerald-700 dark:text-emerald-400',
    'B787-9': 'text-rose-600 dark:text-rose-400',
    B787: 'text-rose-600 dark:text-rose-400',
    B767: 'text-slate-700 dark:text-slate-300',
    E190: 'text-slate-900 dark:text-slate-200',
};

