'use client';

import { Fragment, type CSSProperties } from 'react';
import { Check, ChevronDown, ChevronRight, Pencil, SquarePen, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    MONTHS,
    SERIES_LABEL,
    STATIONS,
    addSeries,
    fmt,
    pct,
    sum,
    totalBoth,
    zeros,
    type GridLine,
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

const SERIES_COLOR: Record<Series, string> = {
    b: 'text-slate-600 dark:text-slate-300',
    p: 'text-blue-600 dark:text-blue-400',
    a: 'text-[hsl(206_92%_35%)] dark:text-sky-300',
};

type Tone = 'line' | 'sub' | 'grand';

interface Totals {
    b: MonthValues;
    p: MonthValues;
    a: MonthValues;
}

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
    onToggleStation: (st: string) => void;
    closed: number;
    /** Version is editable and no other row is being edited. */
    canEdit: boolean;
    /** The airline row currently being keyed in (one at a time). */
    editingLineId: string | null;
    onStartEdit: (line: GridLine) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditInfo: (line: GridLine) => void;
    onDeleteLine: (line: GridLine) => void;
    onCellChange: (lineId: string, s: Series, month: number, value: number) => void;
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
    onToggleStation,
    closed,
    canEdit,
    editingLineId,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditInfo,
    onDeleteLine,
    onCellChange,
    fx,
    unit,
}: PlanGridProps) {
    const isRev = mode === 'rev';
    const defs = rowDefs(sel);
    // First 5 columns (AL, Airline, A/C type, Engine, row label) stay fixed while scrolling months
    const fixed = isRev ? [60, 92, 120, 140, 136] : [60, 92, 128, 150, 124];
    const lefts = fixed.map((_, i) => fixed.slice(0, i).reduce((a, b) => a + b, 0));
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

    const stations = STATIONS.filter((st) => (stationFilter === 'ALL' || st === stationFilter) && lines.some((l) => l.station === st));

    const renderGroup = (key: string, info: Partial<GridLine>, series: Totals, tone: Tone, line?: GridLine) => {
        const isEditingRow = !!line && line.id === editingLineId;
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
                        first && 'border-t border-border',
                        tone === 'grand'
                            ? 'bg-[hsl(206_92%_35%)] font-bold text-white'
                            : tone === 'sub'
                              ? cn('font-bold', k % 2 ? 'bg-blue-100 dark:bg-slate-800' : 'bg-blue-50 dark:bg-slate-900')
                              : isEditingRow
                                ? 'bg-amber-50 dark:bg-amber-950'
                                : // Alternate Budget / Plan / Actual / Δ rows within an airline
                                  k % 2
                                  ? 'bg-slate-100 dark:bg-slate-800'
                                  : 'bg-card'
                    )}
                >
                    <div style={stick(0).style} className={cn('flex items-start justify-between gap-1 px-2 py-1.5', grand ? '' : 'text-muted-foreground', stick(0).className)}>
                        {first && info.al}
                        {first && line && canEdit && (
                            <button
                                type="button"
                                onClick={() => onStartEdit(line)}
                                className="-my-0.5 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-[hsl(206_92%_35%)]"
                                aria-label={`Edit ${line.airline} (${line.station})`}
                                title="แก้ไขแถวนี้"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div style={stick(1).style} className={cn('px-2 py-1.5 font-semibold', stick(1).className)}>
                        {first && (
                            <span className="min-w-0">
                                {info.airline}
                                {isRev && line?.priceUsd != null && (
                                    <span className="block text-[10px] font-normal text-muted-foreground">USD {line.priceUsd}/flt</span>
                                )}
                            </span>
                        )}
                    </div>
                    <div style={stick(2).style} className={cn('truncate px-2 py-1.5', grand ? '' : 'text-muted-foreground', stick(2).className)} title={info.acType}>
                        {first && info.acType}
                    </div>
                    <div style={stick(3).style} className={cn('truncate px-2 py-1.5', grand ? '' : 'text-muted-foreground', stick(3).className)} title={info.engine}>
                        {first && info.engine}
                    </div>
                    {isVar ? (
                        <>
                            <div style={stick(4).style} className={cn('px-2 py-1.5 text-xs font-bold', grand ? 'text-white' : 'text-slate-600 dark:text-slate-300', stick(4).className)}>
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
                            <div style={stick(4).style} className={cn('px-2 py-1.5 text-xs font-bold', grand ? 'text-white' : SERIES_COLOR[d.s], stick(4).className)}>
                                {SERIES_LABEL[d.s]}
                                {d.s === 'a' && ' (YTD)'}
                            </div>
                            {series[d.s].map((v, i) => {
                                const editableCell = isEditingRow && line?.editable[d.s] && (d.s !== 'a' || i < closed);
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
                                {fmt(sum(series[d.s]))}
                            </div>
                        </>
                    )}
                </div>
            );
        });

        if (!isEditingRow || !line) return rows;

        const actionBtn = 'inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors';
        return [
            ...rows,
            <div key={`${key}-actions`} className="border-b-2 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
                <div className="sticky left-0 flex w-fit flex-wrap items-center gap-2 px-2 py-1.5">
                    <span className="text-xs text-amber-900 dark:text-amber-200">
                        กำลังแก้ไข <b>{line.airline}</b> ({line.station}) · กรอกตัวเลขในช่องได้เลย
                    </span>
                    <button type="button" onClick={() => onEditInfo(line)} className={cn(actionBtn, 'border border-border bg-card text-foreground hover:bg-muted')}>
                        <SquarePen className="h-3.5 w-3.5" /> แก้ไขรายละเอียด
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteLine(line)}
                        className={cn(actionBtn, 'border border-red-200 bg-card text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40')}
                    >
                        <Trash2 className="h-3.5 w-3.5" /> ลบแถว
                    </button>
                    <button type="button" onClick={onCancelEdit} className={cn(actionBtn, 'border border-border bg-card text-foreground hover:bg-muted')}>
                        <X className="h-3.5 w-3.5" /> ยกเลิก
                    </button>
                    <button type="button" onClick={onSaveEdit} className={cn(actionBtn, 'bg-[hsl(206_92%_35%)] text-white hover:bg-[hsl(206_92%_29%)]')}>
                        <Check className="h-3.5 w-3.5" /> บันทึก
                    </button>
                </div>
            </div>,
        ];
    };

    let gb: MonthValues = zeros();
    let gp: MonthValues = zeros();
    let ga: MonthValues = zeros();

    const body = stations.map((st) => {
        const stLines = lines.filter((l) => l.station === st);
        let tb: MonthValues = zeros();
        let tp: MonthValues = zeros();
        let ta: MonthValues = zeros();
        stLines.forEach((l) => {
            tb = addSeries(tb, l.b);
            tp = addSeries(tp, l.p);
            ta = addSeries(ta, l.a);
        });
        gb = addSeries(gb, tb);
        gp = addSeries(gp, tp);
        ga = addSeries(ga, ta);
        const [ya, yb] = totalBoth(ta, tb);
        const isClosed = !!collapsed[st];
        return (
            <Fragment key={st}>
                <button
                    type="button"
                    onClick={() => onToggleStation(st)}
                    aria-expanded={!isClosed}
                    className="flex min-h-10 w-full items-center border-t-2 border-slate-300 bg-slate-200 px-2.5 py-2 text-left text-[13px] dark:border-slate-700 dark:bg-slate-800"
                >
                    <span className="sticky left-2.5 flex flex-wrap items-center gap-3">
                        <b className="flex items-center gap-1 text-foreground">
                            {isClosed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {st} Station
                        </b>
                        {ya != null && yb != null && yb !== 0 && (
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                Actual YTD {fmt(ya)}
                                {unit} vs Budget YTD {fmt(yb)}
                                {unit} ({pct(ya, yb) >= 0 ? '▲' : '▼'} {Math.abs(pct(ya, yb))}%)
                            </span>
                        )}
                    </span>
                </button>
                {!isClosed && stLines.map((l) => renderGroup(l.id, l, l, 'line', l))}
                {renderGroup(`${st}-ttl`, { airline: `${st} TTL` }, { b: tb, p: tp, a: ta }, 'sub')}
            </Fragment>
        );
    });

    return (
        <div className="overflow-x-auto">
            <div style={{ minWidth }}>
                <div style={gridStyle} className="bg-[hsl(206_92%_35%)] text-xs font-semibold text-white">
                    {['AL', 'Airline', 'A/C type', 'Aircraft Engine', ''].map((h, i) => (
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
                        <div style={stick(0).style} className={cn('col-span-5 flex flex-col self-stretch justify-center border-r border-amber-200 px-2 py-1.5 text-xs font-bold text-amber-900 dark:border-amber-800 dark:text-amber-200', stick(0).className)}>
                            Currency rate (THB / USD)
                            <small className="font-normal text-amber-800/80 dark:text-amber-300/80">แก้ไขได้ · ใช้คำนวณ Plan และ Actual ของเดือนนั้น</small>
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
                    <div className="p-8 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูลในหมวดนี้ — กด &quot;+ เพิ่มแถว&quot; เพื่อกรอกเอง หรือ Import</div>
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
