'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { FileSpreadsheet, Plus, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { btnOutline, btnPrimary } from '../_plan/dialogs';
import {
    CS_DOT,
    CS_SHEET_HEADER,
    CS_TYPES,
    ST_ORDER,
    isServiceType,
    type CustomerService,
    type ServiceLine,
    type ServiceType,
} from './data';

const fieldCls =
    'h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const emptyLine = (): ServiceLine => ({ station: 'BKK', type: 'Full CRS', addon: '', aircraft: '' });

// ── Add / edit customer ─────────────────────────────────────────────────────

export function CustomerDialog({
    open,
    onOpenChange,
    initial,
    existingIcaos,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** null = add new */
    initial: CustomerService | null;
    existingIcaos: string[];
    onSave: (rec: CustomerService, originalIcao: string | null) => void;
}) {
    const [draft, setDraft] = useState<CustomerService>({ name: '', icao: '', iata: '', services: [emptyLine()] });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setDraft(
            initial
                ? { ...initial, services: initial.services.map((s) => ({ ...s })) }
                : { name: '', icao: '', iata: '', services: [emptyLine()] }
        );
        setError('');
    }, [open, initial]);

    const setLine = (i: number, patch: Partial<ServiceLine>) =>
        setDraft((d) => ({ ...d, services: d.services.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

    const save = () => {
        const name = draft.name.trim();
        const icao = draft.icao.trim().toUpperCase();
        const iata = draft.iata.trim().toUpperCase();
        if (!name || !icao) return setError('กรุณากรอกชื่อ Airline และ ICAO');
        if (existingIcaos.some((x) => x === icao && x !== initial?.icao)) return setError(`ICAO ${icao} มีอยู่แล้วในระบบ`);
        onSave(
            {
                name,
                icao,
                iata,
                services: draft.services.map((s) => ({ ...s, addon: s.addon.trim(), aircraft: s.aircraft.trim() })),
            },
            initial?.icao ?? null
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{initial ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า'}</DialogTitle>
                    <DialogDescription>{initial ? 'กดบันทึกแล้วมีผลทันที' : 'กรอกข้อมูลลูกค้าและบริการที่ให้'}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground sm:col-span-2">
                        Airline
                        <input id="cs-ed-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="เช่น Cebu Pacific" className={fieldCls} />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                        ICAO
                        <input id="cs-ed-icao" value={draft.icao} maxLength={4} onChange={(e) => setDraft({ ...draft, icao: e.target.value })} placeholder="CEB" className={cn(fieldCls, 'uppercase')} />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                        IATA
                        <input id="cs-ed-iata" value={draft.iata} maxLength={3} onChange={(e) => setDraft({ ...draft, iata: e.target.value })} placeholder="5J" className={cn(fieldCls, 'uppercase')} />
                    </label>
                </div>

                <div className="mt-2 rounded-lg border border-border">
                    <div className="grid grid-cols-[100px_140px_1fr_1fr_36px] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        <span>Station</span>
                        <span>Service Type</span>
                        <span>เงื่อนไขเพิ่มเติม</span>
                        <span>Aircraft Type</span>
                        <span />
                    </div>
                    <div className="max-h-[320px] space-y-2 overflow-y-auto p-3">
                        {draft.services.map((s, i) => (
                            <div key={i} className="grid grid-cols-[100px_140px_1fr_1fr_36px] items-center gap-2">
                                <select aria-label="Station" value={s.station} onChange={(e) => setLine(i, { station: e.target.value })} className={fieldCls}>
                                    {ST_ORDER.map((st) => (
                                        <option key={st}>{st}</option>
                                    ))}
                                </select>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: CS_DOT[s.type] }} />
                                    <select aria-label="Service type" value={s.type} onChange={(e) => setLine(i, { type: e.target.value as ServiceType })} className={cn(fieldCls, 'pl-6')}>
                                        {CS_TYPES.map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <input aria-label="เงื่อนไขเพิ่มเติม" value={s.addon} onChange={(e) => setLine(i, { addon: e.target.value })} placeholder="(ถ้ามี)" className={fieldCls} />
                                <input aria-label="Aircraft type" value={s.aircraft} onChange={(e) => setLine(i, { aircraft: e.target.value })} placeholder="A320, B737NG" className={fieldCls} />
                                <button
                                    type="button"
                                    aria-label="ลบบริการนี้"
                                    disabled={draft.services.length === 1}
                                    onClick={() => setDraft((d) => ({ ...d, services: d.services.filter((_, j) => j !== i) }))}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, services: [...d.services, emptyLine()] }))}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(206_92%_35%)] hover:underline dark:text-sky-300"
                        >
                            <Plus className="h-3.5 w-3.5" /> เพิ่มบริการ
                        </button>
                    </div>
                </div>

                {error && (
                    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <DialogFooter>
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

// ── Import (Excel / CSV) ────────────────────────────────────────────────────

/** Parse rows in CS_SHEET_HEADER format into customers (grouped by ICAO). */
async function parseFile(file: File): Promise<{ list: CustomerService[]; skipped: number }> {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
    const headerIdx = rows.findIndex((r) => String(r[0]).trim().toLowerCase() === 'airline' && String(r[1]).trim().toUpperCase() === 'ICAO');
    const body = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;
    const map = new Map<string, CustomerService>();
    let skipped = 0;
    body.forEach((r) => {
        const [name, icao, iata, station, type, addon, aircraft] = r.map((v) => String(v ?? '').trim());
        if (!name && !icao) return;
        if (!name || !icao || !isServiceType(type) || !station) {
            skipped++;
            return;
        }
        const key = icao.toUpperCase();
        const rec = map.get(key) ?? { name, icao: key, iata: iata === '—' ? '' : iata.toUpperCase(), services: [] };
        rec.services.push({ station: station.toUpperCase(), type, addon, aircraft: aircraft === '—' ? '' : aircraft });
        map.set(key, rec);
    });
    return { list: Array.from(map.values()), skipped };
}

export function CsImportDialog({
    open,
    onOpenChange,
    onConfirm,
    onTemplate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (list: CustomerService[], fileName: string) => void;
    onTemplate: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<{ list: CustomerService[]; skipped: number } | null>(null);
    const [error, setError] = useState('');
    const [drag, setDrag] = useState(false);

    useEffect(() => {
        if (open) {
            setFile(null);
            setPreview(null);
            setError('');
        }
    }, [open]);

    const pick = async (f?: File) => {
        if (!f) return;
        setFile(f);
        setError('');
        try {
            const res = await parseFile(f);
            if (!res.list.length) setError('ไม่พบข้อมูลที่ถูกต้องในไฟล์ (ตรวจสอบหัวคอลัมน์ตาม Template)');
            setPreview(res);
        } catch {
            setPreview(null);
            setError('อ่านไฟล์ไม่สำเร็จ รองรับเฉพาะ .xlsx, .xls, .csv');
        }
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files?.[0]);
    };

    const lines = preview?.list.reduce((n, c) => n + c.services.length, 0) ?? 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Import Customer Service Type</DialogTitle>
                    <DialogDescription>วางไฟล์ Excel หรือ CSV · ยังไม่มีการบันทึกจนกว่าจะกด &quot;นำเข้า&quot;</DialogDescription>
                </DialogHeader>

                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={onDrop}
                    className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
                        drag ? 'border-[hsl(206_92%_35%)] bg-blue-50/60 dark:bg-blue-950/30' : 'border-border hover:border-[hsl(206_92%_35%)]/60 hover:bg-muted/40'
                    )}
                >
                    {file ? <FileSpreadsheet className="h-8 w-8 text-emerald-600" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    <p className="text-sm font-semibold text-foreground">{file ? file.name : 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์'}</p>
                    <p className="text-xs text-muted-foreground">.xlsx · .xls · .csv — หนึ่งแถวต่อหนึ่งบริการ (Airline + Station)</p>
                    <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>คอลัมน์: {CS_SHEET_HEADER.slice(0, 7).join(' · ')}</span>
                    <button type="button" onClick={onTemplate} className="font-semibold text-[hsl(206_92%_35%)] hover:underline dark:text-sky-300">
                        ดาวน์โหลด Template
                    </button>
                </div>

                {preview && preview.list.length > 0 && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                        พบลูกค้า <b>{preview.list.length}</b> ราย · <b>{lines}</b> บริการ
                        {preview.skipped > 0 && <> · ข้าม {preview.skipped} แถวที่ข้อมูลไม่ครบ</>}
                        <div className="mt-1 text-xs opacity-80">ลูกค้าที่มี ICAO ซ้ำกับในระบบจะถูกแทนที่ด้วยข้อมูลจากไฟล์</div>
                    </div>
                )}
                {error && (
                    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <button type="button" className={btnOutline} onClick={() => onOpenChange(false)}>
                        ยกเลิก
                    </button>
                    <button type="button" className={btnPrimary} disabled={!preview?.list.length} onClick={() => file && preview && onConfirm(preview.list, file.name)}>
                        นำเข้า
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
