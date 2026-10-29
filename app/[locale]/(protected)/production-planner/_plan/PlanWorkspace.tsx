'use client';

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, CopyPlus, Download, FileSpreadsheet, History, Lock, MoreHorizontal, Plus, Upload } from 'lucide-react';
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
    fmt,
    closedMonths,
    isProdCat,
    nowLabel,
    appendLines,
    isPlaceholderLine,
    mergeAircraft,
    patchLineInfo,
    removeLines,
    renameAirline,
    applyStationStructure,
    stationStructure,
    setSnapshotValue,
    simulateOagPlan,
    snapshotFromStructure,
    sumOrNull,
    type CatCode,
    type GridLine,
    type Mode,
    type PlanVersion,
    type StationGroup,
    type VersionLogEntry,
    type Series,
    type Snapshot,
} from './data';
import { isVersionEditable, updatePlanStore, usePlanStore } from './store';
import { PlanGrid, airlineKey, pathKeys, rowDefs } from './PlanGrid';
import {
    CreateVersionDialog,
    HistoryDialog,
    ImportDialog,
    AircraftComboDialog,
    StationDialog,
    btnOutline,
    useConfirmDelete,
    btnPrimary,
    type AircraftPatch,
    type ImportKind,
    type NewVersionDraft,
} from './dialogs';

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
    const [edit, setEdit] = useState<{ lineId: string; series: Series; snapshot: Snapshot } | null>(null);
    /** Row whose A/C type + Engine is being changed. */
    const { confirmDelete, confirmDialog } = useConfirmDelete();
    const [aircraftLine, setAircraftLine] = useState<GridLine | null>(null);
    /** "+ Station": a station not in this category yet, opened with its first airline. */
    const [newStationOpen, setNewStationOpen] = useState(false);
    const newStationLine = useMemo(() => (newStationOpen ? { station: '', al: '', airline: '', acType: '', engine: '' } : null), [newStationOpen]);
    /** Station getting a new airline (AL, name, type group and rows keyed in the combination dialog). */
    const [newAirlineStation, setNewAirlineStation] = useState<string | null>(null);
    const newAirlineLine = useMemo(() => (newAirlineStation ? { station: newAirlineStation, al: '', airline: '', acType: '', engine: '' } : null), [newAirlineStation]);
    /** Airline getting a new type group (rows picked in the combination dialog). */
    const [newGroup, setNewGroup] = useState<{ line: GridLine; group: string } | null>(null);
    // Stable object: the dialog resets its selection whenever `line` changes
    const newGroupLine = useMemo(
        () => newGroup && { station: newGroup.line.station, al: newGroup.line.al, airline: newGroup.line.airline, typeGroup: newGroup.group, acType: '', engine: '' },
        [newGroup]
    );
    const [importOpen, setImportOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

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
    /** Persist a snapshot into the selected version and append the change to its log. */
    const commit = (next: Snapshot, entry: Pick<VersionLogEntry, 'action' | 'summary' | 'changes'>) => {
        if (!version) return;
        const editedAt = nowLabel();
        const logged: VersionLogEntry = { at: editedAt, by: userName, cat, ...entry };
        updatePlanStore((s) => ({
            ...s,
            versions: s.versions.map((v) => (v.id === version.id ? { ...v, snapshot: next, editedBy: userName, editedAt, log: [...v.log, logged] } : v)),
        }));
    };
    const where = (l: Pick<GridLine, 'station' | 'airline' | 'typeGroup' | 'acType'>) => `${l.airline}${l.typeGroup ? ` › ${l.typeGroup}` : ''} › ${l.acType} (${l.station})`;

    const startRowEdit = (line: GridLine, series: Series) => version && setEdit({ lineId: line.id, series, snapshot: version.snapshot });
    const cancelRowEdit = () => setEdit(null);
    const saveRowEdit = () => {
        if (!edit) return;
        const line = lines.find((l) => l.id === edit.lineId);
        // Month-by-month diff of the series that was keyed in
        const before = version && buildGridLines(mode, cat, version.snapshot, fx, closed).find((l) => l.id === edit.lineId);
        const changes = line && before ? MONTHS.flatMap((m, i) => (before[edit.series][i] !== line[edit.series][i] ? [`${m}: ${fmt(before[edit.series][i])} → ${fmt(line[edit.series][i])}`] : [])) : [];
        commit(edit.snapshot, {
            action: 'figures',
            summary: `Edited ${SERIES_LABEL[edit.series]} of ${line ? where(line) : 'row'}${changes.length ? '' : ' (no change)'}`,
            changes,
        });
        setEdit(null);
        toast.success(`Saved ${line ? `${line.airline} (${line.station})` : 'row'} to version ${version?.label}`);
    };

    const onCellChange = (lineId: string, s: Series, month: number, value: number) =>
        setEdit((e) => (e && e.lineId === lineId ? { ...e, snapshot: setSnapshotValue(e.snapshot, mode, cat, lineId, s, month, value) } : e));

    // ── Edit Station (modal): the station's rows rebuilt from its edited structure ──
    const [stationDialog, setStationDialog] = useState<StationGroup | null>(null);
    const onEditStation = (st: string) => setStationDialog(stationStructure(lines, st));

    const onSaveStation = (group: StationGroup): string | void => {
        if (!version || !stationDialog) return;
        const st = stationDialog.station;
        const outline = (g: StationGroup) => g.airlines.map((a) => `${a.airline} (${a.typeGroups.map((t) => t.name).join('/') || '—'})`).join(', ') || '—';
        const [before, after] = [outline(stationDialog), outline(group)];
        commit(applyStationStructure(version.snapshot, cat, st, group), {
            action: 'edit',
            summary: `Edited station ${st}`,
            changes: before === after ? [] : [`Before: ${before}`, `After: ${after}`],
        });
        setStationDialog(null);
        toast.success(`Saved station ${st}`);
    };

    const onRenameAirline = (line: GridLine, to: { al: string; airline: string }) => {
        if (!version) return false;
        if (!to.al || !to.airline) {
            toast.error('AL and airline name are required');
            return false;
        }
        if (to.al === line.al && to.airline === line.airline) return true;
        if (lines.some((l) => l.station === line.station && l.al === to.al && l.airline === to.airline)) {
            toast.error(`${to.airline} (${to.al}) already exists at ${line.station}`);
            return false;
        }
        commit(renameAirline(version.snapshot, cat, line.station, line, to), { action: 'edit', summary: `Renamed airline ${line.airline} (${line.al}) → ${to.airline} (${to.al}) at ${line.station}` });
        // Carry the collapse state of the airline and its type groups over to the new name
        const from = airlineKey(line);
        const next = airlineKey({ ...line, ...to });
        setCollapsed((c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k === from || k.startsWith(`${from}|`) ? next + k.slice(from.length) : k, v])));
        toast.success(`Updated airline ${line.airline} → ${to.airline} (${line.station})`);
        return true;
    };

    const onSaveAircraft = (picked: AircraftPatch[]) => {
        if (!version || !aircraftLine) return;
        const patch = mergeAircraft(picked);
        commit(patchLineInfo(version.snapshot, cat, aircraftLine.id, patch), {
            action: 'edit',
            summary: `Changed A/C type of ${where(aircraftLine)}`,
            changes: [`A/C type: ${aircraftLine.acType} → ${patch.acType}`, `Engine: ${aircraftLine.engine} → ${patch.engine}`],
        });
        setAircraftLine(null);
        toast.success(`Updated A/C type of ${aircraftLine.airline} (${aircraftLine.station}) to ${patch.acType}`);
    };

    const sameAirline = (a: Pick<GridLine, 'station' | 'al' | 'airline'>) => (l: Pick<GridLine, 'station' | 'al' | 'airline'>) =>
        l.station === a.station && l.al === a.al && l.airline === a.airline;

    const onSaveNewGroup = (picked: AircraftPatch[]) => {
        if (!version || !newGroup) return;
        const { line, group } = newGroup;
        const base = { station: line.station, al: line.al, airline: line.airline, typeGroup: group };
        // All picked combinations go into one row; the airline's placeholder row (if any) is no longer needed
        const cleared = removeLines(version.snapshot, cat, (l) => sameAirline(line)(l) && isPlaceholderLine(l));
        const merged = mergeAircraft(picked);
        commit(appendLines(cleared, cat, [{ ...base, ...merged }]), { action: 'add', summary: `Added type group ${group} to ${line.airline} (${line.station})`, changes: [`A/C type: ${merged.acType}`, `Engine: ${merged.engine}`] });
        setCollapsed((c) => ({ ...c, ...Object.fromEntries(pathKeys(base).map((k) => [k, false])) }));
        setNewGroup(null);
        toast.success(`Added type group ${group} to ${line.airline} (${line.station}) with ${picked.length} A/C type(s) — monthly figures are blank, ready to key in`);
    };

    const freeStations = STATIONS.filter((st) => !lines.some((l) => l.station === st));

    const onSaveNewStation = (picked: AircraftPatch[], info: { station: string; al: string; airline: string; typeGroup: string }) => {
        if (!version) return;
        // All picked combinations go into one row
        const merged = mergeAircraft(picked);
        commit(appendLines(version.snapshot, cat, [{ ...info, ...merged }]), {
            action: 'add',
            summary: `Added station ${info.station} with airline ${info.airline} (${info.al})`,
            changes: [`Type group: ${info.typeGroup}`, `A/C type: ${merged.acType}`, `Engine: ${merged.engine}`],
        });
        setCollapsed((c) => ({ ...c, ...Object.fromEntries(pathKeys(info).map((k) => [k, false])) }));
        if (station !== 'ALL' && station !== info.station) setStation(info.station);
        setNewStationOpen(false);
        toast.success(`Added station ${info.station} with airline ${info.airline} — monthly figures are blank, ready to key in`);
    };

    const onSaveNewAirline = (picked: AircraftPatch[], info: { al: string; airline: string; typeGroup: string }) => {
        if (!version || !newAirlineStation) return;
        const base = { ...info, station: newAirlineStation };
        if (lines.some(sameAirline(base))) return `${info.airline} (${info.al}) already exists at ${newAirlineStation}.`;
        // All picked combinations go into one row
        const merged = mergeAircraft(picked);
        commit(appendLines(version.snapshot, cat, [{ ...base, ...merged }]), {
            action: 'add',
            summary: `Added airline ${info.airline} (${info.al}) at ${newAirlineStation}`,
            changes: [`Type group: ${info.typeGroup}`, `A/C type: ${merged.acType}`, `Engine: ${merged.engine}`],
        });
        setCollapsed((c) => ({ ...c, ...Object.fromEntries(pathKeys(base).map((k) => [k, false])) }));
        setNewAirlineStation(null);
        toast.success(`Added airline ${info.airline} (${newAirlineStation}) with ${picked.length} A/C type(s) — monthly figures are blank, ready to key in`);
    };

    const onDeleteAirline = (line: GridLine) => {
        if (!version) return;
        const n = lines.filter(sameAirline(line)).length;
        confirmDelete({
            title: `Delete airline ${line.airline} (${line.station})?`,
            description: `All ${n} row(s) of this airline in Category ${cat}, including their monthly figures, will be deleted. This cannot be undone.`,
            onConfirm: () => {
                commit(removeLines(version.snapshot, cat, sameAirline(line)), { action: 'delete', summary: `Deleted airline ${line.airline} (${line.station}) — ${n} row(s)` });
                toast.success(`Deleted airline ${line.airline} (${line.station})`);
            },
        });
    };

    const onDeleteStation = (st: string) => {
        if (!version) return;
        const stLines = lines.filter((l) => l.station === st);
        const airlines = new Set(stLines.map((l) => `${l.al}|${l.airline}`)).size;
        confirmDelete({
            title: `Delete station ${st}?`,
            description: `All ${airlines} airline(s) and ${stLines.length} row(s) at ${st} in Category ${cat}, including their monthly figures, will be deleted. This cannot be undone.`,
            onConfirm: () => {
                commit(removeLines(version.snapshot, cat, (l) => l.station === st), { action: 'delete', summary: `Deleted station ${st} — ${airlines} airline(s), ${stLines.length} row(s)` });
                toast.success(`Deleted station ${st} from Category ${cat}`);
            },
        });
    };

    const onDeleteTypeGroup = (line: GridLine, group: string) => {
        if (!version) return;
        const inGroup = (l: Pick<GridLine, 'station' | 'al' | 'airline' | 'typeGroup'>) => sameAirline(line)(l) && l.typeGroup === group;
        const n = lines.filter(inGroup).length;
        confirmDelete({
            title: `Delete type group ${group}?`,
            description: `Only type group ${group} of ${line.airline} (${line.station}) is deleted — its ${n} A/C type row(s) and their monthly figures. The airline and its other type groups stay. This cannot be undone.`,
            onConfirm: () => {
                const next = removeLines(version.snapshot, cat, inGroup);
                // Last type group gone: keep the airline with an empty placeholder row so "+ Type group" is still reachable
                const left = lines.some((l) => sameAirline(line)(l) && !inGroup(l));
                commit(left ? next : appendLines(next, cat, [{ station: line.station, al: line.al, airline: line.airline, acType: '—', engine: '—' }]), {
                    action: 'delete',
                    summary: `Deleted type group ${group} of ${line.airline} (${line.station}) — ${n} row(s)`,
                });
                toast.success(`Deleted type group ${group} of ${line.airline} (${line.station})`);
            },
        });
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
                log: [{ at: label, by: userName, action: 'import', summary: `Version created from OAG import (${fileName})` }],
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
                versions: s.versions.map((v) =>
                    v.id === target.id
                        ? { ...v, editedBy: userName, editedAt: label, log: [...v.log, { at: label, by: userName, action: 'import' as const, summary: `Imported ${kind === 'budget' ? 'Budget' : 'Category B/C/D data'} from ${fileName}` }] }
                        : v
                ),
            }));
            toast.success(`${kind === 'budget' ? 'Budget' : 'Category B/C/D data'} imported from ${fileName} into version ${target.label}`);
        }
        setImportOpen(false);
    };

    // ── Create New Version: rows built from the Station → Airline → Type group → A/C type structure ──
    const onCreateVersion = (draft: NewVersionDraft) => {
        const created: PlanVersion = {
            id: `v${Date.now()}`,
            year: draft.year,
            label: draft.label,
            source: 'Key in',
            note: draft.note || undefined,
            createdBy: userName,
            editedBy: null,
            editedAt: null,
            snapshot: snapshotFromStructure(draft.structure, [draft.cat]),
            log: [
                {
                    at: draft.label,
                    by: userName,
                    action: 'create',
                    cat: draft.cat,
                    summary: `Version created by key in — ${draft.structure.length} station(s)`,
                    changes: draft.structure.map((g) => `${g.station}: ${g.airlines.map((a) => a.airline).join(', ') || '—'}`),
                },
            ],
        };
        const minYear = new Date().getFullYear() - 2;
        updatePlanStore((s) => ({ ...s, versions: [created, ...s.versions].filter((v) => v.year >= minYear) }));
        setYear(draft.year);
        setCat(draft.cat);
        setVersionId(created.id);
        setCollapsed({});
        setCreateOpen(false);
        toast.success(`Created version ${draft.label} (${draft.year}) in Category ${draft.cat} with ${draft.structure.length} station(s) — monthly figures are blank, ready to key in`);
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
                    aoa.push([l.station, l.al, l.airline, l.acType, l.engine, SERIES_LABEL[d.s], ...l[d.s], sumOrNull(l[d.s])]);
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
            ? 'Unit: Baht (THB) · Plan = Flights × Initial Price (USD) × monthly exchange rate'
            : 'Unit: Baht (THB) · Budget, Plan and Actual are imported or keyed in'
        : 'Unit: units (flights) · counted by Airline + Station + Aircraft';

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
                                    · Last edited by <b className="text-foreground">{version.editedBy}</b> on {version.editedAt}
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">Category</span>
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
                                        title={`${c.code} — ${c.name}${off ? ' (no Production Plan)' : ''}`}
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
                                    {v.id === store.versions[0].id ? ' (latest)' : ''}
                                    {isVersionEditable(store.versions, v.id) ? '' : ' 🔒'}
                                </option>
                            ))}
                        </select>
                    </label>
                    {!editable && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Lock className="h-3 w-3" /> Read-only (only the latest {EDITABLE_VERSION_COUNT} versions are editable)
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
                                <span className="pl-6 text-xs text-muted-foreground">Current filters and series, editable</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className={cn(btnOutline, 'w-9 px-0')} aria-label="More options">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-64">
                            {/* Dialogs open after the menu closes, so Radix doesn't leave pointer-events locked */}
                            <DropdownMenuItem
                                id="plan-create-version"
                                disabled={editing}
                                onSelect={() => setTimeout(() => setCreateOpen(true))}
                                className="flex-col items-start gap-0.5 py-2"
                            >
                                <span className="flex items-center gap-2 font-medium">
                                    <CopyPlus className="h-4 w-4 text-[hsl(206_92%_35%)]" /> Create New Version
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">Define Station / Airline / A/C type · monthly figures to key in</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={downloadTemplate} className="flex-col items-start gap-0.5 py-2">
                                <span className="flex items-center gap-2 font-medium">
                                    <FileSpreadsheet className="h-4 w-4" /> Download Template
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">Budget and Plan</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setTimeout(() => setHistoryOpen(true))} className="flex-col items-start gap-0.5 py-2">
                                <span className="flex items-center gap-2 font-medium">
                                    <History className="h-4 w-4" /> Version History
                                </span>
                                <span className="pl-6 text-xs text-muted-foreground">Imports and change log of every version</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>

            {editing && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    Edit one row at a time in version <b>{version?.label}</b>
                    {isRev && isProdCat(cat) && ' · Plan / Actual are calculated — change flight counts on Production Plan'}
                    {!isRev && ' · Actual comes from completed THFs and cannot be edited'} · click &quot;Save&quot; under the row to log who edited it and when
                </div>
            )}

            {/* ── Table ── */}
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                    <span className="text-sm text-muted-foreground">Show</span>
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
                        {selectedCount > 1 ? 'More than 1 selected → Δ comparison rows shown (▲ higher · ▼ lower)' : 'Select another series to see comparison rows'}
                    </span>
                    <div className="flex-1" />
                    <button
                        type="button"
                        className={cn(btnOutline, 'h-8 px-3 text-xs text-[hsl(206_92%_35%)] dark:text-sky-300')}
                        disabled={!editable || editing || !freeStations.length}
                        onClick={() => setNewStationOpen(true)}
                        title={!editable ? `Only the latest ${EDITABLE_VERSION_COUNT} versions are editable` : !freeStations.length ? 'All stations already added' : 'Add Station'}
                    >
                        <Plus className="h-3.5 w-3.5" /> Station
                    </button>
                    <TooltipProvider>
                        {[
                            { label: 'Expand all', icon: ChevronsUpDown, onClick: () => setCollapsed({}) },
                            { label: 'Station totals only', icon: ChevronsDownUp, onClick: () => setCollapsed(Object.fromEntries(STATIONS.map((s) => [s, true]))) },
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
                    onToggle={(k) => setCollapsed((c) => ({ ...c, [k]: !c[k] }))}
                    closed={closed}
                    canEdit={editable && !editing}
                    editingLineId={edit?.lineId ?? null}
                    editingSeries={edit?.series ?? null}
                    onStartEdit={startRowEdit}
                    onEditAircraft={setAircraftLine}
                    onAddTypeGroup={(line, group) => setNewGroup({ line, group })}
                    onAddAirline={setNewAirlineStation}
                    onDeleteStation={onDeleteStation}
                    onEditStation={onEditStation}
                    onDeleteAirline={onDeleteAirline}
                    onDeleteTypeGroup={onDeleteTypeGroup}
                    onSaveEdit={saveRowEdit}
                    onCancelEdit={cancelRowEdit}
                    onCellChange={onCellChange}
                    onRenameAirline={onRenameAirline}
                    fx={hasFx ? { values: fx, onChange: onFxChange } : undefined}
                    unit={unit}
                />
            </Card>

            {/* ── Data reference ── */}
            <Card className="p-5">
                <h2 className="mb-3 text-sm font-bold text-foreground">
                    Data sources — Category {cat} ({CATEGORIES.find((c) => c.code === cat)?.name})
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
                        Each month's Actual is shown once that month has ended ({closed === 12 ? 'full year' : closed === 0 ? 'no month closed yet' : `closed Jan–${MONTHS[closed - 1]}`})
                    </li>
                    <li>Versions are kept for 3 years · the latest {EDITABLE_VERSION_COUNT} are editable · every edit records who made it and when</li>
                    {isRev && isProdCat(cat) && <li>Initial Service price = the contract Minimum Rate of each service type</li>}
                    {!isRev && <li>Plan from OAG: monthly flights are summarised from each imported file, counted by Airline, Station and Aircraft</li>}
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

            {confirmDialog}
            <StationDialog
                open={!!stationDialog}
                onOpenChange={(open) => !open && setStationDialog(null)}
                initial={stationDialog}
                onSave={onSaveStation}
            />
            <AircraftComboDialog
                open={!!aircraftLine}
                onOpenChange={(open) => !open && setAircraftLine(null)}
                line={aircraftLine}
                takenIds={
                    aircraftLine
                        ? lines
                              .filter((l) => l.id !== aircraftLine.id && l.station === aircraftLine.station && l.al === aircraftLine.al && l.airline === aircraftLine.airline && l.typeGroup === aircraftLine.typeGroup)
                              .flatMap((l) => l.combinationIds ?? (l.combinationId != null ? [l.combinationId] : []))
                        : []
                }
                onSave={onSaveAircraft}
            />
            <AircraftComboDialog
                open={!!newGroup}
                onOpenChange={(open) => !open && setNewGroup(null)}
                mode="add"
                line={newGroupLine}
                takenIds={[]}
                onSave={onSaveNewGroup}
            />
            <AircraftComboDialog
                open={newStationOpen}
                onOpenChange={setNewStationOpen}
                mode="station"
                stations={freeStations}
                line={newStationLine}
                takenIds={[]}
                onSave={onSaveNewStation}
            />
            <AircraftComboDialog
                open={!!newAirlineStation}
                onOpenChange={(open) => !open && setNewAirlineStation(null)}
                mode="airline"
                line={newAirlineLine}
                takenIds={[]}
                onSave={onSaveNewAirline}
            />
            <ImportDialog open={importOpen} onOpenChange={setImportOpen} mode={mode} latestVersion={store.versions[0].label} onConfirm={onImport} />
            <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} versions={store.versions} />
            <CreateVersionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                mode={mode}
                versions={store.versions}
                defaultYear={year}
                defaultStation={station === 'ALL' ? STATIONS[0] : station}
                defaultCat={cat}
                onConfirm={onCreateVersion}
            />
        </div>
    );
}
