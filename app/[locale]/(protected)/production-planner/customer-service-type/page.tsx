'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Pencil, Plus, Search, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PermissionActionGuard } from '@/components/partials/auth/PermissionActionGuard';
import { cn } from '@/lib/utils';
import { btnOutline, btnPrimary } from '../_plan/dialogs';
import { nowLabel } from '../_plan/data';
import { CS_DOT, CS_SEED, CS_SHEET_HEADER, CS_TYPES, isHold, sortByName, usedStations, type CustomerService, type ServiceType } from './data';
import { CsImportDialog, CustomerDialog } from './dialogs';

const PERM = 'CUSTOMER_SERVICE_TYPE';

function Dot({ type, className }: { type: ServiceType; className?: string }) {
    return <span aria-hidden className={cn('inline-block h-2 w-2 shrink-0 rounded-full', className)} style={{ background: CS_DOT[type] }} />;
}

function Chip({
    active,
    onClick,
    children,
    count,
    type,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
    type?: ServiceType;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors',
                active
                    ? 'border-[hsl(206_92%_35%)] bg-[hsl(206_92%_35%)] text-white'
                    : 'border-border bg-card text-foreground/80 hover:border-[hsl(206_92%_35%)]/60 hover:text-foreground'
            )}
        >
            {type && <Dot type={type} className={active ? 'ring-2 ring-white/70' : ''} />}
            {children}
            {count !== undefined && (
                <span className={cn('rounded-full px-1.5 text-[11px] font-bold', active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>{count}</span>
            )}
        </button>
    );
}

export default function CustomerServiceTypePage() {
    const [data, setData] = useState<CustomerService[]>(CS_SEED);
    const [query, setQuery] = useState('');
    const [station, setStation] = useState('ALL');
    const [type, setType] = useState<'ALL' | ServiceType>('ALL');
    const [showHold, setShowHold] = useState(false);
    const [dialog, setDialog] = useState<{ open: boolean; initial: CustomerService | null }>({ open: false, initial: null });
    const [importOpen, setImportOpen] = useState(false);

    const stations = useMemo(() => usedStations(data), [data]);
    const holdCount = data.filter(isHold).length;
    const activeCount = data.length - holdCount;

    // If a station filter no longer exists (e.g. after edit), fall back to ALL
    const stationFilter = station === 'ALL' || stations.includes(station) ? station : 'ALL';
    const typeFilter = type === 'On hold' && !showHold ? 'ALL' : type;

    const visibleBase = useMemo(() => data.filter((c) => showHold || !isHold(c)), [data, showHold]);
    const countBy = (pred: (s: CustomerService['services'][number]) => boolean) => visibleBase.filter((c) => c.services.some(pred)).length;

    const list = useMemo(() => {
        const q = query.trim().toLowerCase();
        return visibleBase.filter((c) => {
            if (q && !`${c.name} ${c.icao} ${c.iata}`.toLowerCase().includes(q)) return false;
            return c.services.some((s) => (stationFilter === 'ALL' || s.station === stationFilter) && (typeFilter === 'ALL' || s.type === typeFilter));
        });
    }, [visibleBase, query, stationFilter, typeFilter]);

    const gridCols = `minmax(240px,1.6fr) repeat(${stations.length}, minmax(150px,1fr)) 56px`;

    // ── Save (add / edit) ──
    const onSave = (rec: CustomerService, originalIcao: string | null) => {
        setData((d) => sortByName(originalIcao ? d.map((c) => (c.icao === originalIcao ? rec : c)) : [...d, rec]));
        setDialog({ open: false, initial: null });
        toast.success(`${originalIcao ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า'} ${rec.name} แล้ว`);
    };

    // ── Import ──
    const onImport = (incoming: CustomerService[], fileName: string) => {
        const byIcao = new Map(data.map((c) => [c.icao, c]));
        let added = 0;
        incoming.forEach((c) => {
            if (!byIcao.has(c.icao)) added++;
            byIcao.set(c.icao, c);
        });
        setData(sortByName(Array.from(byIcao.values())));
        setImportOpen(false);
        toast.success(`นำเข้าจาก ${fileName} · เพิ่มใหม่ ${added} ราย · อัปเดต ${incoming.length - added} ราย`);
    };

    // ── Export (Excel) — follows current filters ──
    const exportXlsx = async () => {
        const XLSX = await import('xlsx');
        const aoa: (string | number)[][] = [
            ['Customer Service Type — SAMS Commercial'],
            ['Exported', nowLabel(), 'Station', stationFilter === 'ALL' ? 'All' : stationFilter, 'Service', typeFilter === 'ALL' ? 'All' : typeFilter],
            [],
            CS_SHEET_HEADER,
        ];
        list.forEach((c) =>
            c.services
                .filter((s) => (stationFilter === 'ALL' || s.station === stationFilter) && (typeFilter === 'ALL' || s.type === typeFilter))
                .forEach((s) => aoa.push([c.name, c.icao, c.iata, s.station, s.type, s.addon, s.aircraft, isHold(c) ? 'On hold' : 'Active']))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Customer Service Type');
        XLSX.writeFile(wb, `Customer_Service_Type_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Excel file downloaded');
    };

    const downloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.aoa_to_sheet([CS_SHEET_HEADER.slice(0, 7), ['Cebu Pacific', 'CEB', '5J', 'BKK', 'Full CRS', '+ Headset', 'A330']]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Customer_Service_Type_Template.xlsx');
    };

    return (
        <div className="space-y-4">
            {/* ── Title + toolbar ── */}
            <Card className="p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-foreground">Customer Service Type</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            ลูกค้า <b className="text-foreground">{data.length}</b> ราย · ให้บริการอยู่ <b className="text-foreground">{activeCount}</b> ราย · On hold{' '}
                            <b className="text-foreground">{holdCount}</b> ราย
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <PermissionActionGuard menuCode={PERM} action="canCreate">
                            <button id="cs-import-btn" type="button" className={btnPrimary} onClick={() => setImportOpen(true)}>
                                <Upload className="h-4 w-4" /> Import
                            </button>
                        </PermissionActionGuard>
                        <PermissionActionGuard menuCode={PERM} action="canExport">
                            <button id="cs-export-btn" type="button" className={btnOutline} onClick={exportXlsx} disabled={!list.length}>
                                <Download className="h-4 w-4" /> Export Excel
                            </button>
                        </PermissionActionGuard>
                        <PermissionActionGuard menuCode={PERM} action="canCreate">
                            <button id="cs-add-btn" type="button" className={btnOutline} onClick={() => setDialog({ open: true, initial: null })}>
                                <Plus className="h-4 w-4" /> เพิ่มลูกค้า
                            </button>
                        </PermissionActionGuard>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                    {CS_TYPES.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5">
                            <Dot type={t} /> {t}
                        </span>
                    ))}
                </div>
            </Card>

            <Card className="overflow-hidden">
                {/* ── Filters ── */}
                <div className="space-y-2.5 border-b border-border px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="relative flex h-9 w-full max-w-xs items-center">
                            <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">ค้นหาลูกค้า</span>
                            <input
                                id="cs-query"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="ค้นหาชื่อ / ICAO / IATA"
                                className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </label>
                        <div className="flex-1" />
                        <Chip active={showHold} onClick={() => setShowHold((v) => !v)} count={holdCount}>
                            {showHold ? 'ซ่อน' : 'แสดง'} On hold
                        </Chip>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-16 text-xs font-bold uppercase tracking-wide text-muted-foreground">Station</span>
                        <Chip active={stationFilter === 'ALL'} onClick={() => setStation('ALL')}>
                            ทั้งหมด
                        </Chip>
                        {stations.map((st) => (
                            <Chip key={st} active={stationFilter === st} onClick={() => setStation(st)} count={countBy((s) => s.station === st)}>
                                {st}
                            </Chip>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-16 text-xs font-bold uppercase tracking-wide text-muted-foreground">Service</span>
                        <Chip active={typeFilter === 'ALL'} onClick={() => setType('ALL')}>
                            ทั้งหมด
                        </Chip>
                        {CS_TYPES.filter((t) => t !== 'On hold' || showHold).map((t) => (
                            <Chip key={t} type={t} active={typeFilter === t} onClick={() => setType(t)} count={countBy((s) => s.type === t)}>
                                {t}
                            </Chip>
                        ))}
                    </div>
                </div>

                {/* ── Matrix: Airline × Station ── */}
                <div className="overflow-x-auto">
                    <div style={{ minWidth: 240 + stations.length * 150 + 56 }}>
                        <div
                            className="sticky top-0 z-10 grid border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                            style={{ gridTemplateColumns: gridCols }}
                        >
                            <div className="px-4 py-2.5">Airline</div>
                            {stations.map((st) => (
                                <div key={st} className={cn('px-4 py-2.5', stationFilter === st && 'bg-sky-100 text-[hsl(206_92%_30%)] dark:bg-sky-950/50 dark:text-sky-300')}>
                                    {st}
                                </div>
                            ))}
                            <div />
                        </div>

                        {list.length === 0 && <div className="px-4 py-10 text-center text-sm text-muted-foreground">ไม่พบลูกค้าที่ตรงกับเงื่อนไข</div>}

                        {list.map((c) => {
                            const hold = isHold(c);
                            return (
                                <div
                                    key={c.icao}
                                    className="group grid border-b border-border/70 bg-card transition-colors last:border-b-0 hover:bg-muted/30"
                                    style={{ gridTemplateColumns: gridCols }}
                                >
                                    <div className="flex min-w-0 flex-col gap-0.5 px-4 py-3.5">
                                        <b className={cn('truncate font-semibold', hold ? 'text-muted-foreground' : 'text-foreground')} title={c.name}>
                                            {c.name}
                                        </b>
                                        <small className="text-xs text-muted-foreground">
                                            {c.icao} · {c.iata || '—'}
                                        </small>
                                    </div>
                                    {stations.map((st) => {
                                        const items = c.services.filter((s) => s.station === st);
                                        return (
                                            <div key={st} className={cn('flex flex-col gap-3 px-4 py-3.5', stationFilter === st && 'bg-sky-50/70 dark:bg-sky-950/20')}>
                                                {items.length === 0 ? (
                                                    <span className="text-border">–</span>
                                                ) : (
                                                    items.map((s, i) => (
                                                        <div key={i} className={cn('flex flex-col gap-0.5 transition-opacity', typeFilter !== 'ALL' && s.type !== typeFilter && 'opacity-30')}>
                                                            <span className={cn('flex items-center gap-1.5 text-sm font-semibold', s.type === 'On hold' ? 'text-muted-foreground' : 'text-foreground')}>
                                                                <Dot type={s.type} /> {s.type}
                                                            </span>
                                                            {s.addon && <span className="pl-3.5 text-xs text-orange-800 dark:text-orange-400">{s.addon}</span>}
                                                            {s.aircraft && <span className="pl-3.5 text-xs text-muted-foreground">{s.aircraft}</span>}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="flex items-start justify-center py-3">
                                        <PermissionActionGuard menuCode={PERM} action="canEdit">
                                            <button
                                                type="button"
                                                aria-label={`แก้ไข ${c.name}`}
                                                title="แก้ไข"
                                                onClick={() => setDialog({ open: true, initial: c })}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-60 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        </PermissionActionGuard>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                    แสดง {list.length} จาก {visibleBase.length} ราย · ข้อมูลตัวอย่าง (mock) — ยังไม่เชื่อมต่อ API
                </div>
            </Card>

            <CustomerDialog
                open={dialog.open}
                onOpenChange={(o) => !o && setDialog({ open: false, initial: null })}
                initial={dialog.initial}
                existingIcaos={data.map((c) => c.icao)}
                onSave={onSave}
            />
            <CsImportDialog open={importOpen} onOpenChange={setImportOpen} onConfirm={onImport} onTemplate={downloadTemplate} />
        </div>
    );
}
