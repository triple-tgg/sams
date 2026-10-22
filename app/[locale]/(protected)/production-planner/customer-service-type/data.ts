// Customer Service Type — mock data & helpers
// Source: SAMS_Commercial_Prototype_2.html (ข้อมูลตัวอย่าง). Replace with API once available.

export const CS_TYPES = ['Full CRS', 'STBY', 'On-Call', 'Towing', 'Adhoc', 'On hold'] as const;
export type ServiceType = (typeof CS_TYPES)[number];

export const CS_DOT: Record<ServiceType, string> = {
    'Full CRS': '#12305f',
    STBY: '#5b8def',
    'On-Call': '#0f8a7a',
    Towing: '#7c4dcc',
    Adhoc: '#d9822b',
    'On hold': '#b8c2d3',
};

/** Display order of stations (columns). */
export const ST_ORDER = ['BKK', 'DMK', 'HKT', 'CNX', 'HDY', 'CEI', 'UTH', 'KBV'];

export interface ServiceLine {
    station: string;
    type: ServiceType;
    /** เงื่อนไขเพิ่มเติม (add-on), e.g. "+ Night Stop" */
    addon: string;
    /** Aircraft types, free text e.g. "B737NG, B737 Max" ('' = none) */
    aircraft: string;
}

export interface CustomerService {
    name: string;
    icao: string;
    iata: string;
    services: ServiceLine[];
}

type Raw = [string, ServiceType, string, string];
const mk = (name: string, icao: string, iata: string, svc: Raw[]): CustomerService => ({
    name,
    icao,
    iata: iata === '—' ? '' : iata,
    services: svc.map(([station, type, addon, aircraft]) => ({ station, type, addon, aircraft: aircraft === '—' ? '' : aircraft })),
});

export const CS_SEED: CustomerService[] = [
    mk('9 Air', 'JYH', 'AQ', [['BKK', 'Full CRS', '+ Night Stop', 'B737NG, B737 Max'], ['DMK', 'Full CRS', '', 'B737NG, B737 Max'], ['HKT', 'Full CRS', '', 'B737NG, B737 Max']]),
    mk('Afcom', 'AFA', 'MP', [['BKK', 'Full CRS', '', 'B737NG (B737-800 BCF)']]),
    mk('Air Astana', 'KZR', 'KC', [['HKT', 'Full CRS', '', 'A320, B767']]),
    mk('Air India', 'AIC', 'AI', [['BKK', 'Full CRS', '', 'A320']]),
    mk('Air India Express', 'AXB', 'IX', [['BKK', 'Full CRS', '', 'A320, B737NG, B737 Max'], ['HKT', 'Full CRS', '', 'A320, B737NG, B737 Max']]),
    mk('Air Macau', 'AMU', '—', [['DMK', 'On hold', '', '—']]),
    mk('Akasa Air', 'AKJ', 'QP', [['HKT', 'Full CRS', '', 'B737 Max']]),
    mk('Cebu Pacific', 'CEB', '5J', [['BKK', 'Full CRS', '+ Headset', 'A330'], ['BKK', 'STBY', '+ Headset', 'A320'], ['DMK', 'STBY', '', 'A320'], ['CNX', 'STBY', '', 'A320']]),
    mk('China Central Longhao Airlines', 'LHA', 'GI', [['BKK', 'On hold', '', '—'], ['DMK', 'On hold', '', '—'], ['HKT', 'On hold', '', '—']]),
    mk('Druk Air', 'DRK', 'KB', [['BKK', 'Towing', '', 'A320 Family']]),
    mk('Firefly', 'FFM', 'FY', [['KBV', 'Full CRS', '', 'B737NG']]),
    mk('Indigo', 'IGO', '6E', [['BKK', 'Full CRS', '', 'A320'], ['HKT', 'Full CRS', '', 'A320']]),
    mk('Jiangsu Jingdong Cargo Airlines (JDL)', 'JDL', 'JG', [['BKK', 'Full CRS', '', 'B737NG'], ['HKT', 'On-Call', 'Mechanic', 'B737-800 BCF']]),
    mk('Malaysia Airlines', 'MAS', 'MH', [['CNX', 'Full CRS', '', 'B737NG'], ['BKK', 'Full CRS', '+ Mechanic Assistance ช่วงเริ่มต้น', 'B737NG, B737 Max']]),
    mk('Myanmar National Airlines (MNA)', 'UBA', 'UB', [['BKK', 'On hold', '', '—'], ['DMK', 'On hold', '', '—']]),
    mk('NOK Air', 'NOK', 'DD', [['BKK', 'Adhoc', '', '—'], ['DMK', 'Adhoc', '', '—']]),
];

/** Customer is "on hold" when every service line is On hold. */
export const isHold = (c: CustomerService) => c.services.length > 0 && c.services.every((s) => s.type === 'On hold');

/** Stations that actually appear in the data, in ST_ORDER. */
export const usedStations = (list: CustomerService[]) =>
    ST_ORDER.filter((st) => list.some((c) => c.services.some((s) => s.station === st)));

export const isServiceType = (v: string): v is ServiceType => (CS_TYPES as readonly string[]).includes(v);

export const sortByName = (list: CustomerService[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

/** Excel header used by both Export and Import (one row per service line). */
export const CS_SHEET_HEADER = ['Airline', 'ICAO', 'IATA', 'Station', 'Service Type', 'เงื่อนไขเพิ่มเติม', 'Aircraft Type', 'Status'];
