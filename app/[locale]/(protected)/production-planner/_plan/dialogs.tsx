'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { FileSpreadsheet, Lock, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { EDITABLE_VERSION_COUNT, STATIONS, type LineInfo, type Mode, type PlanVersion } from './data';

const fieldCls =
    'h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const btn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = cn(btn, 'bg-[hsl(206_92%_35%)] text-white hover:bg-[hsl(206_92%_29%)]');
export const btnOutline = cn(btn, 'border border-border bg-card text-foreground hover:bg-muted');

// ── Add / edit a row (first 4 columns) ─────────────────────────────────────

export type LineDraft = LineInfo & { priceUsd?: number };

export function LineDialog({
    open,
    onOpenChange,
    initial,
    withPrice,
    defaultStation,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial: LineDraft | null;
    withPrice: boolean;
    defaultStation: string;
    onSave: (line: LineDraft) => void;
}) {
    const [draft, setDraft] = useState<LineDraft>(() => emptyLine(defaultStation));
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setDraft(initial ?? emptyLine(defaultStation));
            setError('');
        }
    }, [open, initial, defaultStation]);

    const set = <K extends keyof LineDraft>(k: K, v: LineDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

    const save = () => {
        if (!draft.al.trim() || !draft.airline.trim()) {
            setError('Please enter AL and Airline.');
            return;
        }
        onSave({
            ...draft,
            al: draft.al.trim().toUpperCase(),
            airline: draft.airline.trim(),
            acType: draft.acType.trim() || '—',
            engine: draft.engine.trim() || '—',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initial ? 'แก้ไขแถว' : 'เพิ่มแถว'}</DialogTitle>
                    <DialogDescription>กรอกข้อมูล 4 คอลัมน์แรก · ตัวเลขรายเดือนกรอกในตารางได้เลย</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                        Station
                        <select value={draft.station} onChange={(e) => set('station', e.target.value)} className={fieldCls} disabled={!!initial}>
                            {STATIONS.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                        AL
                        <input value={draft.al} onChange={(e) => set('al', e.target.value)} maxLength={3} placeholder="เช่น FD" className={cn(fieldCls, 'uppercase')} />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground sm:col-span-2">
                        Airline
                        <input value={draft.airline} onChange={(e) => set('airline', e.target.value)} placeholder="ชื่อสายการบิน" className={fieldCls} />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                        A/C type
                        <input value={draft.acType} onChange={(e) => set('acType', e.target.value)} placeholder="A320, B737-800" className={fieldCls} />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                        Aircraft Engine
                        <input value={draft.engine} onChange={(e) => set('engine', e.target.value)} placeholder="CFM56 / V2500" className={fieldCls} />
                    </label>
                    {withPrice && (
                        <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                            Initial service price (USD / flight)
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={draft.priceUsd ?? 0}
                                onChange={(e) => set('priceUsd', Math.max(0, Number(e.target.value) || 0))}
                                className={cn(fieldCls, 'tabular-nums')}
                            />
                            <span className="block font-normal">Minimum Rate ตาม Contract</span>
                        </label>
                    )}
                </div>
                {error && <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{error}</div>}
                <DialogFooter className="gap-2">
                    <button type="button" className={btnOutline} onClick={() => onOpenChange(false)}>
                        ยกเลิก
                    </button>
                    <button type="button" className={btnPrimary} onClick={save}>
                        บันทึก
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function emptyLine(station: string): LineDraft {
    return { id: '', station, al: '', airline: '', acType: '', engine: '', priceUsd: 0 };
}

// ── Import ─────────────────────────────────────────────────────────────────

export type ImportKind = 'budget' | 'plan' | 'other';

const IMPORT_KINDS: Record<Mode, { key: ImportKind; title: string; desc: string; tpl: string }[]> = {
    prod: [
        { key: 'budget', title: 'Budget', desc: 'เป้าหมายทั้งปี (unit) · แทนที่ Budget ใน version ล่าสุด และบันทึก log การแก้ไข', tpl: 'Production_Budget_Template.xlsx' },
        { key: 'plan', title: 'Plan (OAG)', desc: 'ไฟล์ OAG · ระบบนับจำนวน flight รายเดือนจาก Airline + Station + Aircraft และสร้าง version ใหม่', tpl: 'OAG_Template.xlsx' },
    ],
    rev: [
        { key: 'budget', title: 'Revenue Budget', desc: 'เป้าหมายรายได้ (THB) ทุก Category · แทนที่ Budget ใน version ล่าสุด', tpl: 'Revenue_Budget_Template.xlsx' },
        { key: 'other', title: 'Category B / C / D', desc: 'Plan และ Actual (THB) ของ Lessor / Ad Hoc / Auxiliary', tpl: 'Revenue_BCD_Template.xlsx' },
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
                    <DialogTitle>{file ? 'ตรวจสอบก่อนนำเข้า' : 'Import ข้อมูล'}</DialogTitle>
                    <DialogDescription>{file ? 'ยังไม่มีการบันทึกจนกว่าจะกด "นำเข้า"' : 'เลือกประเภท แล้ววางไฟล์ Excel หรือ CSV'}</DialogDescription>
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
                            <b className="text-foreground">ลากไฟล์ {current.title} มาวางที่นี่</b>
                            <span>
                                หรือ{' '}
                                <button type="button" className="font-semibold text-blue-600 underline" onClick={() => inputRef.current?.click()}>
                                    เลือกไฟล์
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
                            ยังไม่มีไฟล์? <span className="font-semibold text-blue-600">ดาวน์โหลด {current.tpl}</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                            <b className="min-w-0 flex-1 truncate">{file}</b>
                            <button type="button" className="text-sm font-semibold text-blue-600 underline" onClick={() => setFile('')}>
                                เปลี่ยนไฟล์
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(kind === 'plan'
                                ? [['Flights (OAG)', '1,248'], ['ช่วงข้อมูล', 'Oct–Dec 26'], ['สถานี', 'BKK, HKT']]
                                : kind === 'other'
                                  ? [['Category', 'B, C, D'], ['แถวข้อมูล', '8'], ['สถานี', 'BKK, HKT']]
                                  : [['ปี', '2026'], ['แถวข้อมูล', '18'], ['สถานี', 'BKK, HKT']]
                            ).map(([k, v]) => (
                                <div key={k} className="flex flex-col rounded-lg bg-muted/50 px-3 py-2.5">
                                    <small className="text-xs text-muted-foreground">{k}</small>
                                    <b className="text-lg">{v}</b>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            ⚠ 1 แถวไม่พบ Airline code ในระบบ (แถว 9: &ldquo;XYZ&rdquo;) — แถวนี้จะถูกข้าม
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {kind === 'plan' ? (
                                <>
                                    จะสร้าง <b className="text-foreground">Plan version ใหม่</b> โดยนับ flight จาก Airline + Station + Aircraft · เดือนที่ไม่อยู่ในไฟล์ใช้ค่าจาก version {latestVersion}
                                </>
                            ) : (
                                <>
                                    จะ<b className="text-foreground">แทนที่ข้อมูลใน version {latestVersion}</b> และบันทึกชื่อผู้แก้ไขและวันที่ไว้ใน log
                                </>
                            )}
                        </p>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <button type="button" className={btnOutline} onClick={() => (file ? setFile('') : onOpenChange(false))}>
                        {file ? 'ย้อนกลับ' : 'ยกเลิก'}
                    </button>
                    <button type="button" className={btnPrimary} disabled={!file} onClick={() => onConfirm(kind, file)}>
                        นำเข้า {current.title}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Version history / edit log ─────────────────────────────────────────────

export function HistoryDialog({ open, onOpenChange, versions }: { open: boolean; onOpenChange: (open: boolean) => void; versions: PlanVersion[] }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>ประวัติ Version และ Log การแก้ไข</DialogTitle>
                    <DialogDescription>
                        เก็บย้อนหลัง 3 ปี · แก้ไขได้เฉพาะ {EDITABLE_VERSION_COUNT} version ล่าสุด
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 bg-muted text-left text-xs">
                            <tr>
                                <th className="px-3 py-2 font-semibold">Version</th>
                                <th className="px-3 py-2 font-semibold">ปี</th>
                                <th className="px-3 py-2 font-semibold">ที่มา</th>
                                <th className="px-3 py-2 font-semibold">สร้างโดย</th>
                                <th className="px-3 py-2 font-semibold">แก้ไขล่าสุด</th>
                                <th className="px-3 py-2 font-semibold">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {versions.map((v, i) => (
                                <tr key={v.id} className="border-t border-border">
                                    <td className="px-3 py-2 font-medium tabular-nums">
                                        {v.label}
                                        {i === 0 && <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">ล่าสุด</span>}
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
                                        {i < EDITABLE_VERSION_COUNT ? (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                แก้ไขได้
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                <Lock className="h-3 w-3" /> ดูอย่างเดียว
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

