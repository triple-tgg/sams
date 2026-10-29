'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown, Copy, CopyPlus, FileSpreadsheet, Info, Layers, Lock, MapPin, Plane, Plus, Trash2, Upload, X } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCombinations, useEngines } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks';
import type { AircraftEngineCombination } from '@/lib/api/master/aircraft-engine/aircraftEngine.types';
import { TransferBox, type TransferBoxItem } from '@/components/ui/transfer-box';
import { groupCombinationsByDisplayLabel } from '@/lib/utils/aircraftEngineDisplay';
import { cn } from '@/lib/utils';
import {
    CATEGORIES,
    EDITABLE_VERSION_COUNT,
    PROD_CATS,
    STATIONS,
    TYPE_GROUPS,
    YEARS,
    nowLabel,
    structureLines,
    type CatCode,
    type LineInfo,
    type LogAction,
    type Mode,
    type PlanVersion,
    type StationGroup,
} from './data';

const fieldCls =
    'h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const btn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = cn(btn, 'bg-[hsl(206_92%_35%)] text-white hover:bg-[hsl(206_92%_29%)]');
export const btnOutline = cn(btn, 'border border-border bg-card text-foreground hover:bg-muted');

// ── Delete confirmation (every delete goes through this) ─────────────────────

export interface DeleteRequest {
    title: string;
    description: string;
    onConfirm: () => void;
}

/** `confirmDelete(req)` opens the modal; render `confirmDialog` once in the component. */
export function useConfirmDelete() {
    const [req, setReq] = useState<DeleteRequest | null>(null);
    const confirmDialog = (
        <AlertDialog open={!!req} onOpenChange={(open) => !open && setReq(null)}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                            <Trash2 className="h-4 w-4" />
                        </span>
                        {req?.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{req?.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className={btnOutline}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(btn, 'bg-red-600 text-white hover:bg-red-700')}
                        onClick={() => {
                            req?.onConfirm();
                            setReq(null);
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
    return { confirmDelete: setReq, confirmDialog };
}

// ── Edit a row's A/C type + Engine (picked from Aircraft-Engine combinations) ──

export type AircraftPatch = Pick<LineInfo, 'acType' | 'engine' | 'combinationId' | 'combinationIds'>;


export function AircraftComboDialog({
    open,
    onOpenChange,
    mode = 'edit',
    stations = [],
    line,
    takenIds,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** `edit`: change one row; `add`: new type group — each picked combination becomes a row;
     *  `airline`: new airline at `line.station` (AL, name and type group keyed in here), rows as in `add`;
     *  `station`: as `airline`, plus the station picked from `stations`. */
    mode?: 'edit' | 'add' | 'airline' | 'station';
    /** `station` mode: stations that can still be added. */
    stations?: string[];
    /** The row being edited, or (add) the airline + new type group the rows go under. */
    line: Omit<LineInfo, 'id'> | null;
    /** Combinations already used by other rows of the same airline + type group. */
    takenIds: number[];
    /** One entry per picked combination (+ the keyed-in airline in `airline` mode). Return a message to reject and keep the dialog open. */
    onSave: (picked: AircraftPatch[], airline: { station: string; al: string; airline: string; typeGroup: string }) => string | void;
}) {
    const [info, setInfo] = useState({ station: '', al: '', airline: '', typeGroup: TYPE_GROUPS[0] });
    const keysAirline = mode === 'airline' || mode === 'station';
    const combosQuery = useCombinations();
    const { data: engines } = useEngines();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');

    const combos = useMemo(
        () => [...(combosQuery.data ?? [])].sort((x, y) => x.familyCode.localeCompare(y.familyCode) || x.displayLabel.localeCompare(y.displayLabel)),
        [combosQuery.data]
    );
    const available = useMemo(() => combos.filter((c) => !takenIds.includes(c.id)), [combos, takenIds]);
    const items = useMemo(() => available.map((c) => ({ id: c.id, name: c.displayLabel, groupKey: c.familyCode })), [available]);

    useEffect(() => {
        if (!open || !line) return;
        const ids = line.combinationIds ?? (line.combinationId != null ? [line.combinationId] : []);
        setSelected(new Set(combos.filter((c) => ids.includes(c.id)).map((c) => c.displayLabel)));
        setError('');
    }, [open, line, combos]);

    useEffect(() => {
        if (open) setInfo({ station: stations[0] ?? '', al: '', airline: '', typeGroup: TYPE_GROUPS[0] });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
    }, [open]);

    const save = () => {
        const picked = available.filter((c) => selected.has(c.displayLabel));
        const airline = { station: mode === 'station' ? info.station : (line?.station ?? ''), al: info.al.trim().toUpperCase(), airline: info.airline.trim(), typeGroup: info.typeGroup };
        if (mode === 'station' && !airline.station) {
            setError('Please select a station.');
            return;
        }
        if (keysAirline && (!airline.al || !airline.airline)) {
            setError('Please enter AL and Airline.');
            return;
        }
        if (!picked.length) {
            setError('Please select at least one A/C type + Engine combination.');
            return;
        }
        const rejected = onSave(
            picked.map((c) => ({
                acType: c.series ? `${c.familyCode}-${c.series}` : c.familyCode,
                engine: engines?.find((e) => e.engineCode === c.engineCode)?.engineName ?? c.engineCode,
                combinationId: c.id,
                combinationIds: [c.id],
            })),
            airline
        );
        if (rejected) setError(rejected);
    };

    const hidden = combos.length - available.length;

    /** Selected panel grouped like Aircraft License on HR staff: "A319 (CFM-LEAP-1A/CFM56/V2500)", "B777 - 200 (RB211-TRENT-800)". */
    const groupSelected = (selectedItems: TransferBoxItem[]) => {
        const byId = new Map(selectedItems.map((it) => [Number(it.id), it]));
        return groupCombinationsByDisplayLabel(Array.from(byId.keys()), combos).map(({ label, ids }) => ({
            key: label,
            label,
            items: ids.flatMap((id) => byId.get(id) ?? []),
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[hsl(206_92%_35%)] dark:bg-blue-950/50 dark:text-sky-300">
                            <Plane className="h-4 w-4" />
                        </span>
                        {mode === 'station' ? 'Add Station' : mode === 'airline' ? `Add Airline at ${line?.station ?? ''}` : mode === 'add' ? `Add Type group ${line?.typeGroup ?? ''}` : 'Edit A/C type'}
                    </DialogTitle>
                    <DialogDescription>
                        {line && !keysAirline && (
                            <>
                                {line.station} › {line.airline}
                                {line.typeGroup && ` › ${line.typeGroup}`}
                                {mode === 'edit' && (
                                    <>
                                        {' '}
                                        · Current: <b>{line.acType}</b> ({line.engine})
                                    </>
                                )}
                            </>
                        )}
                        <span className="block">
                            {mode !== 'edit'
                                ? 'Pick A/C type + Aircraft Engine from Aircraft-Engine combinations · merged into 1 row, monthly figures blank until keyed in'
                                : 'Pick A/C type + Aircraft Engine from Aircraft-Engine combinations · monthly figures are unchanged'}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                {keysAirline && (
                    <div className={cn('grid grid-cols-1 gap-3', mode === 'station' ? 'sm:grid-cols-[110px_96px_1fr_140px]' : 'sm:grid-cols-[96px_1fr_160px]')}>
                        {mode === 'station' && (
                            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                                Station
                                <select value={info.station} onChange={(e) => setInfo({ ...info, station: e.target.value })} className={fieldCls}>
                                    {stations.map((st) => (
                                        <option key={st}>{st}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                            AL
                            <input value={info.al} onChange={(e) => setInfo({ ...info, al: e.target.value })} maxLength={3} placeholder="e.g. FD" className={cn(fieldCls, 'uppercase')} autoFocus />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                            Airline
                            <input value={info.airline} onChange={(e) => setInfo({ ...info, airline: e.target.value })} placeholder="Airline name" className={fieldCls} />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                            Type group
                            <select value={info.typeGroup} onChange={(e) => setInfo({ ...info, typeGroup: e.target.value })} className={fieldCls}>
                                {TYPE_GROUPS.map((t) => (
                                    <option key={t}>{t}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}
                {combosQuery.isLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
                ) : combosQuery.isError ? (
                    <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Could not load Aircraft-Engine combinations. Please try again.</div>
                ) : (
                    <>
                        <TransferBox
                            items={items}
                            selected={selected}
                            onSelectedChange={(s) => {
                                setSelected(s);
                                setError('');
                            }}
                            emptyIcon={<Plane className="h-6 w-6" />}
                            emptyLabel="No A/C type selected"
                            hasError={!!error}
                            height={320}
                            groupSelectedItems={groupSelected}
                        />
                        {hidden > 0 && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5" /> {hidden} item(s) hidden — already used by another row in this Type group
                            </p>
                        )}
                    </>
                )}
                {error && <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{error}</div>}
                <DialogFooter className="gap-2">
                    <button type="button" className={btnOutline} onClick={() => onOpenChange(false)}>
                        Cancel
                    </button>
                    <button type="button" className={btnPrimary} onClick={save} disabled={combosQuery.isLoading || combosQuery.isError}>
                        Save
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Import ─────────────────────────────────────────────────────────────────

export type ImportKind = 'budget' | 'plan' | 'other';

const IMPORT_KINDS: Record<Mode, { key: ImportKind; title: string; desc: string; tpl: string }[]> = {
    prod: [
        { key: 'budget', title: 'Budget', desc: 'Full-year target (units) · replaces Budget in the latest version and records it in the change log', tpl: 'Production_Budget_Template.xlsx' },
        { key: 'plan', title: 'Plan (OAG)', desc: 'OAG file · monthly flights are counted by Airline + Station + Aircraft and a new version is created', tpl: 'OAG_Template.xlsx' },
    ],
    rev: [
        { key: 'budget', title: 'Revenue Budget', desc: 'Revenue target (THB) for every Category · replaces Budget in the latest version', tpl: 'Revenue_Budget_Template.xlsx' },
        { key: 'other', title: 'Category B / C / D', desc: 'Plan and Actual (THB) for Lessor / Ad Hoc / Auxiliary', tpl: 'Revenue_BCD_Template.xlsx' },
    ],
};

export function ImportDialog({
    open,
    onOpenChange,
    mode,
    latestVersion,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: Mode;
    latestVersion: string;
    onConfirm: (kind: ImportKind, fileName: string) => void;
}) {
    const kinds = IMPORT_KINDS[mode];
    const [kind, setKind] = useState<ImportKind>(kinds[mode === 'prod' ? 1 : 0].key);
    const [file, setFile] = useState('');
    const [over, setOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) setFile('');
    }, [open]);

    const current = kinds.find((k) => k.key === kind) ?? kinds[0];

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) setFile(f.name);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{file ? 'Review before import' : 'Import data'}</DialogTitle>
                    <DialogDescription>{file ? 'Nothing is saved until you click "Import"' : 'Choose a type, then drop an Excel or CSV file'}</DialogDescription>
                </DialogHeader>

                {!file ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Import type">
                            {kinds.map((k) => (
                                <button
                                    key={k.key}
                                    type="button"
                                    aria-pressed={kind === k.key}
                                    onClick={() => setKind(k.key)}
                                    className={cn(
                                        'flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left',
                                        kind === k.key ? 'border-2 border-[hsl(206_92%_35%)] bg-blue-50/50 p-[13px] dark:border-sky-400 dark:bg-blue-950/30' : 'border-border'
                                    )}
                                >
                                    <b className="text-sm text-foreground">{k.title}</b>
                                    <span className="text-xs leading-relaxed text-muted-foreground">{k.desc}</span>
                                </button>
                            ))}
                        </div>
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setOver(true);
                            }}
                            onDragLeave={() => setOver(false)}
                            onDrop={onDrop}
                            className={cn(
                                'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center text-sm text-muted-foreground',
                                over ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-border bg-muted/30'
                            )}
                        >
                            <Upload className="h-7 w-7" />
                            <b className="text-foreground">Drop the {current.title} file here</b>
                            <span>
                                or{' '}
                                <button type="button" className="font-semibold text-blue-600 underline" onClick={() => inputRef.current?.click()}>
                                    browse
                                </button>{' '}
                                · .xlsx, .csv
                            </span>
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                hidden
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setFile(f.name);
                                    e.target.value = '';
                                }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No file yet? <span className="font-semibold text-blue-600">Download {current.tpl}</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                            <b className="min-w-0 flex-1 truncate">{file}</b>
                            <button type="button" className="text-sm font-semibold text-blue-600 underline" onClick={() => setFile('')}>
                                Change file
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(kind === 'plan'
                                ? [['Flights (OAG)', '1,248'], ['Period', 'Oct–Dec 26'], ['Stations', 'BKK, HKT']]
                                : kind === 'other'
                                  ? [['Category', 'B, C, D'], ['Rows', '8'], ['Stations', 'BKK, HKT']]
                                  : [['Year', '2026'], ['Rows', '18'], ['Stations', 'BKK, HKT']]
                            ).map(([k, v]) => (
                                <div key={k} className="flex flex-col rounded-lg bg-muted/50 px-3 py-2.5">
                                    <small className="text-xs text-muted-foreground">{k}</small>
                                    <b className="text-lg">{v}</b>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            ⚠ 1 row has an unknown Airline code (row 9: &ldquo;XYZ&rdquo;) — it will be skipped
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {kind === 'plan' ? (
                                <>
                                    Creates a <b className="text-foreground">new Plan version</b> by counting flights per Airline + Station + Aircraft · months not in the file keep the values of version {latestVersion}
                                </>
                            ) : (
                                <>
                                    <b className="text-foreground">Replaces the data in version {latestVersion}</b> and records who changed it and when in the log
                                </>
                            )}
                        </p>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <button type="button" className={btnOutline} onClick={() => (file ? setFile('') : onOpenChange(false))}>
                        {file ? 'Back' : 'Cancel'}
                    </button>
                    <button type="button" className={btnPrimary} disabled={!file} onClick={() => onConfirm(kind, file)}>
                        Import {current.title}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Version history / edit log ─────────────────────────────────────────────

const LOG_ACTION: Record<LogAction, { label: string; cls: string }> = {
    create: { label: 'Create', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    import: { label: 'Import', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
    figures: { label: 'Figures', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    add: { label: 'Add', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
    edit: { label: 'Edit', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    delete: { label: 'Delete', cls: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' },
};

function VersionStatus({ editable }: { editable: boolean }) {
    return editable ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">Editable</span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Lock className="h-3 w-3" /> Read-only
        </span>
    );
}

export function HistoryDialog({ open, onOpenChange, versions }: { open: boolean; onOpenChange: (open: boolean) => void; versions: PlanVersion[] }) {
    /** Version whose change log is open (list view when null). */
    const [detailId, setDetailId] = useState<string | null>(null);
    useEffect(() => {
        if (!open) setDetailId(null);
    }, [open]);

    const idx = versions.findIndex((v) => v.id === detailId);
    const detail = idx >= 0 ? versions[idx] : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-3xl">
                {detail ? (
                    <>
                        <DialogHeader>
                            <button type="button" onClick={() => setDetailId(null)} className="mb-1 inline-flex w-fit items-center gap-1 rounded text-xs font-semibold text-[hsl(206_92%_35%)] hover:underline dark:text-sky-300">
                                <ChevronLeft className="h-3.5 w-3.5" /> Back to versions
                            </button>
                            <DialogTitle className="flex flex-wrap items-center gap-2">
                                Version {detail.label}
                                {idx === 0 && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Latest</span>}
                                <VersionStatus editable={idx < EDITABLE_VERSION_COUNT} />
                            </DialogTitle>
                            <DialogDescription>
                                Year {detail.year} · {detail.source} · Created by {detail.createdBy}
                                {detail.note && <span className="block">{detail.note}</span>}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
                            {detail.log.length === 0 ? (
                                <div className="p-6 text-center text-sm text-muted-foreground">No changes recorded yet</div>
                            ) : (
                                <ol className="divide-y divide-border">
                                    {/* Newest first */}
                                    {[...detail.log].reverse().map((e, i) => (
                                        <li key={i} className="flex gap-3 px-3 py-2.5 text-sm">
                                            <div className="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">
                                                {e.at}
                                                <div className="truncate font-medium text-foreground" title={e.by}>
                                                    {e.by}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', LOG_ACTION[e.action].cls)}>{LOG_ACTION[e.action].label}</span>
                                                    {e.cat && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Cat {e.cat}</span>}
                                                    <span className="min-w-0 break-words">{e.summary}</span>
                                                </div>
                                                {!!e.changes?.length && (
                                                    <ul className="mt-1 flex flex-wrap gap-1">
                                                        {e.changes.map((c, k) => (
                                                            <li key={k} className="rounded bg-muted/70 px-1.5 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                                                                {c}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Version History & Change Log</DialogTitle>
                            <DialogDescription>
                                Kept for 3 years · only the latest {EDITABLE_VERSION_COUNT} versions are editable · click a version to see its change log
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
                            <table className="w-full border-collapse text-sm">
                                <thead className="sticky top-0 bg-muted text-left text-xs">
                                    <tr>
                                        <th className="px-3 py-2 font-semibold">Version</th>
                                        <th className="px-3 py-2 font-semibold">Year</th>
                                        <th className="px-3 py-2 font-semibold">Source</th>
                                        <th className="px-3 py-2 font-semibold">Created by</th>
                                        <th className="px-3 py-2 font-semibold">Last edited</th>
                                        <th className="px-3 py-2 font-semibold">Status</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {versions.map((v, i) => (
                                        <tr
                                            key={v.id}
                                            tabIndex={0}
                                            onClick={() => setDetailId(v.id)}
                                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setDetailId(v.id))}
                                            className="cursor-pointer border-t border-border hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                                            aria-label={`View history of version ${v.label}`}
                                        >
                                            <td className="px-3 py-2 font-medium tabular-nums">
                                                {v.label}
                                                {i === 0 && <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Latest</span>}
                                                {v.note && <div className="text-xs font-normal text-muted-foreground">{v.note}</div>}
                                            </td>
                                            <td className="px-3 py-2 tabular-nums">{v.year}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{v.source}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{v.createdBy}</td>
                                            <td className="px-3 py-2">
                                                {v.editedBy ? (
                                                    <>
                                                        <div>{v.editedBy}</div>
                                                        <div className="text-xs text-muted-foreground tabular-nums">{v.editedAt}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <VersionStatus editable={i < EDITABLE_VERSION_COUNT} />
                                            </td>
                                            <td className="px-2 py-2 text-muted-foreground">
                                                <span className="flex items-center gap-0.5 text-[11px]">
                                                    {v.log.length}
                                                    <ChevronRight className="h-4 w-4" />
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── Create a new version (Station → Airline → Type group → A/C type) ─────────

export interface NewVersionDraft {
    year: number;
    label: string;
    note: string;
    /** The one category that gets the structure's rows. */
    cat: CatCode;
    structure: StationGroup[];
}

const blankAircraft = () => ({ combinationId: null as number | null, acType: '', engine: '' });
const blankTypeGroup = (name: string) => ({ name, aircraft: [blankAircraft()] });
const blankAirline = () => ({ al: '', airline: '', typeGroups: [] as StationGroup['airlines'][number]['typeGroups'] });

const addBtn = 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[hsl(206_92%_35%)] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-blue-950/40';
const delBtn = 'shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40';
const iconBtn = 'shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-[hsl(206_92%_35%)] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-950/40';
const smallField = cn(fieldCls, 'h-8 text-[13px]');

type AirlineNode = StationGroup['airlines'][number];
type TypeGroupNode = AirlineNode['typeGroups'][number];

/** Aircraft-Engine Combination master, sorted by family, plus how a pick becomes an A/C type + Engine. */
function useComboMaster() {
    const combosQuery = useCombinations();
    const { data: engines } = useEngines();
    const combos = useMemo(
        () => [...(combosQuery.data ?? [])].sort((x, y) => x.familyCode.localeCompare(y.familyCode) || x.displayLabel.localeCompare(y.displayLabel)),
        [combosQuery.data]
    );
    const families = useMemo(() => Array.from(new Set(combos.map((c) => c.familyCode))), [combos]);
    const pickCombination = (c: AircraftEngineCombination) => ({
        combinationId: c.id,
        acType: c.series ? `${c.familyCode}-${c.series}` : c.familyCode,
        engine: engines?.find((e) => e.engineCode === c.engineCode)?.engineName ?? c.engineCode,
    });
    return { combosQuery, combos, families, pickCombination };
}

/** Problem with a station structure (for the save button), or '' when it is complete. */
function validateStructure(structure: StationGroup[]): string {
    for (const g of structure) {
        if (!g.airlines.length) return `Station ${g.station}: please add at least one airline.`;
        for (const a of g.airlines) {
            if (!a.al.trim() || !a.airline.trim()) return `Station ${g.station}: please enter AL and Airline for every airline.`;
            for (const t of a.typeGroups) {
                if (!t.name) return `${a.airline} (${g.station}): please select a type group.`;
                // Rows kept from before the master existed carry their A/C type as text
                if (!t.aircraft.length || t.aircraft.some((ac) => ac.combinationId == null && !ac.acType))
                    return `${a.airline} (${g.station}) · ${t.name}: please select an aircraft-engine combination for every row.`;
            }
        }
    }
    return '';
}

/** Trimmed copy for saving. */
const cleanStructure = (structure: StationGroup[]): StationGroup[] =>
    structure.map((g) => ({
        station: g.station,
        airlines: g.airlines.map((a) => ({ ...a, al: a.al.trim().toUpperCase(), airline: a.airline.trim(), typeGroups: a.typeGroups.map((t) => ({ name: t.name, aircraft: t.aircraft })) })),
    }));

/** One station of the structure editor: Station → Airline → Type group → A/C type + Engine. */
function StationCard({
    g,
    onChange,
    stationOptions,
    isClosed = false,
    onToggle,
    onStationChange,
    actions,
    combo,
    confirmDelete,
    scope = '',
}: {
    g: StationGroup;
    onChange: (fn: (g: StationGroup) => StationGroup) => void;
    /** Stations to pick from; without it the station is shown read-only. */
    stationOptions?: string[];
    isClosed?: boolean;
    /** Show the collapse toggle. */
    onToggle?: () => void;
    onStationChange?: (next: string) => void;
    /** Station-level buttons on the right of the header. */
    actions?: React.ReactNode;
    combo: ReturnType<typeof useComboMaster>;
    confirmDelete: (req: DeleteRequest) => void;
    /** Appended to delete messages, e.g. " in this new version". */
    scope?: string;
}) {
    const { combosQuery, combos, families, pickCombination } = combo;
    const patchAirline = (ai: number, fn: (a: AirlineNode) => AirlineNode) => onChange((x) => ({ ...x, airlines: x.airlines.map((a, i) => (i === ai ? fn(a) : a)) }));
    const patchGroup = (ai: number, gi: number, fn: (t: TypeGroupNode) => TypeGroupNode) =>
        patchAirline(ai, (a) => ({ ...a, typeGroups: a.typeGroups.map((t, i) => (i === gi ? fn(t) : t)) }));
    /** Collapsed airline cards, by index. */
    const [closedAirlines, setClosedAirlines] = useState<Set<number>>(new Set());
    const toggleAirline = (ai: number) =>
        setClosedAirlines((s) => {
            const next = new Set(s);
            if (!next.delete(ai)) next.add(ai);
            return next;
        });

    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 dark:bg-slate-800">
                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={!isClosed}
                        aria-label={`${isClosed ? 'Expand' : 'Collapse'} station ${g.station}`}
                        title={isClosed ? 'Expand' : 'Collapse'}
                        className="-ml-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-slate-200 hover:text-foreground dark:hover:bg-slate-700"
                    >
                        {isClosed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                )}
                <MapPin className="h-4 w-4 text-[hsl(206_92%_35%)]" />
                {stationOptions ? (
                    <select
                        value={g.station}
                        onChange={(e) => {
                            const next = e.target.value;
                            onStationChange?.(next);
                            onChange((x) => ({ ...x, station: next }));
                        }}
                        aria-label="Station"
                        className={cn(smallField, 'w-32 font-semibold')}
                    >
                        {stationOptions.map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                ) : (
                    <span className="text-sm font-semibold text-foreground">{g.station}</span>
                )}
                <span className="text-xs text-muted-foreground">
                    {g.airlines.length} Airline · {structureLines([g]).length} row(s)
                </span>
                {actions && <span className="ml-auto flex items-center">{actions}</span>}
            </div>

            {!isClosed && (
                <div className="space-y-2 p-3">
                    {g.airlines.map((a, ai) => (
                        <div key={ai} className="rounded-md border border-border bg-card p-2.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleAirline(ai)}
                                    aria-expanded={!closedAirlines.has(ai)}
                                    aria-label={`${closedAirlines.has(ai) ? 'Expand' : 'Collapse'} airline ${a.airline}`}
                                    title={closedAirlines.has(ai) ? 'Expand' : 'Collapse'}
                                    className="-ml-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    {closedAirlines.has(ai) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                                <Plane className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <input
                                    value={a.al}
                                    onChange={(e) => patchAirline(ai, (x) => ({ ...x, al: e.target.value }))}
                                    maxLength={3}
                                    placeholder="AL"
                                    aria-label="AL"
                                    className={cn(smallField, 'w-16 uppercase')}
                                />
                                <input
                                    value={a.airline}
                                    onChange={(e) => patchAirline(ai, (x) => ({ ...x, airline: e.target.value }))}
                                    placeholder="Airline name"
                                    aria-label="Airline"
                                    className={cn(smallField, 'min-w-0 flex-1')}
                                />
                                {closedAirlines.has(ai) && (
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {a.typeGroups.length} Type group · {a.typeGroups.reduce((n, t) => n + t.aircraft.length, 0)} A/C type
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={delBtn}
                                    onClick={() =>
                                        confirmDelete({
                                            title: `Delete airline ${a.airline || '(unnamed)'}?`,
                                            description: `The airline and its ${a.typeGroups.length} type group(s) will be removed from ${g.station}${scope}.`,
                                            onConfirm: () => {
                                                onChange((x) => ({ ...x, airlines: x.airlines.filter((_, i) => i !== ai) }));
                                                // Later cards move up one index
                                                setClosedAirlines((s) => new Set([...s].filter((i) => i !== ai).map((i) => (i > ai ? i - 1 : i))));
                                            },
                                        })
                                    }
                                    aria-label="Remove airline"
                                    title="Delete Airline"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {!closedAirlines.has(ai) && (
                                <div className="mt-2 space-y-2 border-l-2 border-blue-100 pl-3 dark:border-blue-900 sm:ml-6">
                                    {a.typeGroups.map((t, gi) => (
                                        <div key={gi} className="rounded-md bg-muted/50 p-2">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                {/* Picked when added — remove and add again to change */}
                                                <span className="min-w-0 flex-1 text-[13px] font-semibold text-[hsl(206_92%_35%)] dark:text-sky-300">{t.name}</span>
                                                <button
                                                    type="button"
                                                    className={delBtn}
                                                    onClick={() =>
                                                        confirmDelete({
                                                            title: `Delete type group ${t.name}?`,
                                                            description: `Type group ${t.name} and its ${t.aircraft.length} A/C type(s) will be removed from ${a.airline || 'this airline'}.`,
                                                            onConfirm: () => patchAirline(ai, (x) => ({ ...x, typeGroups: x.typeGroups.filter((_, i) => i !== gi) })),
                                                        })
                                                    }
                                                    aria-label="Remove type group"
                                                    title="Delete Type Group"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="mt-1.5 space-y-1.5 sm:pl-5">
                                                {t.aircraft.map((ac, ri) => (
                                                    <div key={ri} className="flex items-center gap-2">
                                                        <select
                                                            value={ac.combinationId ?? ''}
                                                            onChange={(e) => {
                                                                const c = combos.find((x) => x.id === Number(e.target.value));
                                                                if (c) patchGroup(ai, gi, (x) => ({ ...x, aircraft: x.aircraft.map((r, i) => (i === ri ? pickCombination(c) : r)) }));
                                                            }}
                                                            disabled={combosQuery.isLoading}
                                                            aria-label="Aircraft-Engine combination"
                                                            className={cn(smallField, 'min-w-0 flex-1')}
                                                        >
                                                            <option value="" disabled>
                                                                {ac.combinationId == null && ac.acType
                                                                    ? `${ac.acType} (${ac.engine}) · existing`
                                                                    : combosQuery.isLoading
                                                                      ? 'Loading…'
                                                                      : 'Select A/C type + Engine'}
                                                            </option>
                                                            {families.map((f) => (
                                                                <optgroup key={f} label={f}>
                                                                    {/* Each combination once per type group */}
                                                                    {combos
                                                                        .filter((c) => c.familyCode === f && (c.id === ac.combinationId || !t.aircraft.some((r) => r.combinationId === c.id)))
                                                                        .map((c) => (
                                                                            <option key={c.id} value={c.id}>
                                                                                {c.displayLabel}
                                                                            </option>
                                                                        ))}
                                                                </optgroup>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            className={delBtn}
                                                            onClick={() =>
                                                                confirmDelete({
                                                                    title: `Delete A/C type ${combos.find((c) => c.id === ac.combinationId)?.displayLabel ?? (ac.acType || '(not selected)')}?`,
                                                                    description: `It will be removed from type group ${t.name} of ${a.airline || 'this airline'}.`,
                                                                    onConfirm: () => patchGroup(ai, gi, (x) => ({ ...x, aircraft: x.aircraft.filter((_, i) => i !== ri) })),
                                                                })
                                                            }
                                                            aria-label="Remove A/C type"
                                                            title="Delete A/C type"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className={addBtn}
                                                    onClick={() => patchGroup(ai, gi, (x) => ({ ...x, aircraft: [...x.aircraft, blankAircraft()] }))}
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> Add A/C type
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(() => {
                                        // Each type group once per airline — offer only the ones not added yet
                                        const free = TYPE_GROUPS.filter((o) => !a.typeGroups.some((t) => t.name === o));
                                        return (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button type="button" className={addBtn} disabled={!free.length} title={free.length ? undefined : 'All Type Groups added'}>
                                                        <Plus className="h-3.5 w-3.5" /> Add Type Group
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {free.map((o) => (
                                                        <DropdownMenuItem key={o} onSelect={() => patchAirline(ai, (x) => ({ ...x, typeGroups: [...x.typeGroups, blankTypeGroup(o)] }))}>
                                                            <Layers className="mr-2 h-3.5 w-3.5" /> {o}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    ))}
                    <button type="button" className={addBtn} onClick={() => onChange((x) => ({ ...x, airlines: [...x.airlines, blankAirline()] }))}>
                        <Plus className="h-3.5 w-3.5" /> Add Airline
                    </button>
                </div>
            )}
        </div>
    );
}

/** Edit one station of the table with the same editor as Create New Version. */
export function StationDialog({
    open,
    onOpenChange,
    initial,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The station as it is now (from its rows); the station itself is not editable here. */
    initial: StationGroup | null;
    /** Return a message to reject and keep the dialog open. */
    onSave: (group: StationGroup) => string | void;
}) {
    const combo = useComboMaster();
    const { confirmDelete, confirmDialog } = useConfirmDelete();
    const [draft, setDraft] = useState<StationGroup | null>(initial);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setDraft(initial && structuredClone(initial));
            setError('');
        }
    }, [open, initial]);

    const save = () => {
        if (!draft) return;
        const msg = validateStructure([draft]);
        if (msg) {
            setError(msg);
            return;
        }
        // Combination rows take their A/C type + Engine text from the master
        const filled: StationGroup = {
            ...draft,
            airlines: draft.airlines.map((a) => ({
                ...a,
                typeGroups: a.typeGroups.map((t) => ({
                    ...t,
                    aircraft: t.aircraft.map((ac) => {
                        const c = ac.combinationId != null ? combo.combos.find((x) => x.id === ac.combinationId) : undefined;
                        return c ? combo.pickCombination(c) : ac;
                    }),
                })),
            })),
        };
        const rejected = onSave(cleanStructure([filled])[0]);
        if (rejected) setError(rejected);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[hsl(206_92%_35%)]" /> Edit Station {initial?.station}
                    </DialogTitle>
                    <DialogDescription>Edit the Airline → Type Group → A/C type + Engine of this station</DialogDescription>
                </DialogHeader>
                <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                    {(combo.combosQuery.isError || (!combo.combosQuery.isLoading && !combo.combos.length)) && (
                        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            {combo.combosQuery.isError ? 'Could not load Aircraft-Engine combinations. Please try again.' : 'No Aircraft-Engine combinations found in master data.'}
                        </div>
                    )}
                    {draft && (
                        <StationCard
                            g={draft}
                            onChange={(fn) => setDraft((d) => d && fn(d))}
                            combo={combo}
                            confirmDelete={confirmDelete}
                            scope=" when you save"
                        />
                    )}
                </div>
                <div className="flex gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        Existing Airlines / Type Groups keep their monthly figures · new Type Groups start blank <b>&ldquo;—&rdquo;</b> until keyed in · removed Airlines / Type Groups are deleted with their figures
                    </span>
                </div>
                {error && <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{error}</div>}
                <DialogFooter className="gap-2">
                    <button type="button" className={btnOutline} onClick={() => onOpenChange(false)}>
                        Cancel
                    </button>
                    <button type="button" className={btnPrimary} onClick={save}>
                        <Check className="h-4 w-4" /> Save
                    </button>
                </DialogFooter>
                {confirmDialog}
            </DialogContent>
        </Dialog>
    );
}

export function CreateVersionDialog({
    open,
    onOpenChange,
    mode,
    versions,
    defaultYear,
    defaultStation,
    defaultCat,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: Mode;
    versions: PlanVersion[];
    defaultYear: number;
    defaultStation: string;
    defaultCat: CatCode;
    onConfirm: (draft: NewVersionDraft) => void;
}) {
    const catOptions = mode === 'prod' ? PROD_CATS : CATEGORIES.map((c) => c.code);
    const initDraft = (): NewVersionDraft => ({
        year: defaultYear,
        label: nowLabel(),
        note: '',
        cat: catOptions.includes(defaultCat) ? defaultCat : catOptions[0],
        structure: [{ station: defaultStation, airlines: [blankAirline()] }],
    });
    const [draft, setDraft] = useState<NewVersionDraft>(initDraft);
    const { confirmDelete, confirmDialog } = useConfirmDelete();
    const [error, setError] = useState('');
    /** Collapsed station groups, by station code. */
    const [closed, setClosed] = useState<Record<string, boolean>>({});

    // A/C type + Engine come from the Aircraft-Engine Combination master
    const combo = useComboMaster();
    const { combosQuery, combos } = combo;

    useEffect(() => {
        if (open) {
            setDraft(initDraft());
            setClosed({});
            setError('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultYear, defaultStation, defaultCat, mode]);

    const set = <K extends keyof NewVersionDraft>(k: K, v: NewVersionDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

    // Immutable updates at each level of the tree
    const setStructure = (fn: (st: StationGroup[]) => StationGroup[]) => setDraft((d) => ({ ...d, structure: fn(d.structure) }));
    const patchStation = (si: number, fn: (g: StationGroup) => StationGroup) => setStructure((st) => st.map((g, i) => (i === si ? fn(g) : g)));

    const usedStations = draft.structure.map((g) => g.station);
    const freeStations = STATIONS.filter((s) => !usedStations.includes(s));
    const rowCount = structureLines(draft.structure).length;
    const allClosed = draft.structure.length > 0 && draft.structure.every((g) => closed[g.station]);

    const validate = (): string => {
        const label = draft.label.trim();
        if (!label) return 'Please enter a version name.';
        if (versions.some((v) => v.year === draft.year && v.label.toLowerCase() === label.toLowerCase())) return `Version "${label}" already exists in ${draft.year}.`;
        if (!draft.structure.length) return 'Please add at least one station.';
        return validateStructure(draft.structure);
    };

    const save = () => {
        const msg = validate();
        if (msg) {
            setError(msg);
            setClosed({}); // reveal the field that needs fixing
            return;
        }
        onConfirm({
            ...draft,
            label: draft.label.trim(),
            note: draft.note.trim(),
            structure: cleanStructure(draft.structure),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CopyPlus className="h-5 w-5 text-[hsl(206_92%_35%)]" /> Create New Version
                    </DialogTitle>
                    <DialogDescription>Define the Station → Airline → Type Group → A/C type + Engine structure · monthly figures start blank until keyed in</DialogDescription>
                </DialogHeader>

                <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                            Year
                            <select id="create-version-year" value={draft.year} onChange={(e) => set('year', Number(e.target.value))} className={fieldCls}>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                            Version name
                            <input
                                id="create-version-label"
                                value={draft.label}
                                onChange={(e) => set('label', e.target.value)}
                                maxLength={40}
                                placeholder="e.g. Revised Q4 2026"
                                className={fieldCls}
                            />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground sm:col-span-2">
                            Note (optional)
                            <textarea
                                id="create-version-note"
                                value={draft.note}
                                onChange={(e) => set('note', e.target.value)}
                                rows={2}
                                maxLength={200}
                                placeholder="Why this version is being created"
                                className={cn(fieldCls, 'h-auto resize-none py-2')}
                            />
                        </label>
                        <div className="space-y-1 text-xs font-semibold text-muted-foreground sm:col-span-2">
                            Create rows in Category (choose 1)
                            <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
                                {catOptions.map((c) => {
                                    const on = draft.cat === c;
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            role="radio"
                                            onClick={() => set('cat', c)}
                                            aria-checked={on}
                                            className={cn(
                                                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                                                on ? 'border-[hsl(206_92%_35%)] bg-blue-50 text-[hsl(206_92%_35%)] dark:bg-blue-950/40' : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                            )}
                                        >
                                            {on && <Check className="h-3.5 w-3.5" />}
                                            {c} · {CATEGORIES.find((x) => x.code === c)?.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Structure */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Group Station</h3>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                {draft.structure.length} Station · {rowCount} row(s) in Category {draft.cat}
                                {draft.structure.length > 1 && (
                                    <button
                                        type="button"
                                        className={addBtn}
                                        onClick={() => setClosed(allClosed ? {} : Object.fromEntries(draft.structure.map((g) => [g.station, true])))}
                                    >
                                        {allClosed ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
                                        {allClosed ? 'Expand all' : 'Collapse all'}
                                    </button>
                                )}
                            </span>
                        </div>

                        {(combosQuery.isError || (!combosQuery.isLoading && !combos.length)) && (
                            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                {combosQuery.isError ? 'Could not load Aircraft-Engine combinations. Please try again.' : 'No Aircraft-Engine combinations found in master data.'}
                            </div>
                        )}

                        {draft.structure.map((g, si) => (
                            <StationCard
                                key={g.station}
                                g={g}
                                onChange={(fn) => patchStation(si, fn)}
                                stationOptions={[g.station, ...freeStations]}
                                isClosed={!!closed[g.station]}
                                onToggle={() => setClosed((c) => ({ ...c, [g.station]: !c[g.station] }))}
                                onStationChange={(next) => setClosed((c) => ({ ...c, [next]: !!c[g.station] }))}
                                combo={combo}
                                confirmDelete={confirmDelete}
                                scope=" in this new version"
                                actions={
                                    <>
                                            <button
                                                type="button"
                                                className={iconBtn}
                                                disabled={!freeStations.length}
                                                onClick={() => {
                                                    // Same airlines / type groups / A/C types under the next free station, right below this one
                                                    const copy: StationGroup = { ...structuredClone(g), station: freeStations[0] };
                                                    setStructure((st) => [...st.slice(0, si + 1), copy, ...st.slice(si + 1)]);
                                                    setClosed((c) => ({ ...c, [copy.station]: false }));
                                                }}
                                                aria-label={`Copy station ${g.station}`}
                                                title={freeStations.length ? `Copy ${g.station} as ${freeStations[0]} (station can be changed)` : 'All stations already added'}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className={delBtn}
                                                onClick={() =>
                                                    confirmDelete({
                                                        title: `Delete station ${g.station}?`,
                                                        description: `Station ${g.station} with its ${g.airlines.length} airline(s) will be removed from this new version.`,
                                                        onConfirm: () => setStructure((st) => st.filter((_, i) => i !== si)),
                                                    })
                                                }
                                                aria-label={`Remove station ${g.station}`}
                                                title="Delete Station"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                    </>
                                }
                            />
                        ))}

                        <button
                            type="button"
                            disabled={!freeStations.length}
                            onClick={() => setStructure((st) => [...st, { station: freeStations[0], airlines: [blankAirline()] }])}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-2.5 text-sm font-semibold text-[hsl(206_92%_35%)] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-blue-950/40"
                        >
                            <Plus className="h-4 w-4" /> Add Station
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        A/C type + Engine come from the Aircraft-Engine Combination master · each Type Group becomes 1 row in the table (an Airline without Type Groups = 1 row) · Budget / Plan / Actual show <b>&ldquo;—&rdquo;</b> until keyed in
                    </span>
                </div>
                {error && <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{error}</div>}
                <DialogFooter className="gap-2">
                    <button type="button" className={btnOutline} onClick={() => onOpenChange(false)}>
                        Cancel
                    </button>
                    <button id="create-version-submit" type="button" className={btnPrimary} onClick={save}>
                        <CopyPlus className="h-4 w-4" /> Create Version
                    </button>
                </DialogFooter>
                {confirmDialog}
            </DialogContent>
        </Dialog>
    );
}
