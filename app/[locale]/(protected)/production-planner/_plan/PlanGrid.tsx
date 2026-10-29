'use client';

import { Fragment, useState, type CSSProperties } from 'react';
import { Check, ChevronDown, ChevronRight, Info, Layers, PenLine, Pencil, Plane, Plus, Trash2, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    MONTHS,
    SERIES_LABEL,
    STATIONS,
    TYPE_GROUPS,
    blanks,
    fmt,
    pct,
    sumOrNull,
    totalBoth,
    isPlaceholderLine,
    type GridLine,
    type LineInfo,
    type Mode,
    type MonthValues,
    type Series,
} from './data';

/** A row definition: a single series, or a variance between two. */
type RowDef = { kind: 'series'; s: Series } | { kind: 'var'; x: Series; y: Series };

export function rowDefs(sel: Record<Series, boolean>): RowDef[] {
    const out: RowDef[] = (['b', 'p', 'a'] as Series[]).filter((k) => sel[k]).map((s) => ({ kind: 'series', s }));
    if (sel.a && sel.b) out.push({ kind: 'var', x: 'a', y: 'b' });
    if (sel.a && sel.p) out.push({ kind: 'var', x: 'a', y: 'p' });
    if (sel.p && sel.b && !sel.a) out.push({ kind: 'var', x: 'p', y: 'b' });
    return out;
}

/** Collapse keys: station → `st`, airline → `st|al|airline`, type group → `st|al|airline|group`. */
export const airlineKey = (l: Pick<LineInfo, 'station' | 'al' | 'airline'>) => `${l.station}|${l.al}|${l.airline}`;
export const typeGroupKey = (l: Pick<LineInfo, 'station' | 'al' | 'airline'>, group: string) => `${airlineKey(l)}|${group}`;
/** Every collapse key on the path to a line — open them all to reveal it. */
export const pathKeys = (l: Pick<LineInfo, 'station' | 'al' | 'airline' | 'typeGroup'>) => [l.station, airlineKey(l), ...(l.typeGroup ? [typeGroupKey(l, l.typeGroup)] : [])];

const actionBtn = 'inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors';

const SERIES_COLOR: Record<Series, string> = {
    b: 'text-slate-600 dark:text-slate-300',
    p: 'text-blue-600 dark:text-blue-400',
    a: 'text-[hsl(206_92%_35%)] dark:text-sky-300',
};

type Tone = 'line' | 'group' | 'sub' | 'grand';

interface Totals {
    b: MonthValues;
    p: MonthValues;
    a: MonthValues;
}

/** Add two series for subtotals: blank ("—") cells are skipped; null only when both are blank. */
const addLoose = (a: MonthValues, b: MonthValues): MonthValues => a.map((x, i) => (x == null && b[i] == null ? null : (x ?? 0) + (b[i] ?? 0)));

function VarCell({ x, y, grand }: { x: number | null; y: number | null; grand?: boolean }) {
    if (x == null || y == null || y === 0) {
        return <div className={cn('px-2 py-1.5 text-right text-xs', grand ? 'text-white/60' : 'text-muted-foreground/70')}>—</div>;
    }
    const r = pct(x, y);
    const text = r > 0 ? `▲ ${r}%` : r < 0 ? `▼ ${Math.abs(r)}%` : '0%';
    return (
        <div
            className={cn(
                'px-2 py-1.5 text-right text-xs font-bold tabular-nums',
                grand
                    ? 'text-white'
                    : r > 0
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : r < 0
                        ? 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                        : ''
            )}
        >
            {text}
        </div>
    );
}

export interface PlanGridProps {
    mode: Mode;
    lines: GridLine[];
    sel: Record<Series, boolean>;
    stationFilter: string;
    collapsed: Record<string, boolean>;
    /** Toggle a station / airline / type group (see `airlineKey`, `typeGroupKey`). */
    onToggle: (key: string) => void;
    closed: number;
    /** Version is editable and no other row is being edited. */
    canEdit: boolean;
    /** The airline row currently being keyed in (one at a time). */
    editingLineId: string | null;
    /** The one series (Budget / Plan / Actual) open for key-in on that row. */
    editingSeries: Series | null;
    /** Key in one series of the row's monthly figures. */
    onStartEdit: (line: GridLine, s: Series) => void;
    /** Change the row's A/C type + Engine (combination picker). */
    onEditAircraft: (line: GridLine) => void;
    /** Airline header: add a type group (rows picked from combinations), or delete the airline. */
    onAddTypeGroup: (airline: GridLine, group: string) => void;
    onAddAirline: (station: string) => void;
    onDeleteStation: (station: string) => void;
    /** Open the Station editor (Airline / Type group / A/C type of that station). */
    onEditStation: (station: string) => void;
    onDeleteAirline: (airline: GridLine) => void;
    onDeleteTypeGroup: (airline: GridLine, group: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onCellChange: (lineId: string, s: Series, month: number, value: number) => void;
    /** Rename an airline (all its rows at the station); returns false when rejected so the editor stays open. */
    onRenameAirline: (line: GridLine, to: { al: string; airline: string }) => boolean;
    /** Revenue A/E: monthly THB/USD rate row. */
    fx?: { values: number[]; onChange: (month: number, value: number) => void };
    unit: string;
}

export function PlanGrid({
    mode,
    lines,
    sel,
    stationFilter,
    collapsed,
    onToggle,
    closed,
    canEdit,
    editingLineId,
    editingSeries,
    onStartEdit,
    onEditAircraft,
    onAddTypeGroup,
    onAddAirline,
    onDeleteStation,
    onEditStation,
    onDeleteAirline,
    onDeleteTypeGroup,
    onSaveEdit,
    onCancelEdit,
    onCellChange,
    onRenameAirline,
    fx,
    unit,
}: PlanGridProps) {
    const isRev = mode === 'rev';
    const defs = rowDefs(sel);
    // First 3 columns (Airline › Type group › A/C type tree, Engine, row label) stay fixed while scrolling months
    const fixed = isRev ? [260, 140, 136] : [260, 150, 124];
    const lefts = fixed.map((_, i) => fixed.slice(0, i).reduce((a, b) => a + b, 0));
    // Station / Airline / Type group headers span the fixed columns, so their actions end where the Budget ✐ button does
    const bandStyle: CSSProperties = { width: fixed.reduce((a, b) => a + b, 0) };
    const monthMin = isRev ? 76 : 56;
    const totalW = isRev ? 104 : 80;
    const cols = `${fixed.map((w) => `${w}px`).join(' ')} repeat(12, minmax(${monthMin}px, 1fr)) ${totalW}px`;
    // Must equal the sum of column minimums, or columns overflow past row backgrounds
    const minWidth = fixed.reduce((a, b) => a + b, 0) + 12 * monthMin + totalW;
    const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: cols };
    const stick = (i: number) => ({
        className: cn('sticky z-10 bg-inherit', i === fixed.length - 1 && 'border-r border-border'),
        style: { left: lefts[i] } as CSSProperties,
    });

    /** Rows whose long A/C type / Engine text is shown in full instead of "…". */
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const toggleExpanded = (id: string) =>
        setExpanded((s) => {
            const next = new Set(s);
            if (!next.delete(id)) next.add(id);
            return next;
        });

    /** Airline header being renamed in place (one at a time). */
    const [airlineEdit, setAirlineEdit] = useState<{ key: string; al: string; airline: string } | null>(null);
    // Row editing waits while an airline is being renamed
    const canEditRows = canEdit && !airlineEdit;

    const stations = STATIONS.filter((st) => (stationFilter === 'ALL' || st === stationFilter) && lines.some((l) => l.station === st));

    /** One block of Budget / Plan / Actual / Δ rows — an A/C type line (`line` given) or a total. */
    const renderGroup = (key: string, info: Partial<GridLine>, series: Totals, tone: Tone, line?: GridLine) => {
        const isEditingRow = !!line && line.id === editingLineId;
        const isExpanded = !!line && expanded.has(line.id);
        const fullText = isExpanded ? 'whitespace-normal break-words' : 'truncate';
        const rows = defs.map((d, k) => {
            const first = k === 0;
            const isVar = d.kind === 'var';
            const grand = tone === 'grand';
            return (
                <div
                    key={`${key}-${k}`}
                    style={gridStyle}
                    className={cn(
                        'text-[13px]',
                        first && (line ? 'border-t border-dashed border-border' : 'border-t border-border'),
                        tone === 'grand'
                            ? 'bg-[hsl(206_92%_35%)] font-bold text-white'
                            : tone === 'sub'
                              ? cn('font-bold', k % 2 ? 'bg-blue-100 dark:bg-slate-800' : 'bg-blue-50 dark:bg-slate-900')
                              : tone === 'group'
                                ? cn('font-semibold', k % 2 ? 'bg-sky-100/60 dark:bg-slate-800/70' : 'bg-sky-50/60 dark:bg-slate-900/70')
                              : isEditingRow
                                ? 'bg-amber-50 dark:bg-amber-950'
                                : // Alternate Budget / Plan / Actual / Δ rows within an airline
                                  k % 2
                                  ? 'bg-slate-100 dark:bg-slate-800'
                                  : 'bg-card'
                    )}
                >
                    <div
                        style={stick(0).style}
                        className={cn('flex items-start gap-1.5 py-1.5 pr-2', line ? (line.typeGroup ? 'pl-12' : 'pl-7') : 'pl-2', stick(0).className)}
                    >
                        {first &&
                            (line ? (
                                <>
                                    {canEditRows && (
                                        <button
                                            type="button"
                                            onClick={() => onEditAircraft(line)}
                                            className="-my-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-[hsl(206_92%_35%)]"
                                            aria-label={`Edit A/C type of ${line.airline} ${line.acType} (${line.station})`}
                                            title="Edit A/C type / Aircraft Engine"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <span className="min-w-0 flex-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(line.id)}
                                            aria-expanded={isExpanded}
                                            className={cn('block w-full text-left font-semibold hover:text-[hsl(206_92%_35%)]', fullText)}
                                            title={isExpanded ? 'Click to collapse' : `${line.acType} · click to show all`}
                                        >
                                            {line.acType}
                                        </button>
                                        {isRev && line.priceUsd != null && <span className="block text-[10px] font-normal text-muted-foreground">USD {line.priceUsd}/flt</span>}
                                    </span>
                                </>
                            ) : (
                                <span className="truncate font-bold">{info.airline}</span>
                            ))}
                    </div>
                    <div style={stick(1).style} className={cn('min-w-0 px-2 py-1.5', grand ? '' : 'text-muted-foreground', stick(1).className)}>
                        {first &&
                            (line ? (
                                <button
                                    type="button"
                                    onClick={() => toggleExpanded(line.id)}
                                    aria-expanded={isExpanded}
                                    className={cn('block w-full text-left hover:text-[hsl(206_92%_35%)]', fullText)}
                                    title={isExpanded ? 'Click to collapse' : `${line.engine} · click to show all`}
                                >
                                    {line.engine}
                                </button>
                            ) : (
                                <span className="block truncate">{info.engine}</span>
                            ))}
                    </div>
                    {isVar ? (
                        <>
                            <div style={stick(2).style} className={cn('px-2 py-1.5 text-xs font-bold', grand ? 'text-white' : 'text-slate-600 dark:text-slate-300', stick(2).className)}>
                                Δ {SERIES_LABEL[d.x]} vs {SERIES_LABEL[d.y]}
                            </div>
                            {series[d.x].map((x, i) => (
                                <VarCell key={i} x={x} y={series[d.y][i]} grand={grand} />
                            ))}
                            {(() => {
                                const [tx, ty] = totalBoth(series[d.x], series[d.y]);
                                return <VarCell x={tx} y={ty} grand={grand} />;
                            })()}
                        </>
                    ) : (
                        <>
                            <div style={stick(2).style} className={cn('flex items-start justify-between gap-1 px-2 py-1.5 text-xs font-bold', grand ? 'text-white' : SERIES_COLOR[d.s], stick(2).className)}>
                                <span>
                                    {SERIES_LABEL[d.s]}
                                    {d.s === 'a' && ' (YTD)'}
                                </span>
                                {line && canEditRows && line.editable[d.s] && (
                                    <button
                                        type="button"
                                        onClick={() => onStartEdit(line, d.s)}
                                        className="-my-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-[hsl(206_92%_35%)]"
                                        aria-label={`Edit ${SERIES_LABEL[d.s]} of ${line.airline} ${line.acType} (${line.station})`}
                                        title={`Key in monthly ${SERIES_LABEL[d.s]}`}
                                    >
                                        <PenLine className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            {series[d.s].map((v, i) => {
                                const editableCell = isEditingRow && d.s === editingSeries && line?.editable[d.s] && (d.s !== 'a' || i < closed);
                                if (line && editableCell) {
                                    return (
                                        <div key={i} className="p-0.5">
                                            <input
                                                type="number"
                                                min={0}
                                                value={v ?? ''}
                                                onChange={(e) => {
                                                    const n = Number(e.target.value);
                                                    if (Number.isFinite(n) && n >= 0) onCellChange(line.id, d.s, i, n);
                                                }}
                                                aria-label={`${line.airline} ${SERIES_LABEL[d.s]} ${MONTHS[i]}`}
                                                className="h-7 w-full rounded border border-amber-300 bg-background px-1.5 text-right text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-amber-700 dark:bg-amber-950/30"
                                            />
                                        </div>
                                    );
                                }
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'whitespace-nowrap px-2 py-1.5 text-right tabular-nums',
                                            isRev && 'text-xs',
                                            v == null && (grand ? 'text-white/60' : 'text-muted-foreground/60')
                                        )}
                                    >
                                        {fmt(v)}
                                    </div>
                                );
                            })}
                            <div className={cn('whitespace-nowrap px-2 py-1.5 text-right font-bold tabular-nums', isRev && 'text-xs')}>
                                {fmt(sumOrNull(series[d.s]))}
                            </div>
                        </>
                    )}
                </div>
            );
        });

        if (!isEditingRow || !line) return rows;

        return [
            ...rows,
            <div key={`${key}-actions`} className="border-b-2 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
                <div className="sticky left-0 flex w-fit flex-wrap items-center gap-2 px-2 py-1.5">
                    <span className="text-xs text-amber-900 dark:text-amber-200">
                        Editing <b>{line.airline}</b>
                        {line.typeGroup && ` › ${line.typeGroup}`} › <b>{line.acType}</b> ({line.station}) · key in <b>{editingSeries && SERIES_LABEL[editingSeries]}</b> in the cells
                    </span>
                    <button type="button" onClick={onCancelEdit} className={cn(actionBtn, 'border border-border bg-card text-foreground hover:bg-muted')}>
                        <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                    <button type="button" onClick={onSaveEdit} className={cn(actionBtn, 'bg-[hsl(206_92%_35%)] text-white hover:bg-[hsl(206_92%_29%)]')}>
                        <Check className="h-3.5 w-3.5" /> Save
                    </button>
                </div>
            </div>,
        ];
    };

    const groupRank = (l: GridLine) => {
        const i = l.typeGroup ? TYPE_GROUPS.indexOf(l.typeGroup) : -1;
        return i < 0 ? TYPE_GROUPS.length : i;
    };

    /** Station rows grouped by airline (first-seen order), then by type group (TYPE_GROUPS order; rows without one come first, directly under the airline). */
    const byAirline = (stLines: GridLine[]) => {
        const map = new Map<string, GridLine[]>();
        stLines.forEach((l) => {
            const k = airlineKey(l);
            map.set(k, [...(map.get(k) ?? []), l]);
        });
        return [...map.entries()].map(([key, ls]) => ({
            key,
            lines: ls,
            ungrouped: ls.filter((l) => groupRank(l) === TYPE_GROUPS.length && !isPlaceholderLine(l)),
            /** Only a placeholder row left — the airline has no type group yet. */
            empty: ls.every(isPlaceholderLine),
            groups: TYPE_GROUPS.map((name) => ({ name, lines: ls.filter((l) => l.typeGroup === name) })).filter((g) => g.lines.length > 0),
        }));
    };

    const totalsOf = (ls: GridLine[]): Totals =>
        ls.reduce<Totals>((t, l) => ({ b: addLoose(t.b, l.b), p: addLoose(t.p, l.p), a: addLoose(t.a, l.a) }), { b: blanks(), p: blanks(), a: blanks() });

    let gb: MonthValues = blanks();
    let gp: MonthValues = blanks();
    let ga: MonthValues = blanks();

    const body = stations.map((st) => {
        const stLines = lines.filter((l) => l.station === st);
        const { b: tb, p: tp, a: ta } = totalsOf(stLines);
        const airlines = byAirline(stLines);
        gb = addLoose(gb, tb);
        gp = addLoose(gp, tp);
        ga = addLoose(ga, ta);
        const [ya, yb] = totalBoth(ta, tb);
        const isClosed = !!collapsed[st];
        return (
            <Fragment key={st}>
                <div className="flex min-h-10 w-full items-center border-t-2 border-slate-300 bg-slate-200 py-2 text-[13px] dark:border-slate-700 dark:bg-slate-800">
                    <div style={bandStyle} className="sticky left-0 flex items-center gap-3 pl-2.5 pr-2">
                        <span className="flex min-w-0 flex-wrap items-center gap-3">
                            <button type="button" onClick={() => onToggle(st)} aria-expanded={!isClosed} className="flex flex-wrap items-center gap-3 text-left">
                                <b className="flex items-center gap-1 text-foreground">
                                    {isClosed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    {st} Station
                                </b>
                            </button>
                            {ya != null && yb != null && yb !== 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="button" className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`YTD summary of ${st}`}>
                                                <Info className="h-3.5 w-3.5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-xs">
                                            Actual YTD {fmt(ya)}
                                            {unit} vs Budget YTD {fmt(yb)}
                                            {unit} ({pct(ya, yb) >= 0 ? '▲' : '▼'} {Math.abs(pct(ya, yb))}%)
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {canEditRows && (
                                <button
                                    type="button"
                                    onClick={() => onEditStation(st)}
                                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-[hsl(206_92%_35%)]"
                                    aria-label={`Edit station ${st}`}
                                    title="Edit Station"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </span>
                        <span className="ml-auto flex shrink-0 items-center gap-2">
                            {canEditRows && (
                                <button
                                    type="button"
                                    onClick={() => onAddAirline(st)}
                                    className="inline-flex h-6 items-center gap-1 rounded border border-slate-300 bg-card px-1.5 text-[11px] font-semibold text-[hsl(206_92%_35%)] hover:bg-muted dark:border-slate-600 dark:text-sky-300"
                                    title={`Add Airline at ${st}`}
                                >
                                    <Plus className="h-3 w-3" /> Airline
                                </button>
                            )}
                            {canEditRows && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteStation(st)}
                                    className="rounded p-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                    aria-label={`Delete station ${st}`}
                                    title="Delete Station"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </span>
                    </div>
                </div>
                {!isClosed &&
                    airlines.map(({ key, lines: alLines, ungrouped, groups, empty }) => {
                        const acCount = alLines.filter((l) => !isPlaceholderLine(l)).length;
                        const head = alLines[0];
                        const alClosed = !!collapsed[key];
                        const isRenaming = airlineEdit?.key === key;
                        // Each type group once per airline
                        const freeGroups = TYPE_GROUPS.filter((g) => !groups.some((x) => x.name === g));
                        return (
                            <Fragment key={key}>
                                <div className={cn('flex items-center border-t border-border py-1.5 text-[13px]', isRenaming && 'px-2', isRenaming ? 'bg-amber-50 dark:bg-amber-950' : 'bg-slate-50 dark:bg-slate-900')}>
                                    {isRenaming ? (
                                        <form
                                            className="sticky left-2 flex w-fit flex-wrap items-center gap-2"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (onRenameAirline(head, { al: airlineEdit.al.trim().toUpperCase(), airline: airlineEdit.airline.trim() })) setAirlineEdit(null);
                                            }}
                                            onKeyDown={(e) => e.key === 'Escape' && setAirlineEdit(null)}
                                        >
                                            <Plane className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <input
                                                value={airlineEdit.al}
                                                onChange={(e) => setAirlineEdit({ ...airlineEdit, al: e.target.value })}
                                                maxLength={3}
                                                placeholder="AL"
                                                aria-label="AL"
                                                className="h-7 w-16 rounded border border-amber-300 bg-background px-1.5 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-amber-700"
                                            />
                                            <input
                                                value={airlineEdit.airline}
                                                onChange={(e) => setAirlineEdit({ ...airlineEdit, airline: e.target.value })}
                                                placeholder="Airline name"
                                                aria-label="Airline"
                                                autoFocus
                                                className="h-7 w-48 rounded border border-amber-300 bg-background px-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-amber-700"
                                            />
                                            <span className="text-xs text-amber-900 dark:text-amber-200">Applies to every row of this airline ({acCount} A/C type)</span>
                                            <button type="button" onClick={() => setAirlineEdit(null)} className={cn(actionBtn, 'border border-border bg-card text-foreground hover:bg-muted')}>
                                                <X className="h-3.5 w-3.5" /> Cancel
                                            </button>
                                            <button type="submit" className={cn(actionBtn, 'bg-[hsl(206_92%_35%)] text-white hover:bg-[hsl(206_92%_29%)]')}>
                                                <Check className="h-3.5 w-3.5" /> Save
                                            </button>
                                        </form>
                                    ) : (
                                        <div style={bandStyle} className="sticky left-0 flex items-center gap-2 px-2">
                                            <span className="flex min-w-0 flex-wrap items-center gap-2">
                                                <button type="button" onClick={() => onToggle(key)} aria-expanded={!alClosed} className="inline-flex items-center gap-2 rounded text-left hover:text-[hsl(206_92%_35%)]">
                                                    {alClosed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                                                    <Plane className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{head.al}</span>
                                                    <b className="text-foreground">{head.airline}</b>
                                                    <span className="text-xs text-muted-foreground">
                                                        {groups.length} Type group · {acCount} A/C type
                                                    </span>
                                                </button>
                                                {canEditRows && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAirlineEdit({ key, al: head.al, airline: head.airline })}
                                                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-[hsl(206_92%_35%)]"
                                                        aria-label={`Edit airline ${head.airline} (${head.station})`}
                                                        title="Edit Airline"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </span>
                                            <span className="ml-auto flex shrink-0 items-center gap-2">
                                                {canEditRows && (
                                                    <DropdownMenu modal={false}>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                disabled={!freeGroups.length}
                                                                className="inline-flex h-6 items-center gap-1 rounded border border-border bg-card px-1.5 text-[11px] font-semibold text-[hsl(206_92%_35%)] hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
                                                                title={freeGroups.length ? 'Add Type group' : 'All Type groups already added'}
                                                            >
                                                                <Plus className="h-3 w-3" /> Type group
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start">
                                                            {freeGroups.map((g) => (
                                                                <DropdownMenuItem key={g} onSelect={() => setTimeout(() => onAddTypeGroup(head, g))}>
                                                                    <Layers className="mr-2 h-3.5 w-3.5" /> {g}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                                {canEditRows && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteAirline(head)}
                                                        className="rounded p-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                                        aria-label={`Delete airline ${head.airline} (${head.station})`}
                                                        title="Delete Airline"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!alClosed && empty && (
                                    <div className="border-t border-border bg-card py-2 pl-7 pr-2 text-xs text-muted-foreground">
                                        <span className="sticky left-7">No Type group yet — click &quot;+ Type group&quot; to add one</span>
                                    </div>
                                )}
                                {!alClosed && ungrouped.map((l) => renderGroup(l.id, l, l, 'line', l))}
                                {!alClosed &&
                                    groups.map((g) => {
                                        const gKey = typeGroupKey(head, g.name);
                                        const gClosed = !!collapsed[gKey];
                                        return (
                                            <Fragment key={g.name}>
                                                <div className="flex items-center border-t border-border bg-card py-1 text-xs">
                                                    <div style={bandStyle} className="sticky left-0 flex items-center gap-1.5 pl-7 pr-2">
                                                        <span className="inline-flex min-w-0 items-center gap-1.5">
                                                            <button type="button" onClick={() => onToggle(gKey)} aria-expanded={!gClosed} className="inline-flex items-center gap-1.5 rounded text-left hover:opacity-80">
                                                                {gClosed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                                                                <Layers className="h-3.5 w-3.5 shrink-0 text-[hsl(206_92%_35%)] dark:text-sky-300" />
                                                                <b className="text-[hsl(206_92%_35%)] dark:text-sky-300">{g.name}</b>
                                                                <span className="text-muted-foreground">· {g.lines.length} A/C type</span>
                                                            </button>
                                                        </span>
                                                        <span className="ml-auto flex shrink-0 items-center">
                                                            {canEditRows && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onDeleteTypeGroup(head, g.name)}
                                                                    className="rounded p-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                                                    aria-label={`Delete type group ${g.name} of ${head.airline} (${head.station})`}
                                                                    title="Delete Type group"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!gClosed && g.lines.map((l) => renderGroup(l.id, l, l, 'line', l))}
                                            </Fragment>
                                        );
                                    })}
                                {/* Collapsed airline still shows its total, like a collapsed station */}
                                {!empty && (alClosed || acCount > 1) && renderGroup(`${key}-ttl`, { airline: `${head.airline} TTL` }, totalsOf(alLines), 'group')}
                            </Fragment>
                        );
                    })}
                {renderGroup(`${st}-ttl`, { airline: `${st} TTL` }, { b: tb, p: tp, a: ta }, 'sub')}
            </Fragment>
        );
    });

    return (
        <div className="overflow-x-auto">
            <div style={{ minWidth }}>
                <div style={gridStyle} className="bg-[hsl(206_92%_35%)] text-xs font-semibold text-white">
                    {['Airline › Type group › A/C type', 'Aircraft Engine', ''].map((h, i) => (
                        <div key={i} style={stick(i).style} className={cn('px-2 py-2', stick(i).className)}>
                            {h}
                        </div>
                    ))}
                    {MONTHS.map((m, i) => (
                        <div key={m} className="px-2 py-2 text-right" title={i < closed ? 'Month closed' : 'Month not closed yet — Actual hidden'}>
                            {m}
                        </div>
                    ))}
                    <div className="px-2 py-2 text-right">Total</div>
                </div>

                {fx && (
                    <div style={gridStyle} className="items-center border-b-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <div style={stick(0).style} className={cn('col-span-3 flex flex-col self-stretch justify-center border-r border-amber-200 px-2 py-1.5 text-xs font-bold text-amber-900 dark:border-amber-800 dark:text-amber-200', stick(0).className)}>
                            Currency rate (THB / USD)
                            <small className="font-normal text-amber-800/80 dark:text-amber-300/80">Editable · used to calculate that month's Plan and Actual</small>
                        </div>
                        {fx.values.map((v, i) => (
                            <div key={i} className="p-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    defaultValue={v}
                                    key={`${i}-${v}`}
                                    onBlur={(e) => {
                                        const n = parseFloat(e.target.value);
                                        if (!isNaN(n) && n > 0) fx.onChange(i, Math.round(n * 100) / 100);
                                        else e.target.value = String(v);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                    aria-label={`Currency rate ${MONTHS[i]}`}
                                    className="h-7 w-full rounded border border-amber-300 bg-background px-1.5 text-right text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-amber-700"
                                />
                            </div>
                        ))}
                        <div />
                    </div>
                )}

                {stations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No data in this category yet — click &quot;+ Station&quot; to add one, or use Create New Version / Import</div>
                ) : (
                    <>
                        {body}
                        {renderGroup('grand', { airline: 'All stations' }, { b: gb, p: gp, a: ga }, 'grand')}
                    </>
                )}
            </div>
        </div>
    );
}
