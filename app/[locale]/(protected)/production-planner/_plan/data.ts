// Production Plan / Revenue Plan — types, mock data and calculations.
// Mock data only (no API yet); shapes mirror what the backend should return.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const YEARS = [2026, 2025, 2024];
/** Versions are kept for 3 years; only the newest N can still be edited. */
export const EDITABLE_VERSION_COUNT = 5;
export const STATIONS = ['BKK', 'DMK', 'HKT', 'CNX'];

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
        A: { b: 'Import OAG / Key in', p: 'Import OAG / Key in', a: 'จำนวน THF ที่ Done (THF 1)' },
        B: { b: '—', p: '—', a: '—' },
        C: { b: '—', p: '—', a: '—' },
        D: { b: '—', p: '—', a: '—' },
        E: { b: 'Import OAG / Key in', p: 'Import OAG / Key in', a: 'จำนวน THF ที่ Done (THF 2)' },
    },
    rev: {
        A: { b: 'Import / Key in', p: 'จำนวน Flight × Initial Price', a: 'ราคาจริงจาก THF ที่ออก invoice' },
        B: { b: 'Import / Key in', p: 'Import / Key in', a: 'Import / Key in' },
        C: { b: 'Import / Key in', p: 'Import / Key in', a: 'Import / Key in' },
        D: { b: 'Import / Key in', p: 'Import / Key in', a: 'Import / Key in' },
        E: { b: 'Import / Key in', p: 'จำนวน Flight × Initial Price', a: 'ราคาจริงจาก THF ที่ออก invoice' },
    },
};

export const THF_RULES: { cat: 'A' | 'E'; title: string; items: string[] }[] = [
    { cat: 'A', title: 'THF 1 (Cat A)', items: ['นับ Service ใน THF ที่เป็นประเภท Transit Check และมี Sub Type'] },
    {
        cat: 'E',
        title: 'THF 2 (Cat E)',
        items: ['Towing = Transit + Blank + Towing', 'Marshalling = Transit + Marshalling', 'Night stop = Night Stop + Blank', 'อื่นๆ ที่ไม่ใช่ Transit'],
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
}

/** Category A / E line: flight units + contract minimum price. */
export interface ProdLine extends LineInfo {
    /** Initial service price = contract minimum rate (USD per flight). */
    priceUsd: number;
    budget: number[];
    plan: number[];
    /** Done THF count — read-only, comes from THF. */
    actual: number[];
    /** Revenue budget in THB (keyed / imported on Revenue Plan). */
    revBudget: number[];
}

/** Category B / C / D revenue line: everything in THB, imported or keyed in. */
export interface RevLine extends LineInfo {
    budget: number[];
    plan: number[];
    actual: number[];
}

export interface Snapshot {
    prod: Record<'A' | 'E', ProdLine[]>;
    rev: Record<'B' | 'C' | 'D', RevLine[]>;
}

export interface PlanVersion {
    id: string;
    year: number;
    /** Named by import date, e.g. "08 Oct 2026 14:20". */
    label: string;
    source: 'Import OAG' | 'Key in';
    createdBy: string;
    editedBy: string | null;
    editedAt: string | null;
    snapshot: Snapshot;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export const zeros = () => MONTHS.map(() => 0);

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
                p: l.plan.map((u, i) => Math.round(u * l.priceUsd * fx[i])),
                a: maskOpen(
                    l.actual.map((u, i) => Math.round(u * l.priceUsd * INVOICE_UPLIFT[i] * fx[i])),
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
    const put = (arr: number[]) => arr.map((v, i) => (i === month ? value : v));
    if (isProdCat(cat)) {
        const field: keyof ProdLine | null = mode === 'prod' ? (series === 'b' ? 'budget' : series === 'p' ? 'plan' : null) : series === 'b' ? 'revBudget' : null;
        if (!field) return snap;
        return {
            ...snap,
            prod: { ...snap.prod, [cat]: snap.prod[cat].map((l) => (l.id === lineId ? { ...l, [field]: put(l[field] as number[]) } : l)) },
        };
    }
    const field = series === 'b' ? 'budget' : series === 'p' ? 'plan' : 'actual';
    return {
        ...snap,
        rev: { ...snap.rev, [cat]: snap.rev[cat].map((l) => (l.id === lineId ? { ...l, [field]: put(l[field]) } : l)) },
    };
}

export function upsertLine(snap: Snapshot, cat: CatCode, info: LineInfo & { priceUsd?: number }): Snapshot {
    if (isProdCat(cat)) {
        const exists = snap.prod[cat].some((l) => l.id === info.id);
        const lines = exists
            ? snap.prod[cat].map((l) => (l.id === info.id ? { ...l, ...info, priceUsd: info.priceUsd ?? l.priceUsd } : l))
            : [...snap.prod[cat], { ...info, priceUsd: info.priceUsd ?? 0, budget: zeros(), plan: zeros(), actual: zeros(), revBudget: zeros() }];
        return { ...snap, prod: { ...snap.prod, [cat]: lines } };
    }
    const exists = snap.rev[cat].some((l) => l.id === info.id);
    const lines = exists
        ? snap.rev[cat].map((l) => (l.id === info.id ? { ...l, ...info } : l))
        : [...snap.rev[cat], { ...info, budget: zeros(), plan: zeros(), actual: zeros() }];
    return { ...snap, rev: { ...snap.rev, [cat]: lines } };
}

export function removeLine(snap: Snapshot, cat: CatCode, lineId: string): Snapshot {
    if (isProdCat(cat)) return { ...snap, prod: { ...snap.prod, [cat]: snap.prod[cat].filter((l) => l.id !== lineId) } };
    return { ...snap, rev: { ...snap.rev, [cat]: snap.rev[cat].filter((l) => l.id !== lineId) } };
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
    ['HKT', 'XX', 'Airline 1', 'B737NG/MAX, A320', 'CFM LEAP-1B, CFM56', [5, 6, 7, 8, 2, 2, 3, 4, 5, 9, 10, 12], 30],
    ['HKT', 'XX', 'Airline 2', 'A320NEO, A320', 'V2500 / CFM56 / PW1100G / CFM LEAP-1A', [20, 20, 20, 10, 10, 10, 10, 10, 10, 20, 20, 20], 31],
    ['HKT', 'XX', 'Airline 3', 'B737MAX8', 'CFM LEAP-1B', [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], 31],
    ['HKT', 'XX', 'Airline 4', 'B737NG', 'CFM56', [60, 60, 60, 30, 30, 30, 30, 30, 30, 45, 60, 60], 29],
    ['HKT', 'XX', 'Airline 5', 'NG, MAX', 'CFM56 / CFM LEAP-1B', [10, 15, 15, 15, 10, 15, 10, 15, 15, 15, 10, 15], 32],
    ['HKT', 'XX', 'Airline 6', 'A321NEO/A320', 'V2500 / PW1100G', [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], 31],
];

const RAW_E: RawProd[] = [
    ['BKK', 'XX', 'Airline 1', 'B737-800', 'NG CFM56', [3, 3, 4, 4, 3, 3, 3, 4, 4, 3, 3, 4], 45],
    ['BKK', 'XX', 'Airline 5', 'A320', 'V2500', [6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 7, 8], 52],
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
    }));
}

/** Simulates an OAG import: same rows, recounted Plan frequencies. */
export function simulateOagPlan(snap: Snapshot, seed: number): Snapshot {
    const recount = (lines: ProdLine[]) =>
        lines.map((l, ri) => ({ ...l, plan: l.budget.map((v, i) => Math.max(0, v + DP[(i + ri + seed) % 12])) }));
    return { ...snap, prod: { A: recount(snap.prod.A), E: recount(snap.prod.E) } };
}
