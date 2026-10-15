'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Check, Filter, FlaskConical, Search, User, UserCheck, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { groupCombinationDisplayLabels } from '@/lib/utils/aircraftEngineDisplay';
import { useRosterStaff } from '@/lib/roster/useRosterData';
import { getCustomerAuthList, type CustomerAuthStaffItem } from '@/lib/api/qa/authorization/customer-auth';
import { isValidCertifyingStaff, movementStatus, type MovementStatus, type RosterStaff } from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect } from '../components/RosterUi';
import { MOCK_AIRLINES, MOCK_STAFF } from './mockData';
import {
    buildMatrixFromCustomerAuth,
    buildMatrixFromMock,
    CRS_STATUS_META,
    getCellCrs,
    type CrsCellStatus,
    type MatrixAirline,
    type MatrixCell,
} from './authMatrix';

const UNASSIGNED = '__none__';
const NAME_COL_WIDTH = 220;
const LICENCE_COL_WIDTH = 200;
const SHOW_MOCK_TOGGLE = process.env.NODE_ENV !== 'production';

function LicenceCell({ labels }: { labels: string[] }) {
    const [expanded, setExpanded] = useState(false);
    if (labels.length === 0) return <span className="text-muted-foreground">—</span>;
    const chip = 'rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300';
    const btn =
        'shrink-0 rounded border border-[#2c5282]/30 bg-[#2c5282]/5 px-1.5 py-0.5 text-[10px] font-bold text-[#2c5282] hover:bg-[#2c5282]/15 dark:text-sky-300';
    const extra = labels.length - 1;

    if (!expanded) {
        return (
            <div className="flex min-w-0 items-center gap-1">
                <span className={cn(chip, 'min-w-0 truncate')} title={labels.join(', ')}>
                    {labels[0]}
                </span>
                {extra > 0 && (
                    <button type="button" className={btn} onClick={() => setExpanded(true)} title="Show all licences">
                        +{extra}
                    </button>
                )}
            </div>
        );
    }
    return (
        <div className="flex flex-wrap items-center gap-1">
            {labels.map((l) => (
                <span key={l} className={chip}>
                    {l}
                </span>
            ))}
            <button type="button" className={btn} onClick={() => setExpanded(false)}>
                Less
            </button>
        </div>
    );
}

function licenceLabels(staff: RosterStaff): string[] {
    const combos = staff.licences.map((l) => ({ id: l.combinationId, familyCode: l.familyCode, series: l.series, engineCode: l.engineCode }));
    return groupCombinationDisplayLabels(combos.map((c) => c.id), combos);
}

function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.format('DD MMM YYYY') : value;
}

const MOVEMENT_TONE: Record<MovementStatus, 'default' | 'info' | 'warning'> = {
    Permanent: 'default',
    Rotate: 'info',
    Transfer: 'warning',
};

// ── Customer Authorization matrix ───────────────────────────────────────────

/** One airline column group; `types` empty = a single status column. */
interface AirlineGroup {
    airline: MatrixAirline;
    types: string[];
}

/** perPage capped at 100 to be safe — walk every page. */
async function fetchAllCustomerAuth(): Promise<CustomerAuthStaffItem[]> {
    const all: CustomerAuthStaffItem[] = [];
    for (let page = 1; page <= 50; page++) {
        const res = await getCustomerAuthList({ searchKeyword: '', status: null, airlineId: null, page, perPage: 100 });
        const batch = res.responseData ?? [];
        all.push(...batch);
        if (batch.length < 100 || all.length >= (res.totalAll || res.total || 0)) break;
    }
    return all;
}

function airlineLabel(a: { code: string; name: string }) {
    return a.name ? `${a.code} — ${a.name}` : a.code;
}

const HEADER_NAVY = '#2c5282';

/** Airline colour usable as text on a light header (falls back to slate when the colour is too light). */
function readableColor(...candidates: (string | null | undefined)[]) {
    for (const c of candidates) {
        const m = c?.trim().match(/^#?([0-9a-f]{6})$/i);
        if (!m) continue;
        const n = parseInt(m[1], 16);
        const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        if ((0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.62) return `#${m[1]}`;
    }
    return '#334155';
}

function StatusDot({ status, size = 10 }: { status: CrsCellStatus; size?: number }) {
    const color = CRS_STATUS_META[status].dot;
    return (
        <span
            className="inline-block rounded-full"
            style={{
                width: size,
                height: size,
                background: color,
                boxShadow: status !== 'pending' ? `0 0 0 3px ${color}33` : undefined,
            }}
        />
    );
}

/** Matrix cell for one airline × aircraft type (or the airline's single status column when `type` is null). */
function AuthCell({ cell, airline, type, groupStart }: { cell?: MatrixCell; airline: MatrixAirline; type: string | null; groupStart: boolean }) {
    const covered = !!cell && (type === null || cell.aircraft.includes(type));
    const crs = covered && cell ? getCellCrs(cell, type) : null;
    const meta = crs ? CRS_STATUS_META[crs] : null;
    const title =
        cell && meta
            ? `${airline.code}${type ? ` · ${type}` : ''} · ${meta.label}${cell.expiryDate ? ` · Exp. ${formatDate(cell.expiryDate)}` : ''}`
            : undefined;

    return (
        <td
            title={title}
            className={cn('h-12 border-b border-l border-border/50 px-1 text-center align-middle', groupStart && 'border-l-border')}
            style={meta ? { background: meta.bg } : undefined}
        >
            {crs && meta ? (
                <div className="flex flex-col items-center justify-center gap-1 leading-none">
                    <StatusDot status={crs} />
                    <span className="text-[9px] font-bold uppercase" style={{ color: meta.text }}>
                        {meta.label}
                    </span>
                </div>
            ) : (
                <span className="text-xs text-muted-foreground">-</span>
            )}
        </td>
    );
}

// ── Column filters (Airlines / Aircraft) ──

interface ColumnFilterItem<K> {
    key: K;
    label: string;
    color?: string | null;
    meta?: string;
}

/** Searchable column-visibility popover (Airlines / Aircraft). */
function ColumnFilter<K extends string | number>({
    label,
    title,
    items,
    hidden,
    onChange,
    emptyText,
}: {
    label: string;
    title: string;
    items: ColumnFilterItem<K>[];
    hidden: Set<K>;
    onChange: (next: Set<K>) => void;
    emptyText: string;
}) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const shown = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
    const visibleCount = items.filter((i) => !hidden.has(i.key)).length;
    const filtering = visibleCount !== items.length;
    const toggle = (key: K) => {
        const next = new Set(hidden);
        next.has(key) ? next.delete(key) : next.add(key);
        onChange(next);
    };
    /** All / None apply to the items matching the search. */
    const setShown = (visible: boolean) => {
        const next = new Set(hidden);
        shown.forEach((i) => (visible ? next.delete(i.key) : next.add(i.key)));
        onChange(next);
    };

    return (
        <Popover onOpenChange={(open) => !open && setQuery('')}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-all',
                        filtering
                            ? 'border-[#075CA2]/30 bg-[#075CA2]/10 text-[#075CA2]'
                            : 'border-border bg-card text-muted-foreground hover:border-[#075CA2]/40 hover:text-foreground'
                    )}
                >
                    <Filter className="h-3 w-3" />
                    {label}
                    {filtering && (
                        <span className="rounded-full bg-[#075CA2] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                            {visibleCount}/{items.length}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] p-2">
                <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
                    <div className="flex gap-1.5 text-[10px] font-medium">
                        <button type="button" onClick={() => setShown(true)} className="text-[#075CA2] hover:underline">
                            All
                        </button>
                        <span className="text-muted-foreground/40">|</span>
                        <button type="button" onClick={() => setShown(false)} className="text-[#075CA2] hover:underline">
                            None
                        </button>
                    </div>
                </div>
                <div className="mb-2 border-b border-border pb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-[#075CA2]/40 focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                        />
                    </div>
                </div>
                {items.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">{emptyText}</p>
                ) : shown.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">No match for “{query}”.</p>
                ) : (
                    <div className="grid max-h-[280px] grid-cols-1 gap-0.5 overflow-y-auto">
                        {shown.map((item) => {
                            const checked = !hidden.has(item.key);
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => toggle(item.key)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-all',
                                        checked ? 'bg-[#075CA2]/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-all',
                                            checked ? 'border-[#075CA2] bg-[#075CA2]' : 'border-slate-300 bg-white'
                                        )}
                                    >
                                        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                    </span>
                                    {item.color !== undefined && (
                                        <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: item.color || '#94a3b8' }} />
                                    )}
                                    <span className="truncate">{item.label}</span>
                                    {item.meta && <span className="ml-auto shrink-0 text-[10px] font-normal text-muted-foreground">{item.meta}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ── Page ──

export default function CertifyingStaffPage() {
    const live = useRosterStaff();
    // True/False/Pending API isn't ready yet → show mock data by default in development.
    const [useMock, setUseMock] = useState(SHOW_MOCK_TOGGLE);
    const customerAuthQuery = useQuery({
        queryKey: ['roster', 'customer-auth-all'],
        queryFn: fetchAllCustomerAuth,
        staleTime: 5 * 60 * 1000,
        enabled: !useMock,
    });
    const staff = useMock ? MOCK_STAFF : live.staff;
    const { stations } = live;
    const isLoading = !useMock && (live.isLoading || customerAuthQuery.isLoading);
    const error = useMock ? null : live.error || customerAuthQuery.error;

    const [search, setSearch] = useState('');
    const [stationCode, setStationCode] = useState('');
    const [movement, setMovement] = useState<'' | MovementStatus>('');
    const [hiddenAirlines, setHiddenAirlines] = useState<Set<number>>(new Set());
    const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

    const matrix = useMemo(
        () => (useMock ? buildMatrixFromMock(MOCK_AIRLINES, MOCK_STAFF) : buildMatrixFromCustomerAuth(customerAuthQuery.data ?? [])),
        [useMock, customerAuthQuery.data]
    );
    const groups = useMemo<AirlineGroup[]>(() => matrix.airlines.map((a) => ({ airline: a, types: a.types })), [matrix]);
    const airlineItems = useMemo<ColumnFilterItem<number>[]>(
        () =>
            groups.map(({ airline, types }) => ({
                key: airline.airlineId,
                label: airlineLabel(airline),
                color: airline.colorBackground,
                meta: `${types.length || 1} col`,
            })),
        [groups]
    );
    const aircraftItems = useMemo<ColumnFilterItem<string>[]>(() => {
        const count = new Map<string, number>();
        groups.forEach((g) => g.types.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
        return Array.from(count.entries())
            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
            .map(([t, n]) => ({ key: t, label: t, meta: `${n} airline${n > 1 ? 's' : ''}` }));
    }, [groups]);
    /** Aircraft filter hides type sub-columns; airlines left without a visible type are hidden too. */
    const visibleGroups = groups
        .filter((g) => !hiddenAirlines.has(g.airline.airlineId))
        .map((g) => ({ ...g, types: g.types.filter((t) => !hiddenTypes.has(t)) }))
        .filter((g) => hiddenTypes.size === 0 || g.types.length > 0);
    const authColumnCount = visibleGroups.reduce((n, g) => n + Math.max(g.types.length, 1), 0);
    /** Airline row + aircraft type / status row whenever there are airline columns. */
    const headerRows = authColumnCount > 0 ? 2 : 1;

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return staff
            .filter((s) =>
                !stationCode
                    ? true
                    : stationCode === UNASSIGNED
                      ? !s.stationCode
                      : s.stationCode === stationCode || s.transfers.some((t) => t.stationCode === stationCode)
            )
            .filter((s) => !movement || movementStatus(s) === movement)
            .filter(
                (s) =>
                    !q ||
                    s.name.toLowerCase().includes(q) ||
                    s.employeeId.toLowerCase().includes(q) ||
                    (s.sams?.authNo ?? '').toLowerCase().includes(q)
            )
            .sort((a, b) => a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true }));
    }, [staff, search, stationCode, movement]);

    const certifying = staff.filter(isValidCertifyingStaff);
    const moving = certifying.filter((s) => movementStatus(s) !== 'Permanent').length;
    const unassigned = certifying.filter((s) => !s.stationCode).length;

    const isFiltering = search !== '' || stationCode !== '' || movement !== '' || hiddenAirlines.size > 0 || hiddenTypes.size > 0;
    const clearFilters = () => {
        setSearch('');
        setStationCode('');
        setMovement('');
        setHiddenAirlines(new Set());
        setHiddenTypes(new Set());
    };

    const stickyName = 'sticky left-0 z-20';
    const stickyLicence = 'sticky z-20';

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<UserCheck className="h-5 w-5" />}
                    title="Certifying Staff"
                    subtitle="Aircraft licences and customer authorizations per person"
                >
                    {SHOW_MOCK_TOGGLE && (
                        <button
                            type="button"
                            onClick={() => setUseMock((v) => !v)}
                            aria-pressed={useMock}
                            className={cn(
                                'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-all',
                                useMock
                                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                            )}
                            title="Development only: show sample data"
                        >
                            <FlaskConical className="h-3.5 w-3.5" />
                            Mock data {useMock ? 'ON' : 'OFF'}
                        </button>
                    )}
                </RosterHeader>
                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
                    <StatTile label="Valid CS" value={certifying.length} unit="people" />
                    <StatTile label="Licence holders" value={staff.length} unit="people" />
                    <StatTile label="Rotate / Transfer" value={moving} tone={moving > 0 ? 'warning' : 'default'} />
                    <StatTile label="No station" value={unassigned} tone={unassigned > 0 ? 'danger' : 'success'} />
                </div>
            </Card>

            <Card className="overflow-hidden">
                {/* ── Filter bar ── */}
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                    <div className="relative min-w-[200px] max-w-[300px] flex-1">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search staff name, ID or auth no..."
                            className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-[#075CA2]/40 focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                        />
                    </div>
                    <StationSelect
                        stations={stations}
                        value={stationCode}
                        onChange={setStationCode}
                        allowAll
                        extraOptions={[{ value: UNASSIGNED, label: 'No station' }]}
                    />
                    <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <select
                            value={movement}
                            onChange={(e) => setMovement(e.target.value as '' | MovementStatus)}
                            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                        >
                            <option value="">All</option>
                            <option value="Permanent">Permanent</option>
                            <option value="Rotate">Rotate</option>
                            <option value="Transfer">Transfer</option>
                        </select>
                    </label>
                    <ColumnFilter
                        label="Airlines"
                        title="Show airline columns"
                        items={airlineItems}
                        hidden={hiddenAirlines}
                        onChange={setHiddenAirlines}
                        emptyText="No airlines from the API."
                    />
                    <ColumnFilter
                        label="Aircraft"
                        title="Show aircraft columns"
                        items={aircraftItems}
                        hidden={hiddenTypes}
                        onChange={setHiddenTypes}
                        emptyText="No aircraft types."
                    />
                    {isFiltering && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-100"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </button>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                        {rows.length} of {staff.length} staff · {visibleGroups.length} of {groups.length} airlines
                    </span>
                </div>

                {isLoading ? (
                    <LoadingBlock label="Loading staff and authorizations..." />
                ) : error ? (
                    <EmptyBlock>Failed to load staff: {(error as Error).message}</EmptyBlock>
                ) : rows.length === 0 ? (
                    <EmptyBlock>No staff match these filters.</EmptyBlock>
                ) : (
                    <div className="max-h-[calc(100vh-260px)] overflow-auto">
                        <table className="w-full border-separate border-spacing-0 text-xs">
                            <thead className="sticky top-0 z-30">
                                {/* Row 1: fixed columns + airline groups (navy) */}
                                <tr>
                                    <th
                                        rowSpan={headerRows}
                                        className={cn(stickyName, 'z-40 border-b-2 border-r border-border bg-slate-50 px-3 py-2 text-left text-[13px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300')}
                                        style={{ minWidth: NAME_COL_WIDTH, width: NAME_COL_WIDTH }}
                                    >
                                        Employee Name
                                    </th>
                                    <th
                                        rowSpan={headerRows}
                                        className={cn(stickyLicence, 'z-40 border-b-2 border-r border-border bg-slate-50 px-3 py-2 text-left text-[13px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300')}
                                        style={{ left: NAME_COL_WIDTH, minWidth: LICENCE_COL_WIDTH, width: LICENCE_COL_WIDTH }}
                                    >
                                        Aircraft Licence
                                    </th>
                                    {authColumnCount > 0 ? (
                                        visibleGroups.map(({ airline, types }) => (
                                            <th
                                                key={airline.airlineId}
                                                colSpan={Math.max(types.length, 1)}
                                                className="whitespace-nowrap border-l border-white/20 p-0 text-center text-[11px] font-bold uppercase tracking-wider text-white"
                                                style={{ background: HEADER_NAVY }}
                                            >
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="block cursor-help px-2 py-2">{airline.code}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-slate-900 text-xs font-semibold text-white">
                                                            {airlineLabel(airline)}
                                                            <TooltipArrow className="fill-slate-900" />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                        ))
                                    ) : (
                                        <th
                                            rowSpan={headerRows}
                                            className="border-b-2 border-border bg-slate-50 px-3 py-2 text-left text-[11px] font-medium text-muted-foreground dark:bg-slate-800"
                                        >
                                            No airline columns selected
                                        </th>
                                    )}
                                </tr>
                                {/* Row 2: aircraft types (or a single Status column) */}
                                {authColumnCount > 0 && (
                                    <tr>
                                        {visibleGroups.flatMap(({ airline, types }) => {
                                            const color = readableColor(airline.colorBackground, airline.colorForeground);
                                            const cols = types.length ? types : [null];
                                            return cols.map((t, i) => (
                                                <th
                                                    key={`${airline.airlineId}-${t ?? 'status'}`}
                                                    className={cn(
                                                        'whitespace-nowrap border-b-2 border-l bg-white px-2 py-1.5 text-center dark:bg-slate-900',
                                                        i === 0 ? 'border-l-border' : 'border-l-border/50'
                                                    )}
                                                    style={{ minWidth: 76 }}
                                                >
                                                    {t ? (
                                                        <div className="text-[11px] font-bold leading-snug" style={{ color }}>
                                                            {t}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] font-bold leading-snug text-muted-foreground">-</div>
                                                    )}
                                                </th>
                                            ));
                                        })}
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {rows.map((s, ri) => {
                                    const status = movementStatus(s);
                                    const cellsByAirline = matrix.cells.get(s.staffId);
                                    const labels = licenceLabels(s);
                                    const rowBg = ri % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-slate-50 dark:bg-slate-900';
                                    return (
                                        <tr key={s.staffId} className="group">
                                            <td
                                                className={cn(stickyName, rowBg, 'z-10 border-b border-r border-border px-3 py-1.5 align-middle group-hover:bg-slate-100 dark:group-hover:bg-slate-800')}
                                                style={{ minWidth: NAME_COL_WIDTH, width: NAME_COL_WIDTH }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-500">
                                                        <User className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold leading-tight text-foreground" title={s.name}>
                                                            {s.name}
                                                        </p>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                                                            <span className="font-mono font-bold">{s.employeeId}</span>
                                                            {s.stationCode ? (
                                                                <span className="rounded bg-slate-200/70 px-1 font-mono font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                                                                    {s.stationCode}
                                                                </span>
                                                            ) : (
                                                                <Pill tone="danger">No station</Pill>
                                                            )}
                                                            {status !== 'Permanent' && <Pill tone={MOVEMENT_TONE[status]}>{status}</Pill>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className={cn(stickyLicence, rowBg, 'z-10 border-b border-r border-border px-3 py-1.5 align-middle group-hover:bg-slate-100 dark:group-hover:bg-slate-800')}
                                                style={{ left: NAME_COL_WIDTH, minWidth: LICENCE_COL_WIDTH, width: LICENCE_COL_WIDTH }}
                                            >
                                                <LicenceCell labels={labels} />
                                            </td>
                                            {authColumnCount === 0 ? (
                                                <td className={cn(rowBg, 'border-b border-border')} />
                                            ) : (
                                                visibleGroups.flatMap(({ airline, types }) => {
                                                    const cell = cellsByAirline?.get(airline.airlineId);
                                                    const cols = types.length ? types : [null];
                                                    return cols.map((t, i) => (
                                                        <AuthCell
                                                            key={`${airline.airlineId}-${t ?? 'all'}`}
                                                            cell={cell}
                                                            airline={airline}
                                                            type={t}
                                                            groupStart={i === 0}
                                                        />
                                                    ));
                                                })
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Legend */}
                {!isLoading && !error && rows.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
                        {(['true', 'false', 'pending'] as CrsCellStatus[]).map((st) => (
                            <span key={st} className="flex items-center gap-1.5">
                                <StatusDot status={st} /> {CRS_STATUS_META[st].label}
                            </span>
                        ))}
                        <span className="flex items-center gap-1.5">
                            <span className="font-bold">-</span> No authorization
                        </span>
                        {useMock && <span className="ml-auto font-semibold text-amber-600">Showing mock data</span>}
                    </div>
                )}
            </Card>
        </div>
    );
}
