// Production Plan / Revenue Plan — types, mock data and calculations.
// Mock data only (no API yet); shapes mirror what the backend should return.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const YEARS = [2026, 2025, 2024];
/** Versions are kept for 3 years; only the newest N can still be edited. */
export const EDITABLE_VERSION_COUNT = 5;
export const STATIONS = ['BKK', 'DMK', 'HKT', 'CNX'];
/** Aircraft type groups an airline's A/C types are filed under. */
export const TYPE_GROUPS = ['Aero', 'Y'];

export type Mode = 'prod' | 'rev';
export type CatCode = 'A' | 'B' | 'C' | 'D' | 'E';
export type Series = 'b' | 'p' | 'a';
export type MonthValues = (number | null)[];

export const CATEGORIES: { code: CatCode; name: string }[] = [
    { code: 'A', name: 'Transit Check' },
    { code: 'B', name: 'Lessor' },
    { code: 'C', name: 'Ad Hoc' },
    { code: 'D', name: 'Auxiliary' },
    { code: 'E', name: 'Non-Transit check scheduled services' },
];

/** Categories that have a Production Plan (flight frequency). */
export const PROD_CATS: CatCode[] = ['A', 'E'];
export const isProdCat = (c: CatCode): c is 'A' | 'E' => c === 'A' || c === 'E';

export const SERIES: Series[] = ['b', 'p', 'a'];
export const SERIES_LABEL: Record<Series, string> = { b: 'Budget', p: 'Plan', a: 'Actual' };

/** Where each value comes from — shown as a reference under the table. */
export const SOURCE_REF: Record<Mode, Record<CatCode, Record<Series, string>>> = {
    prod: {
        A: { b: 'Import OAG / Key in', p: 'Import OAG / Key in', a: 'Completed THF count (THF 1)' },
        B: { b: '—', p: '—', a: '—' },
        C: { b: '—', p: '—', a: '—' },
        D: { b: '—', p: '—', a: '—' },
        E: { b: 'Import OAG / Key in', p: 'Import OAG / Key in', a: 'Completed THF count (THF 2)' },
    },
    rev: {
        A: { b: 'Import / Key in', p: 'Flights × Initial Price', a: 'Actual price from invoiced THFs' },
        B: { b: 'Import / Key in', p: 'Import / Key in', a: 'Import / Key in' },
        C: { b: 'Import / Key in', p: 'Import / Key in', a: 'Import / Key in' },
        D: { b: 'Import / Key in', p: 'Import / Key in', a: 'Import / Key in' },
        E: { b: 'Import / Key in', p: 'Flights × Initial Price', a: 'Actual price from invoiced THFs' },
    },
};

export const THF_RULES: { cat: 'A' | 'E'; title: string; items: string[] }[] = [
    { cat: 'A', title: 'THF 1 (Cat A)', items: ['Counts THF services of type Transit Check that have a Sub Type'] },
    {
        cat: 'E',
        title: 'THF 2 (Cat E)',
        items: ['Towing = Transit + Blank + Towing', 'Marshalling = Transit + Marshalling', 'Night stop = Night Stop + Blank', 'Anything else that is not Transit'],
    },
];

// ── Data model ──────────────────────────────────────────────────────────────

export interface LineInfo {
    id: string;
    station: string;
    al: string;
    airline: string;
    acType: string;
    engine: string;
    /** Aircraft type group within the airline — one of TYPE_GROUPS. */
    typeGroup?: string;
    /** Aircraft-Engine Combination master id the A/C type + Engine were picked from. */
    combinationId?: number;
    /** All combinations picked for this row (a row may cover several, e.g. "B737-800, B737-8"). */
    combinationIds?: number[];
}

/** Category A / E line: flight units + contract minimum price. */
export interface ProdLine extends LineInfo {
    /** Initial service price = contract minimum rate (USD per flight). */
    priceUsd: number;
    /** `null` = not keyed in yet (shown as "—"). */
    budget: MonthValues;
    plan: MonthValues;
    /** Done THF count — read-only, comes from THF. */
    actual: MonthValues;
    /** Revenue budget in THB (keyed / imported on Revenue Plan). */
    revBudget: MonthValues;
}

/** Category B / C / D revenue line: everything in THB, imported or keyed in. */
export interface RevLine extends LineInfo {
    budget: MonthValues;
    plan: MonthValues;
    actual: MonthValues;
}

export interface Snapshot {
    prod: Record<'A' | 'E', ProdLine[]>;
    rev: Record<'B' | 'C' | 'D', RevLine[]>;
}

export type LogAction = 'create' | 'import' | 'figures' | 'add' | 'edit' | 'delete';

/** One change made to a version — shown in the version history detail. */
export interface VersionLogEntry {
    at: string;
    by: string;
    action: LogAction;
    /** Category the change was made in (absent for version-wide events). */
    cat?: CatCode;
    summary: string;
    /** Cell-level detail, e.g. "Jan: 5 → 6". */
    changes?: string[];
}

export interface PlanVersion {
    id: string;
    year: number;
    /** Named by import date, e.g. "08 Oct 2026 14:20". */
    label: string;
    source: 'Import OAG' | 'Key in';
    /** Optional remark entered when the version was created manually. */
    note?: string;
    createdBy: string;
    editedBy: string | null;
    editedAt: string | null;
    snapshot: Snapshot;
    /** Oldest first. */
    log: VersionLogEntry[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export const zeros = () => MONTHS.map(() => 0);
/** Months awaiting key-in. */
export const blanks = (): MonthValues => MONTHS.map(() => null);

/** Sum, or null when no month has a value yet (so totals show "—"). */
export function sumOrNull(values: MonthValues): number | null {
    return values.some((v) => v != null) ? sum(values) : null;
}

/** Months whose figures are final (a month is shown once it has ended). */
export function closedMonths(year: number, now = new Date()): number {
    const cy = now.getFullYear();
    if (year < cy) return 12;
    if (year > cy) return 0;
    return now.getMonth();
}

export const maskOpen = (values: MonthValues, closed: number): MonthValues => values.map((v, i) => (i < closed ? v : null));

export function sum(values: MonthValues): number {
    return values.reduce<number>((t, v) => t + (v ?? 0), 0);
}

export function addSeries(a: MonthValues, b: MonthValues): MonthValues {
    return a.map((x, i) => (x == null || b[i] == null ? null : x + (b[i] as number)));
}

/** Sum two series over the months both have values (for YTD comparisons). */
export function totalBoth(x: MonthValues, y: MonthValues): [number | null, number | null] {
    let sx = 0;
    let sy = 0;
    let n = 0;
    x.forEach((v, i) => {
        if (v != null && y[i] != null) {
            sx += v;
            sy += y[i] as number;
            n++;
        }
    });
    return n ? [sx, sy] : [null, null];
}

export const pct = (x: number, y: number) => Math.round(((x - y) / y) * 100);

export const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString('en-US'));

export function nowLabel(d = new Date()): string {
    const p2 = (n: number) => String(n).padStart(2, '0');
    return `${p2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** Actual invoice price is at or above the contract minimum rate. */
const INVOICE_UPLIFT = [1.02, 1.05, 1.0, 1.04, 1.03, 1.06, 1.01, 1.03, 1.05, 1.02, 1.04, 1.03];

// ── Calculations: build the grid lines for a category ──────────────────────

export interface GridLine extends LineInfo {
    priceUsd?: number;
    b: MonthValues;
    p: MonthValues;
    a: MonthValues;
    /** Which series the user can key in for this line. */
    editable: Record<Series, boolean>;
}

export function buildGridLines(mode: Mode, cat: CatCode, snap: Snapshot, fx: number[], closed: number): GridLine[] {
    if (isProdCat(cat)) {
        return snap.prod[cat].map((l) => {
            if (mode === 'prod') {
                return { ...l, b: l.budget, p: l.plan, a: maskOpen(l.actual, closed), editable: { b: true, p: true, a: false } };
            }
            return {
                ...l,
                b: l.revBudget,
                p: l.plan.map((u, i) => (u == null ? null : Math.round(u * l.priceUsd * fx[i]))),
                a: maskOpen(
                    l.actual.map((u, i) => (u == null ? null : Math.round(u * l.priceUsd * INVOICE_UPLIFT[i] * fx[i]))),
                    closed
                ),
                editable: { b: true, p: false, a: false },
            };
        });
    }
    return snap.rev[cat].map((l) => ({
        ...l,
        b: l.budget,
        p: l.plan,
        a: maskOpen(l.actual, closed),
        editable: { b: true, p: true, a: true },
    }));
}

/** Write one keyed-in value back into the snapshot (immutably). */
export function setSnapshotValue(snap: Snapshot, mode: Mode, cat: CatCode, lineId: string, series: Series, month: number, value: number): Snapshot {
    const put = (arr: MonthValues) => arr.map((v, i) => (i === month ? value : v));
    if (isProdCat(cat)) {
        const field: keyof ProdLine | null = mode === 'prod' ? (series === 'b' ? 'budget' : series === 'p' ? 'plan' : null) : series === 'b' ? 'revBudget' : null;
        if (!field) return snap;
        return {
            ...snap,
            prod: { ...snap.prod, [cat]: snap.prod[cat].map((l) => (l.id === lineId ? { ...l, [field]: put(l[field] as MonthValues) } : l)) },
        };
    }
    const field = series === 'b' ? 'budget' : series === 'p' ? 'plan' : 'actual';
    return {
        ...snap,
        rev: { ...snap.rev, [cat]: snap.rev[cat].map((l) => (l.id === lineId ? { ...l, [field]: put(l[field]) } : l)) },
    };
}

export function removeLine(snap: Snapshot, cat: CatCode, lineId: string): Snapshot {
    if (isProdCat(cat)) return { ...snap, prod: { ...snap.prod, [cat]: snap.prod[cat].filter((l) => l.id !== lineId) } };
    return { ...snap, rev: { ...snap.rev, [cat]: snap.rev[cat].filter((l) => l.id !== lineId) } };
}

/** Patch the descriptive fields of one row (A/C type, Engine, …) without touching its figures. */
export function patchLineInfo(snap: Snapshot, cat: CatCode, lineId: string, patch: Partial<Omit<LineInfo, 'id'>>): Snapshot {
    const apply = <T extends LineInfo>(l: T): T => (l.id === lineId ? { ...l, ...patch } : l);
    if (isProdCat(cat)) return { ...snap, prod: { ...snap.prod, [cat]: snap.prod[cat].map(apply) } };
    return { ...snap, rev: { ...snap.rev, [cat]: snap.rev[cat].map(apply) } };
}

/** Stand-in row that keeps an airline in the table while it has no type group / A/C type yet. */
export const isPlaceholderLine = (l: LineInfo) => !l.typeGroup && l.acType === '—' && !l.combinationIds?.length && l.combinationId == null;

/** Remove every row matching `match` (e.g. a whole airline or one of its type groups). */
export function removeLines(snap: Snapshot, cat: CatCode, match: (l: LineInfo) => boolean): Snapshot {
    if (isProdCat(cat)) return { ...snap, prod: { ...snap.prod, [cat]: snap.prod[cat].filter((l) => !match(l)) } };
    return { ...snap, rev: { ...snap.rev, [cat]: snap.rev[cat].filter((l) => !match(l)) } };
}

/** Append new rows with blank monthly figures (same as rows created from a structure). */
export function appendLines(snap: Snapshot, cat: CatCode, infos: Omit<LineInfo, 'id'>[]): Snapshot {
    const stamp = Date.now();
    const withId = infos.map((info, i) => ({ ...info, id: `${cat}-${info.station}-${stamp}-${i}` }));
    if (isProdCat(cat)) return { ...snap, prod: { ...snap.prod, [cat]: [...snap.prod[cat], ...withId.map((l) => ({ ...l, priceUsd: 0, budget: blanks(), plan: blanks(), actual: blanks(), revBudget: blanks() }))] } };
    return { ...snap, rev: { ...snap.rev, [cat]: [...snap.rev[cat], ...withId.map((l) => ({ ...l, budget: blanks(), plan: blanks(), actual: blanks() }))] } };
}

/** Rename an airline (AL + name) on every row it has at one station in a category. */
export function renameAirline(snap: Snapshot, cat: CatCode, station: string, from: Pick<LineInfo, 'al' | 'airline'>, to: Pick<LineInfo, 'al' | 'airline'>): Snapshot {
    const rename = <T extends LineInfo>(l: T): T => (l.station === station && l.al === from.al && l.airline === from.airline ? { ...l, ...to } : l);
    if (isProdCat(cat)) return { ...snap, prod: { ...snap.prod, [cat]: snap.prod[cat].map(rename) } };
    return { ...snap, rev: { ...snap.rev, [cat]: snap.rev[cat].map(rename) } };
}

/** New version template: an empty table (no rows) — lines are added via "+ Add row" or Import. */
export function emptySnapshot(): Snapshot {
    return { prod: { A: [], E: [] }, rev: { B: [], C: [], D: [] } };
}

/** Structure keyed in when creating a version: Station → Airline → Type group → A/C type + Engine. */
export interface StationGroup {
    station: string;
    airlines: {
        al: string;
        airline: string;
        /** Existing airline this node was loaded from (editing a station) — its rows keep their figures. */
        from?: { al: string; airline: string };
        typeGroups: { name: string; aircraft: { combinationId: number | null; acType: string; engine: string }[] }[];
    }[];
}

/** Several A/C type + Engine picks folded into one row: "A319/A320-200", "CFM LEAP-1A/CFM56/IAE PW1100G". */
export function mergeAircraft(picked: { acType: string; engine: string; combinationId?: number | null; combinationIds?: number[] }[]) {
    const uniq = (xs: string[]) => Array.from(new Set(xs.filter((x) => x && x !== '—')));
    const ids = picked.flatMap((p) => p.combinationIds ?? (p.combinationId != null ? [p.combinationId] : []));
    return {
        acType: uniq(picked.map((p) => p.acType)).join('/') || '—',
        engine: uniq(picked.map((p) => p.engine)).join('/') || '—',
        combinationId: ids[0],
        combinationIds: ids,
    };
}

/** One row per type group (its A/C types merged); an airline without type groups gets one "—" row. */
export function structureLines(structure: StationGroup[]): Omit<LineInfo, 'id'>[] {
    return structure.flatMap(({ station, airlines }) =>
        airlines.flatMap(({ al, airline, typeGroups }) =>
            typeGroups.length
                ? typeGroups.map((g) => ({ station, al, airline, typeGroup: g.name, ...mergeAircraft(g.aircraft) }))
                : [{ station, al, airline, acType: '—', engine: '—' }]
        )
    );
}

/** New version built from the structure: the same rows in each selected category, monthly figures blank. */
export function snapshotFromStructure(structure: StationGroup[], cats: CatCode[]): Snapshot {
    const snap = emptySnapshot();
    const infos = structureLines(structure);
    const stamp = Date.now();
    cats.forEach((cat) => {
        const withId = infos.map((info, i) => ({ ...info, id: `${cat}-${info.station}-${stamp}-${i}` }));
        if (isProdCat(cat)) snap.prod[cat] = withId.map((l) => ({ ...l, priceUsd: 0, budget: blanks(), plan: blanks(), actual: blanks(), revBudget: blanks() }));
        else snap.rev[cat] = withId.map((l) => ({ ...l, budget: blanks(), plan: blanks(), actual: blanks() }));
    });
    return snap;
}

/** Editable structure of one station, built from its rows (placeholder rows become an airline without type groups). */
export function stationStructure(lines: LineInfo[], station: string): StationGroup {
    const airlines: StationGroup['airlines'] = [];
    lines
        .filter((l) => l.station === station)
        .forEach((l) => {
            let a = airlines.find((x) => x.al === l.al && x.airline === l.airline);
            if (!a) {
                a = { al: l.al, airline: l.airline, from: { al: l.al, airline: l.airline }, typeGroups: [] };
                airlines.push(a);
            }
            if (!l.typeGroup) return;
            let g = a.typeGroups.find((t) => t.name === l.typeGroup);
            if (!g) {
                g = { name: l.typeGroup, aircraft: [] };
                a.typeGroups.push(g);
            }
            const ids = l.combinationIds ?? (l.combinationId != null ? [l.combinationId] : []);
            // Combination rows get their A/C type + Engine text from the master when saved; older rows keep their text
            g.aircraft.push(...(ids.length ? ids.map((id) => ({ combinationId: id, acType: '', engine: '' })) : [{ combinationId: null, acType: l.acType, engine: l.engine }]));
        });
    airlines.forEach((a) => a.typeGroups.sort((x, y) => TYPE_GROUPS.indexOf(x.name) - TYPE_GROUPS.indexOf(y.name)));
    return { station, airlines };
}

/**
 * Replace a station's rows with an edited structure. A row whose airline (by `from`) and type group still exist keeps
 * its id and monthly figures; rows merged into one type group have their figures added up. New groups start blank.
 */
export function applyStationStructure(snap: Snapshot, cat: CatCode, fromStation: string, group: StationGroup): Snapshot {
    const loose = (a: MonthValues, b: MonthValues): MonthValues => a.map((x, i) => (x == null && b[i] == null ? null : (x ?? 0) + (b[i] ?? 0)));
    const stamp = Date.now();
    const build = <T extends LineInfo>(old: T[], blank: (info: LineInfo) => T, fields: (keyof T)[]): T[] => {
        const mine = old.filter((l) => l.station === fromStation);
        const rows = group.airlines.flatMap((a) => {
            const src = a.from ?? a;
            const ofAirline = mine.filter((l) => l.al === src.al && l.airline === src.airline);
            return structureLines([{ station: group.station, airlines: [a] }]).map((info, i): T => {
                const matches = ofAirline.filter((l) => (info.typeGroup ? l.typeGroup === info.typeGroup : !l.typeGroup));
                if (!matches.length) return blank({ ...info, id: `${cat}-${group.station}-${stamp}-${a.al}-${i}` });
                const merged = { ...matches[0], ...info, id: matches[0].id } as T;
                fields.forEach((f) => {
                    merged[f] = matches.map((m) => m[f] as MonthValues).reduce(loose) as T[typeof f];
                });
                return merged;
            });
        });
        return [...old.filter((l) => l.station !== fromStation), ...rows];
    };
    if (isProdCat(cat)) {
        const lines = build<ProdLine>(snap.prod[cat], (info) => ({ ...info, priceUsd: 0, budget: blanks(), plan: blanks(), actual: blanks(), revBudget: blanks() }), ['budget', 'plan', 'actual', 'revBudget']);
        return { ...snap, prod: { ...snap.prod, [cat]: lines } };
    }
    const lines = build<RevLine>(snap.rev[cat], (info) => ({ ...info, budget: blanks(), plan: blanks(), actual: blanks() }), ['budget', 'plan', 'actual']);
    return { ...snap, rev: { ...snap.rev, [cat]: lines } };
}

// ── Mock data ───────────────────────────────────────────────────────────────

type RawProd = [station: string, al: string, airline: string, acType: string, engine: string, budget: number[], priceUsd: number];

const RAW_A: RawProd[] = [
    ['BKK', 'XX', 'Airline 1', 'B737-800', 'NG CFM56', [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], 32.4],
    ['BKK', 'XX', 'Airline 2', 'B737-800, B737-8', 'NG CFM56 / MAX LEAP-1B', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 31.5],
    ['BKK', 'XX', 'Airline 3', 'B737-700', 'NG CFM56', [10, 10, 10, 10, 10, 15, 15, 15, 15, 7, 8, 9], 30],
    ['BKK', 'XX', 'Airline 4', 'B737-800', 'NG CFM56', [8, 8, 15, 12, 9, 9, 9, 9, 20, 18, 9, 8], 30],
    ['BKK', 'XX', 'Airline 5', 'A320', 'V2500 / CFM56 / PW1100G / CFM LEAP-1A', [7, 7, 7, 8, 7, 8, 7, 8, 7, 7, 7, 10], 31.32],
    ['BKK', 'XX', 'Airline 6', 'B737', 'CFM56', [10, 15, 10, 15, 10, 15, 10, 15, 10, 15, 10, 15], 30.45],
    ['BKK', 'XX', 'Airline 7', 'A320', 'V2500', [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15], 31],
    ['HKT', 'XX', 'Airline 1', 'B737NG/MAX', 'CFM LEAP-1B', [3, 4, 4, 5, 1, 1, 2, 2, 3, 5, 6, 7], 30],
    ['HKT', 'XX', 'Airline 1', 'A320', 'CFM56', [2, 2, 3, 3, 1, 1, 1, 2, 2, 4, 4, 5], 30],
    ['HKT', 'XX', 'Airline 2', 'A320NEO, A320', 'V2500 / CFM56 / PW1100G / CFM LEAP-1A', [20, 20, 20, 10, 10, 10, 10, 10, 10, 20, 20, 20], 31],
    ['HKT', 'XX', 'Airline 3', 'B737MAX8', 'CFM LEAP-1B', [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], 31],
    ['HKT', 'XX', 'Airline 4', 'B737NG', 'CFM56', [60, 60, 60, 30, 30, 30, 30, 30, 30, 45, 60, 60], 29],
    ['HKT', 'XX', 'Airline 5', 'NG, MAX', 'CFM56 / CFM LEAP-1B', [10, 15, 15, 15, 10, 15, 10, 15, 15, 15, 10, 15], 32],
    ['HKT', 'XX', 'Airline 6', 'A321NEO/A320', 'V2500 / PW1100G', [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], 31],
];

const RAW_E: RawProd[] = [
    ['BKK', 'XX', 'Airline 1', 'B737-800', 'NG CFM56', [3, 3, 4, 4, 3, 3, 3, 4, 4, 3, 3, 4], 45],
    ['BKK', 'XX', 'Airline 5', 'A320', 'V2500', [6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 7, 8], 52],
    ['BKK', 'XX', 'Airline 5', 'B737-800', 'NG CFM56', [2, 2, 2, 3, 2, 2, 2, 3, 2, 2, 3, 3], 46],
    ['BKK', 'XX', 'Airline 7', 'A320', 'V2500', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 48],
    ['HKT', 'XX', 'Airline 2', 'A320NEO, A320', 'PW1100G / CFM LEAP-1A', [8, 8, 8, 5, 5, 5, 5, 5, 5, 8, 8, 8], 50],
    ['HKT', 'XX', 'Airline 4', 'B737NG', 'CFM56', [12, 12, 12, 6, 6, 6, 6, 6, 6, 10, 12, 12], 46],
];

type RawRev = [station: string, al: string, airline: string, acType: string, engine: string, monthlyThb: number];

const RAW_REV: Record<'B' | 'C' | 'D', RawRev[]> = {
    B: [
        ['BKK', 'XX', 'Lessor 1', 'A320', 'CFM56', 420000],
        ['BKK', 'XX', 'Lessor 2', 'B737-800', 'NG CFM56', 310000],
        ['HKT', 'XX', 'Lessor 3', 'A321NEO', 'PW1100G', 260000],
    ],
    C: [
        ['BKK', 'XX', 'Airline 8', 'B777', 'GE90', 180000],
        ['HKT', 'XX', 'Airline 9', 'A330', 'Trent 700', 150000],
    ],
    D: [
        ['BKK', 'XX', 'GSE Rental', '—', '—', 95000],
        ['BKK', 'XX', 'Tooling & Equipment', '—', '—', 60000],
        ['HKT', 'XX', 'GSE Rental', '—', '—', 70000],
    ],
};

const FX_2026 = [31.59, 31.43, 31.3, 32.99, 32.92, 31, 31, 31, 31, 31, 31, 31];
export const DEFAULT_FX: Record<number, number[]> = {
    2026: FX_2026,
    2025: [34.1, 33.9, 33.8, 33.6, 33.2, 32.9, 32.8, 33.1, 32.6, 32.4, 32.7, 32.5],
    2024: [35.6, 35.9, 35.7, 36.4, 36.8, 36.6, 36.3, 35.0, 33.7, 33.4, 34.2, 34.5],
};

const DP = [0, 1, -1, 2, 0, -2, 1, 0, 3, -1, 2, 1];
const DA = [-1, 0, 1, -2, 0, 1, -1, 2, 0];
const VARY = [0.97, 1.02, 0.99, 1.04, 1.0, 0.96, 1.03, 1.01, 0.98, 1.05, 1.0, 0.99];

const YEAR_SCALE: Record<number, number> = { 2026: 1, 2025: 0.9, 2024: 0.8 };

/** Mock type group: Airbus types under "Aero", the rest under "Y"; non-aircraft rows have none. */
const mockTypeGroup = (acType: string) => (acType === '—' ? undefined : acType.startsWith('A') ? 'Aero' : 'Y');

function buildProdLines(raw: RawProd[], cat: 'A' | 'E', year: number, seed: number, fx: number[]): ProdLine[] {
    const scale = YEAR_SCALE[year] ?? 1;
    return raw.map(([station, al, airline, acType, engine, base, priceUsd], ri) => {
        const budget = base.map((v) => Math.max(0, Math.round(v * scale)));
        const plan = budget.map((v, i) => Math.max(0, v + DP[(i + ri * 3 + seed) % 12]));
        const actual = plan.map((v, i) => Math.max(0, v + DA[(i + ri * 2) % 9]));
        return {
            id: `${cat}-${station}-${ri}`,
            station,
            al,
            airline,
            acType,
            engine,
            typeGroup: mockTypeGroup(acType),
            priceUsd,
            budget,
            plan,
            actual,
            revBudget: budget.map((u, i) => Math.round((u * priceUsd * fx[i]) / 100) * 100),
        };
    });
}

function buildRevLines(cat: 'B' | 'C' | 'D', year: number, seed: number): RevLine[] {
    const scale = YEAR_SCALE[year] ?? 1;
    return RAW_REV[cat].map(([station, al, airline, acType, engine, monthly], ri) => {
        const budget = MONTHS.map(() => Math.round((monthly * scale) / 1000) * 1000);
        return {
            id: `${cat}-${station}-${ri}`,
            station,
            al,
            airline,
            acType,
            engine,
            typeGroup: mockTypeGroup(acType),
            budget,
            plan: budget.map((v, i) => Math.round((v * VARY[(i + ri + seed) % 12]) / 1000) * 1000),
            actual: budget.map((v, i) => Math.round((v * VARY[(i + ri * 2 + seed + 3) % 12]) / 1000) * 1000),
        };
    });
}

function buildSnapshot(year: number, seed: number): Snapshot {
    const fx = DEFAULT_FX[year] ?? FX_2026;
    return {
        prod: { A: buildProdLines(RAW_A, 'A', year, seed, fx), E: buildProdLines(RAW_E, 'E', year, seed, fx) },
        rev: { B: buildRevLines('B', year, seed), C: buildRevLines('C', year, seed), D: buildRevLines('D', year, seed) },
    };
}

/** Newest first. Older than 3 years are purged; only the newest 5 are editable. */
const VERSION_SEED: [year: number, label: string, source: PlanVersion['source'], createdBy: string, editedBy: string | null, editedAt: string | null][] = [
    [2026, '08 Oct 2026 14:20', 'Import OAG', 'Commercial Admin', 'Commercial Admin', '12 Oct 2026 09:41'],
    [2026, '15 Sep 2026 09:05', 'Import OAG', 'Commercial Admin', null, null],
    [2026, '02 Aug 2026 16:40', 'Key in', 'Planning Officer', 'Planning Officer', '05 Aug 2026 11:02'],
    [2026, '10 Jan 2026 11:15', 'Import OAG', 'Commercial Admin', null, null],
    [2025, '12 Nov 2025 10:00', 'Import OAG', 'Commercial Admin', 'Planning Officer', '20 Nov 2025 15:12'],
    [2025, '20 Jun 2025 15:30', 'Import OAG', 'Commercial Admin', null, null],
    [2025, '08 Jan 2025 09:45', 'Key in', 'Planning Officer', null, null],
    [2024, '05 Dec 2024 13:10', 'Import OAG', 'Commercial Admin', null, null],
    [2024, '15 Jan 2024 10:20', 'Import OAG', 'Commercial Admin', null, null],
];

export function buildInitialVersions(): PlanVersion[] {
    return VERSION_SEED.map(([year, label, source, createdBy, editedBy, editedAt], i) => ({
        id: `v${VERSION_SEED.length - i}`,
        year,
        label,
        source,
        createdBy,
        editedBy,
        editedAt,
        snapshot: buildSnapshot(year, i),
        log: [
            { at: label, by: createdBy, action: source === 'Import OAG' ? 'import' : 'create', summary: source === 'Import OAG' ? 'Version created from OAG import' : 'Version created by key in' },
            ...(editedBy && editedAt ? [{ at: editedAt, by: editedBy, action: 'figures' as const, cat: 'A' as const, summary: 'Edited Budget of Airline 1 (BKK)', changes: ['Mar: 5 → 6', 'Apr: 5 → 6'] }] : []),
        ],
    }));
}

/** Simulates an OAG import: same rows, recounted Plan frequencies. */
export function simulateOagPlan(snap: Snapshot, seed: number): Snapshot {
    const recount = (lines: ProdLine[]) =>
        lines.map((l, ri) => ({ ...l, plan: l.budget.map((v, i) => (v == null ? null : Math.max(0, v + DP[(i + ri + seed) % 12]))) }));
    return { ...snap, prod: { A: recount(snap.prod.A), E: recount(snap.prod.E) } };
}
