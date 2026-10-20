'use client';

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Download, FileSpreadsheet, History, Lock, MoreHorizontal, Plus, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RootState } from '@/store/rootReducer';
import {
    CATEGORIES,
    EDITABLE_VERSION_COUNT,
    MONTHS,
    SERIES,
    SERIES_LABEL,
    SOURCE_REF,
    STATIONS,
    THF_RULES,
    YEARS,
    buildGridLines,
    closedMonths,
    isProdCat,
    nowLabel,
    removeLine,
    setSnapshotValue,
    simulateOagPlan,
    sum,
    upsertLine,
    type CatCode,
    type GridLine,
    type Mode,
    type PlanVersion,
    type Series,
    type Snapshot,
} from './data';
import { isVersionEditable, updatePlanStore, usePlanStore } from './store';
import { PlanGrid, rowDefs } from './PlanGrid';
import { HistoryDialog, ImportDialog, LineDialog, btnOutline, btnPrimary, type ImportKind, type LineDraft } from './dialogs';

const SERIES_CHIP: Record<Series, string> = { b: '#5b6778', p: '#1f5fbf', a: 'hsl(206, 92%, 35%)' };

const selectCls = 'h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export function PlanWorkspace({ mode }: { mode: Mode }) {
    const isRev = mode === 'rev';
    const store = usePlanStore();
    const userName = useSelector((s: RootState) => s.auth.users?.fullName || s.auth.users?.username) || 'Unknown user';

    const [cat, setCat] = useState<CatCode>('A');
    const [year, setYear] = useState(YEARS[0]);
    const [station, setStation] = useState('ALL');
    const [airline, setAirline] = useState('ALL');
    const [versionId, setVersionId] = useState<string | null>(null);
    const [sel, setSel] = useState<Record<Series, boolean>>({ b: true, p: false, a: true });
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    /** One airline row is edited at a time; edits are kept on a copy until saved. */
    const [edit, setEdit] = useState<{ lineId: string; snapshot: Snapshot } | null>(null);
    const [lineDialog, setLineDialog] = useState<{ open: boolean; initial: LineDraft | null }>({ open: false, initial: null });
    const [importOpen, setImportOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const yearVersions = store.versions.filter((v) => v.year === year);
    const version: PlanVersion | undefined = yearVersions.find((v) => v.id === versionId) ?? yearVersions[0];
    const editable = !!version && isVersionEditable(store.versions, version.id);
    const editing = edit !== null;
    const snap = edit?.snapshot ?? version?.snapshot;
    const closed = closedMonths(year);
    const fx = store.fx[year] ?? store.fx[YEARS[0]];
    const hasFx = isRev && isProdCat(cat);
    const unit = isRev ? ' THB' : '';

    const lines = useMemo(() => (snap ? buildGridLines(mode, cat, snap, fx, closed) : []), [mode, cat, snap, fx, closed]);

    // Airline filter — options follow the selected category and station
    const airlineOptions = useMemo(
        () => Array.from(new Set(lines.filter((l) => station === 'ALL' || l.station === station).map((l) => l.airline))).sort((a, b) => a.localeCompare(b)),
        [lines, station]
    );
    const airlineFilter = airlineOptions.includes(airline) ? airline : 'ALL';
    const visibleLines = useMemo(() => (airlineFilter === 'ALL' ? lines : lines.filter((l) => l.airline === airlineFilter)), [lines, airlineFilter]);

    const changeYear = (y: number) => {
        if (editing) return;
        setYear(y);
        setVersionId(null);
    };

    // ── Row edit (by airline record) ──
    /** Persist a snapshot into the selected version and log who edited it. */
    const commit = (next: Snapshot) => {
        if (!version) return;
        const editedAt = nowLabel();
        updatePlanStore((s) => ({
            ...s,
            versions: s.versions.map((v) => (v.id === version.id ? { ...v, snapshot: next, editedBy: userName, editedAt } : v)),
        }));
    };

    const startRowEdit = (line: GridLine) => version && setEdit({ lineId: line.id, snapshot: version.snapshot });
    const cancelRowEdit = () => setEdit(null);
    const saveRowEdit = () => {
        if (!edit) return;
        const line = lines.find((l) => l.id === edit.lineId);
        commit(edit.snapshot);
        setEdit(null);
        toast.success(`Saved ${line ? `${line.airline} (${line.station})` : 'row'} to version ${version?.label}`);
    };

    const onCellChange = (lineId: string, s: Series, month: number, value: number) =>
        setEdit((e) => (e && e.lineId === lineId ? { ...e, snapshot: setSnapshotValue(e.snapshot, mode, cat, lineId, s, month, value) } : e));

    const onSaveLine = (line: LineDraft) => {
        setLineDialog({ open: false, initial: null });
        if (line.id) {
            // Editing details of the row being edited — applied on Save
            setEdit((e) => (e ? { ...e, snapshot: upsertLine(e.snapshot, cat, line) } : e));
            return;
        }
        if (!version) return;
        // New row: save it, then open it for keying in monthly figures
        const id = `${cat}-${line.station}-${Date.now()}`;
        const next = upsertLine(version.snapshot, cat, { ...line, id });
        commit(next);
        setEdit({ lineId: id, snapshot: next });
        setCollapsed((c) => ({ ...c, [line.station]: false }));
        if (station !== 'ALL' && station !== line.station) setStation(line.station);
        toast.success(`Added ${line.airline} (${line.station}) — enter the monthly figures, then Save`);
    };

    const onDeleteLine = (line: GridLine) => {
        if (!version) return;
        if (!window.confirm(`Delete row "${line.airline}" (${line.station})? This cannot be undone.`)) return;
        commit(removeLine(version.snapshot, cat, line.id));
        setEdit(null);
        toast.success(`Deleted ${line.airline} (${line.station})`);
    };

    // ── Currency rate ──
    const onFxChange = (month: number, value: number) =>
        updatePlanStore((s) => ({ ...s, fx: { ...s.fx, [year]: (s.fx[year] ?? fx).map((v, i) => (i === month ? value : v)) } }));

    // ── Import ──
    const onImport = (kind: ImportKind, fileName: string) => {
        const label = nowLabel();
        if (kind === 'plan') {
            const base = yearVersions[0]?.snapshot ?? store.versions[0].snapshot;
            const created: PlanVersion = {
                id: `v${Date.now()}`,
                year,
                label,
                source: 'Import OAG',
                createdBy: userName,
                editedBy: null,
                editedAt: null,
                snapshot: simulateOagPlan(base, store.versions.length),
            };
            const minYear = new Date().getFullYear() - 2;
            updatePlanStore((s) => ({ ...s, versions: [created, ...s.versions].filter((v) => v.year >= minYear) }));
            setVersionId(created.id);
            toast.success(`Plan imported from ${fileName} — created version ${label}`);
        } else {
            const target = editable && version ? version : store.versions[0];
            updatePlanStore((s) => ({
                ...s,
                budgetImportedAt: kind === 'budget' ? label : s.budgetImportedAt,
                versions: s.versions.map((v) => (v.id === target.id ? { ...v, editedBy: userName, editedAt: label } : v)),
            }));
            toast.success(`${kind === 'budget' ? 'Budget' : 'Category B/C/D data'} imported from ${fileName} into version ${target.label}`);
        }
        setImportOpen(false);
    };

    // ── Export (Excel) ──
    const exportXlsx = async () => {
        const XLSX = await import('xlsx');
        const title = isRev ? 'Revenue Plan' : 'Production Plan';
        const aoa: (string | number | null)[][] = [
            [`${title} — Category ${cat} (${CATEGORIES.find((c) => c.code === cat)?.name})`],
            ['Year', year, 'Version', version?.label ?? '', 'Station', station === 'ALL' ? 'All' : station, 'Airline', airlineFilter === 'ALL' ? 'All' : airlineFilter],
            ['Exported', nowLabel()],
            [],
            ['Station', 'AL', 'Airline', 'A/C type', 'Aircraft Engine', 'Series', ...MONTHS, 'Total'],
        ];
        if (hasFx) aoa.push(['', '', 'Currency rate (THB/USD)', '', '', '', ...fx, null]);
        const defs = rowDefs(sel).filter((d) => d.kind === 'series');
        visibleLines
            .filter((l) => station === 'ALL' || l.station === station)
            .forEach((l) =>
                defs.forEach((d) => {
                    if (d.kind !== 'series') return;
                    aoa.push([l.station, l.al, l.airline, l.acType, l.engine, SERIES_LABEL[d.s], ...l[d.s], sum(l[d.s])]);
                })
            );
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        XLSX.writeFile(wb, `${title.replace(/ /g, '_')}_Cat${cat}_${year}.xlsx`);
        toast.success('Excel file downloaded');
    };

    // ── Blank import template (Budget / Plan) ──
    const downloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const header = ['Station', 'AL', 'Airline', 'A/C type', 'Aircraft Engine', 'Series (Budget / Plan)', ...MONTHS];
        const sample = ['BKK', 'XX', 'Airline 1', 'B737-800', 'NG CFM56', 'Budget', ...MONTHS.map(() => 0)];
        const ws = XLSX.utils.aoa_to_sheet([header, sample]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `${isRev ? 'Revenue' : 'Production'}_Plan_Template_Cat${cat}_${year}.xlsx`);
        toast.success('Template downloaded');
    };

    const toggleSeries = (k: Series) => {
        const count = SERIES.filter((x) => sel[x]).length;
        if (sel[k] && count === 1) return; // keep at least one series visible
        setSel((s) => ({ ...s, [k]: !s[k] }));
    };

    const selectedCount = SERIES.filter((k) => sel[k]).length;
    const title = isRev ? 'Revenue Plan' : 'Production Plan';
    const unitText = isRev
        ? isProdCat(cat)
            ? 'หน่วย: บาท (THB) · Plan = จำนวน Flight × Initial Price (USD) × อัตราแลกเปลี่ยนรายเดือน'
            : 'หน่วย: บาท (THB) · Import / Key in ทั้ง Budget, Plan และ Actual'
        : 'หน่วย: unit (จำนวน flight) · นับจาก Airline + Station + Aircraft';

    return (
        <div className="space-y-4">
            {/* ── Title + category ── */}
            <Card className="p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{unitText}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Budget import {store.budgetImportedAt} · Plan {version?.label ?? '—'} · Actual sync {store.actualSyncedAt}
                            {version?.editedBy && (
                                <>
                                    {' '}
                                    · แก้ไขล่าสุดโดย <b className="text-foreground">{version.editedBy}</b> เมื่อ {version.editedAt}
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">เลือก Category</span>
                        <div className="flex overflow-hidden rounded-md border border-border bg-card">
                            {CATEGORIES.map((c, i) => {
                                const off = !isRev && !isProdCat(c.code);
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        disabled={off || editing}
                                        aria-pressed={cat === c.code}
                                        onClick={() => setCat(c.code)}
                                        title={`${c.code} — ${c.name}${off ? ' (ไม่มี Production Plan)' : ''}`}
                                        className={cn(
                                            'h-8 min-w-8 px-2.5 text-xs font-bold transition-colors',
                                            i > 0 && 'border-l border-border',
                                            cat === c.code ? 'bg-[hsl(206_92%_35%)] text-white' : 'text-[hsl(206_92%_35%)] dark:text-sky-300',
                                            off && 'cursor-not-allowed bg-muted text-muted-foreground/60 dark:text-muted-foreground/60',
                                            editing && !off && cat !== c.code && 'cursor-not-allowed opacity-60'
                                        )}
                                    >
                                        {c.code}
                                    </button>
                                );
                            })}
                        </div>
                        <span className="text-[11px] font-medium text-foreground">{CATEGORIES.find((c) => c.code === cat)?.name}</span>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Year
                        <select value={year} onChange={(e) => changeYear(Number(e.target.value))} disabled={editing} className={selectCls}>
                            {YEARS.map((y) => (
                                <option key={y}>{y}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Station
                        <select value={station} onChange={(e) => setStation(e.target.value)} className={selectCls}>
                            <option value="ALL">All</option>
                            {STATIONS.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Airline
                        <select value={airlineFilter} onChange={(e) => setAirline(e.target.value)} className={cn(selectCls, 'max-w-48')}>
                            <option value="ALL">All</option>
                            {airlineOptions.map((a) => (
                                <option key={a}>{a}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Plan version
                        <select value={version?.id ?? ''} onChange={(e) => setVersionId(e.target.value)} disabled={editing} className={selectCls}>
                            {yearVersions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.label}
                                    {v.id === store.versions[0].id ? ' (ล่าสุด)' : ''}
                                    {isVersionEditable(store.versions, v.id) ? '' : ' 🔒'}
                                </option>
                            ))}
                        </select>
                    </label>
                    {!editable && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Lock className="h-3 w-3" /> ดูอย่างเดียว (แก้ไขได้เฉพาะ {EDITABLE_VERSION_COUNT} version ล่าสุด)
                        </span>
                    )}

                    <div className="flex-1" />

                    <button type="button" className={btnPrimary} onClick={() => setImportOpen(true)} disabled={editing}>
                        <Upload className="h-4 w-4" /> Import
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className={btnOutline}>
                                <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-64">
                            <DropdownMenuItem onSelect={exportXlsx} className="flex-col items-start gap-0.5 py-2">
                                <span className="flex items-center gap-2 font-medium">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel (.xlsx)
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">ตามตัวกรองและค่าที่เลือกอยู่ แก้ต่อได้</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className={cn(btnOutline, 'w-9 px-0')} aria-label="ตัวเลือกเพิ่มเติม">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-64">
                            {/* Dialogs open after the menu closes, so Radix doesn't leave pointer-events locked */}
                            <DropdownMenuItem
                                disabled={!editable || editing}
                                onSelect={() => setTimeout(() => setLineDialog({ open: true, initial: null }))}
                                className="flex-col items-start gap-0.5 py-2"
                            >
                                <span className="flex items-center gap-2 font-medium">
                                    <Plus className="h-4 w-4" /> เพิ่มแถว
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">
                                    {editable ? 'เพิ่ม Airline ใหม่แล้วกรอกตัวเลขรายเดือน' : `แก้ไขได้เฉพาะ ${EDITABLE_VERSION_COUNT} version ล่าสุด`}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={downloadTemplate} className="flex-col items-start gap-0.5 py-2">
                                <span className="flex items-center gap-2 font-medium">
                                    <FileSpreadsheet className="h-4 w-4" /> ดาวน์โหลด Template
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">Budget และ Plan</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setTimeout(() => setHistoryOpen(true))} className="flex-col items-start gap-0.5 py-2">
                                <span className="flex items-center gap-2 font-medium">
                                    <History className="h-4 w-4" /> ประวัติ Version
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">Import และ log การแก้ไขทุก version</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>

            {editing && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    แก้ไขทีละแถว (Airline) ใน version <b>{version?.label}</b>
                    {isRev && isProdCat(cat) && ' · Plan / Actual คำนวณอัตโนมัติ — แก้จำนวน flight ที่หน้า Production Plan'}
                    {!isRev && ' · Actual มาจาก THF ที่ Done แล้ว แก้ไม่ได้'} · กด &quot;บันทึก&quot; ใต้แถวเพื่อบันทึก log ชื่อและวันที่แก้ไข
                </div>
            )}

            {/* ── Table ── */}
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                    <span className="text-sm text-muted-foreground">แสดง</span>
                    <div className="flex flex-wrap gap-2">
                        {SERIES.map((k) => {
                            const on = sel[k];
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggleSeries(k)}
                                    className="inline-flex h-9 items-center rounded-full border bg-card px-3.5 text-sm font-semibold"
                                    style={on ? { borderColor: SERIES_CHIP[k], color: SERIES_CHIP[k] } : { color: 'var(--muted-foreground, #5b6778)' }}
                                >
                                    <span
                                        className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded border-2 text-[11px] leading-none"
                                        style={on ? { background: SERIES_CHIP[k], borderColor: SERIES_CHIP[k], color: '#fff' } : { borderColor: SERIES_CHIP[k], color: 'transparent' }}
                                    >
                                        ✓
                                    </span>
                                    {SERIES_LABEL[k]}
                                </button>
                            );
                        })}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {selectedCount > 1 ? 'เลือกมากกว่า 1 ค่า → แสดงแถว Δ เปรียบเทียบ (▲ สูงกว่า · ▼ ต่ำกว่า)' : 'เลือกเพิ่มอีกค่าเพื่อดูแถวเปรียบเทียบ'}
                    </span>
                    <div className="flex-1" />
                    <TooltipProvider>
                        {[
                            { label: 'ขยายทั้งหมด', icon: ChevronsUpDown, onClick: () => setCollapsed({}) },
                            { label: 'ดูเฉพาะยอดรวมสถานี', icon: ChevronsDownUp, onClick: () => setCollapsed(Object.fromEntries(STATIONS.map((s) => [s, true]))) },
                        ].map(({ label, icon: Icon, onClick }) => (
                            <Tooltip key={label}>
                                <TooltipTrigger asChild>
                                    <button type="button" aria-label={label} className={cn(btnOutline, 'h-8 w-8 px-0')} onClick={onClick}>
                                        <Icon className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">{label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
                <PlanGrid
                    mode={mode}
                    lines={visibleLines}
                    sel={sel}
                    stationFilter={station}
                    collapsed={collapsed}
                    onToggleStation={(st) => setCollapsed((c) => ({ ...c, [st]: !c[st] }))}
                    closed={closed}
                    canEdit={editable && !editing}
                    editingLineId={edit?.lineId ?? null}
                    onStartEdit={startRowEdit}
                    onSaveEdit={saveRowEdit}
                    onCancelEdit={cancelRowEdit}
                    onEditInfo={(l) => setLineDialog({ open: true, initial: { id: l.id, station: l.station, al: l.al, airline: l.airline, acType: l.acType, engine: l.engine, priceUsd: l.priceUsd } })}
                    onDeleteLine={onDeleteLine}
                    onCellChange={onCellChange}
                    fx={hasFx ? { values: fx, onChange: onFxChange } : undefined}
                    unit={unit}
                />
            </Card>

            {/* ── Data reference ── */}
            <Card className="p-5">
                <h2 className="mb-3 text-sm font-bold text-foreground">
                    ที่มาของข้อมูล — Category {cat} ({CATEGORIES.find((c) => c.code === cat)?.name})
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {SERIES.map((k) => (
                        <div key={k} className="rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
                            <div className="text-xs font-bold" style={{ color: SERIES_CHIP[k] }}>
                                {SERIES_LABEL[k]}
                            </div>
                            <div className="mt-0.5 text-sm text-foreground">{SOURCE_REF[mode][cat][k]}</div>
                        </div>
                    ))}
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    <li>
                        ตัวเลข Actual ของแต่ละเดือนจะแสดงเมื่อสิ้นสุดเดือนนั้นๆ ({closed === 12 ? 'ครบทั้งปี' : closed === 0 ? 'ยังไม่มีเดือนที่ปิดแล้ว' : `ปิดแล้ว Jan–${MONTHS[closed - 1]}`})
                    </li>
                    <li>เก็บ version ย้อนหลัง 3 ปี · แก้ไขได้ {EDITABLE_VERSION_COUNT} version ล่าสุด · ทุกการแก้ไขบันทึกชื่อและวันที่แก้ไขล่าสุด</li>
                    {isRev && isProdCat(cat) && <li>Initial Service price = ราคา Minimum Rate ตาม Contract ของแต่ละประเภทการให้บริการ</li>}
                    {!isRev && <li>Plan จาก OAG: ระบบสรุปจำนวน flight รายเดือนจากไฟล์ที่ import แต่ละครั้ง โดยนับจาก Airline, Station และ Aircraft</li>}
                </ul>
                {isProdCat(cat) && (
                    <div className="mt-3 rounded-lg bg-blue-50/60 px-3.5 py-2.5 text-xs text-slate-700 dark:bg-blue-950/30 dark:text-slate-300">
                        {THF_RULES.filter((r) => r.cat === cat).map((r) => (
                            <div key={r.cat}>
                                <b>{r.title}</b>: {r.items.join(' · ')}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <LineDialog
                open={lineDialog.open}
                onOpenChange={(open) => setLineDialog((d) => ({ ...d, open }))}
                initial={lineDialog.initial}
                withPrice={isProdCat(cat)}
                defaultStation={station === 'ALL' ? STATIONS[0] : station}
                onSave={onSaveLine}
            />
            <ImportDialog open={importOpen} onOpenChange={setImportOpen} mode={mode} latestVersion={store.versions[0].label} onConfirm={onImport} />
            <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} versions={store.versions} />
        </div>
    );
}
