'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { td, th } from '../../components/RosterUi';

// ── Mock data (Summary tab) ─────────────────────────────────────────────────

type Tone = 'success' | 'danger' | 'neutral' | 'warning';

interface KpiCard {
    label: string;
    value: string;
    badge?: { text: string; tone: Tone };
    detail: React.ReactNode;
}

const KPI_CARDS: KpiCard[] = [
    {
        label: 'ช่างถือ License — ต้องมี',
        value: '41',
        badge: { text: 'พอ (+7)', tone: 'success' },
        detail: (
            <>
                ต้องมี <Sep /> มีอยู่ <b className="text-foreground">48</b> <Sep /> ตำแหน่ง/วัน 15
            </>
        ),
    },
    {
        label: 'Mechanic — ต้องมี (รวมคู่ License)',
        value: '46',
        badge: { text: 'ขาด 21 คน', tone: 'danger' },
        detail: (
            <>
                ต้องมี <Sep /> มีอยู่ <b className="text-foreground">25</b> <Sep /> ตำแหน่ง/วัน 17
            </>
        ),
    },
    {
        label: 'ขอบเขตการคำนวณ',
        value: '87',
        badge: { text: 'เฉพาะ Current', tone: 'success' },
        detail: 'เที่ยวบินที่นับ จากทั้งหมด 115 แถว',
    },
    {
        label: 'ตัวคูณ (รอบ 3/3, relief)',
        value: '×2.67',
        detail: 'roster ×2.00 · relief ×1.337',
    },
];

interface DailyRow {
    day: string;
    day_pos: number;
    night_pos: number;
    required: number;
    available: number;
}

const LICENSE_DAILY: DailyRow[] = [
    { day: 'D1', day_pos: 8, night_pos: 5, required: 35, available: 48 },
    { day: 'D2', day_pos: 8, night_pos: 5, required: 35, available: 48 },
    { day: 'D3', day_pos: 8, night_pos: 5, required: 35, available: 48 },
    { day: 'D4', day_pos: 8, night_pos: 5, required: 35, available: 48 },
    { day: 'D5', day_pos: 9, night_pos: 5, required: 38, available: 48 },
    { day: 'D6', day_pos: 8, night_pos: 5, required: 35, available: 48 },
    { day: 'D7', day_pos: 8, night_pos: 6, required: 38, available: 48 },
];
const LICENSE_PEAK: DailyRow = { day: 'สูงสุดแต่ละกะ', day_pos: 9, night_pos: 6, required: 41, available: 48 };

const MECHANIC_DAILY: DailyRow[] = [
    { day: 'D1', day_pos: 9, night_pos: 6, required: 41, available: 25 },
    { day: 'D2', day_pos: 9, night_pos: 5, required: 38, available: 25 },
    { day: 'D3', day_pos: 9, night_pos: 7, required: 43, available: 25 },
    { day: 'D4', day_pos: 9, night_pos: 6, required: 41, available: 25 },
    { day: 'D5', day_pos: 9, night_pos: 7, required: 43, available: 25 },
    { day: 'D6', day_pos: 9, night_pos: 6, required: 41, available: 25 },
    { day: 'D7', day_pos: 9, night_pos: 8, required: 46, available: 25 },
];
const MECHANIC_PEAK: DailyRow = { day: 'สูงสุดแต่ละกะ', day_pos: 9, night_pos: 8, required: 46, available: 25 };

// Concurrent staff per 15-minute slot (00:00–23:45), max across the week
const LICENSE_SLOTS = [
    5, 4, 3, 3, 4, 4, 3, 3, 3, 3, 2, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 2, 2, 2, 2, 2, 2,
    3, 3, 3, 4, 3, 2, 1, 2, 1, 4, 4, 4, 4, 4, 3, 1,
    1, 1, 2, 4, 4, 6, 7, 8, 8, 8, 9, 8, 7, 6, 5, 5,
    5, 6, 7, 6, 5, 7, 6, 3, 2, 5, 5, 5, 5, 5, 3, 5,
    5, 4, 4, 6, 5, 5, 4, 5, 4, 4, 3, 2, 2, 3, 3, 3,
];
const MECHANIC_SLOTS = [
    7, 5, 4, 4, 5, 5, 6, 5, 6, 5, 3, 3, 3, 3, 2, 2,
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 4, 4, 4, 4, 4, 4,
    4, 3, 3, 4, 3, 2, 2, 3, 3, 5, 5, 6, 6, 5, 4, 3,
    2, 2, 2, 4, 4, 6, 7, 8, 8, 8, 9, 9, 9, 8, 8, 8,
    8, 8, 9, 8, 7, 8, 6, 5, 4, 5, 7, 7, 8, 7, 6, 7,
    6, 6, 9, 7, 7, 8, 5, 6, 7, 6, 6, 4, 4, 5, 5, 4,
];

const CONCURRENCY_DATA = LICENSE_SLOTS.map((license, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    const mechanic = Math.max(MECHANIC_SLOTS[i], license);
    return {
        slot: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        license,
        mechanic,
        // Stacked on top of License so the bar's total height equals Mechanic
        mechanicExtra: mechanic - license,
    };
});

const CAPACITY_ROWS = [
    { label: 'ลำตัวแคบ', avgPerDay: 51.3, maxPerDay: 55, capacity: 28 },
    { label: 'ลำตัวกว้าง', avgPerDay: 10.1, maxPerDay: 11, capacity: 6 },
];

const LICENSE_SHORT_FLIGHTS = [
    'HY531/ HY532 ขาด 2 คน',
    'HY531/ HY532 ไม่มีช่างเลย',
    'HY531/ HY532 ไม่มีช่างเลย',
    'HY533/ HY534 ขาด 2 คน',
    'HY533/ HY534 ไม่มีช่างเลย',
];

interface ExtraShiftSimulationRow {
    extraPerDay: number;
    mainShift: string;
    totalPositions: number;
    headcount: number;
    status: 'none' | 'same' | 'more';
}

const LICENSE_SIMULATION: ExtraShiftSimulationRow[] = [
    { extraPerDay: 0, mainShift: '9 / 6', totalPositions: 15, headcount: 41, status: 'none' },
    { extraPerDay: 1, mainShift: '8 / 6', totalPositions: 15, headcount: 41, status: 'same' },
    { extraPerDay: 2, mainShift: '7 / 6', totalPositions: 15, headcount: 41, status: 'same' },
    { extraPerDay: 3, mainShift: '6 / 6', totalPositions: 15, headcount: 41, status: 'same' },
    { extraPerDay: 4, mainShift: '5 / 6', totalPositions: 15, headcount: 41, status: 'same' },
    { extraPerDay: 5, mainShift: '4 / 6', totalPositions: 15, headcount: 41, status: 'same' },
    { extraPerDay: 6, mainShift: '3 / 6', totalPositions: 15, headcount: 41, status: 'same' },
    { extraPerDay: 7, mainShift: '3 / 6', totalPositions: 16, headcount: 43, status: 'more' },
    { extraPerDay: 8, mainShift: '3 / 6', totalPositions: 17, headcount: 46, status: 'more' },
];

const MECHANIC_SIMULATION: ExtraShiftSimulationRow[] = [
    { extraPerDay: 0, mainShift: '9 / 8', totalPositions: 17, headcount: 46, status: 'none' },
    { extraPerDay: 1, mainShift: '8 / 8', totalPositions: 17, headcount: 46, status: 'same' },
    { extraPerDay: 2, mainShift: '7 / 8', totalPositions: 17, headcount: 46, status: 'same' },
    { extraPerDay: 3, mainShift: '6 / 8', totalPositions: 17, headcount: 46, status: 'same' },
    { extraPerDay: 4, mainShift: '5 / 8', totalPositions: 17, headcount: 46, status: 'same' },
    { extraPerDay: 5, mainShift: '4 / 8', totalPositions: 17, headcount: 46, status: 'same' },
    { extraPerDay: 6, mainShift: '4 / 8', totalPositions: 18, headcount: 49, status: 'more' },
    { extraPerDay: 7, mainShift: '4 / 8', totalPositions: 19, headcount: 51, status: 'more' },
    { extraPerDay: 8, mainShift: '4 / 8', totalPositions: 20, headcount: 54, status: 'more' },
];

/** Mechanic shortage shown on the Summary tab trigger badge. */
export const SUMMARY_MOCK_SHORTAGE = MECHANIC_PEAK.required - MECHANIC_PEAK.available;

const LICENSE_COLOR = '#2B4A75';
const MECHANIC_COLOR = '#B0C4DE';

// ── UI helpers ──────────────────────────────────────────────────────────────

function Sep() {
    return <span className="mx-1 text-border">|</span>;
}

const TONE_CLASS: Record<Tone, string> = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
    return (
        <span className={cn('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', TONE_CLASS[tone])}>
            {children}
        </span>
    );
}

function StaffingBadge({ required, available }: { required: number; available: number }) {
    const diff = available - required;
    return diff >= 0 ? <Badge tone="success">พอ (+{diff})</Badge> : <Badge tone="danger">ขาด {-diff} คน</Badge>;
}

function KpiTile({ card }: { card: KpiCard }) {
    return (
        <Card className="p-4">
            <div className="text-xs text-muted-foreground">{card.label}</div>
            <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-2xl font-bold tabular-nums text-foreground">{card.value}</span>
                {card.badge && <Badge tone={card.badge.tone}>{card.badge.text}</Badge>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{card.detail}</div>
        </Card>
    );
}

function DailyTable({ title, rows, peak }: { title: string; rows: DailyRow[]; peak: DailyRow }) {
    const renderRow = (r: DailyRow, isPeak = false, index = 0) => (
        <tr
            key={r.day}
            className={cn(
                'border-t border-border transition-colors',
                isPeak
                    ? 'border-t-2 border-border bg-slate-100/90 font-bold dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    : index % 2 === 1
                      ? 'bg-slate-50/80 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-800/60'
                      : 'bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50'
            )}
        >
            <td className={cn(td, isPeak && 'font-bold')}>{r.day}</td>
            <td className={cn(td, 'tabular-nums', isPeak && 'font-bold')}>{r.day_pos} / {r.night_pos}</td>
            <td className={cn(td, 'text-right tabular-nums', isPeak && 'font-bold')}>{r.required}</td>
            <td className={cn(td, 'text-right tabular-nums', isPeak && 'font-bold')}>{r.available}</td>
            <td className={td}><StaffingBadge required={r.required} available={r.available} /></td>
        </tr>
    );

    return (
        <Card className="overflow-hidden p-5">
            <h2 className="mb-3 text-sm font-bold text-[#075CA2] dark:text-sky-300">{title}</h2>
            <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className={th}>วัน</th>
                            <th className={th}>ตำแหน่ง (เช้า / ดึก)</th>
                            <th className={cn(th, 'text-right')}>ต้องมี</th>
                            <th className={cn(th, 'text-right')}>มี</th>
                            <th className={th}>สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => renderRow(r, false, i))}
                        {renderRow(peak, true, rows.length)}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                แถว &quot;สูงสุดแต่ละกะ&quot; = ค่าสูงสุดของแต่ละกะตลอดสัปดาห์ รวมกันแล้วคูณตัวคูณ เป็นเกณฑ์ที่ใช้ (ตรงกับชีต Summary ใน Excel)
            </p>
        </Card>
    );
}

function SimulationBadge({ status }: { status: ExtraShiftSimulationRow['status'] }) {
    if (status === 'none') return <Badge tone="neutral">ไม่ใช้กะเสริม</Badge>;
    if (status === 'same') return <Badge tone="neutral">เท่าเดิม</Badge>;
    return <Badge tone="warning">มากกว่า</Badge>;
}

function SimulationCard({ title, rows }: { title: string; rows: ExtraShiftSimulationRow[] }) {
    return (
        <Card className="overflow-hidden p-5">
            <h2 className="mb-3 text-sm font-bold text-[#075CA2] dark:text-sky-300">{title}</h2>
            <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className={cn(th, 'text-center')}>คนกะเสริม/วัน</th>
                            <th className={cn(th, 'text-center')}>ตำแหน่งกะหลัก (เช้า / ดึก)</th>
                            <th className={cn(th, 'text-center')}>รวมตำแหน่ง</th>
                            <th className={cn(th, 'text-center')}>Headcount ที่ต้องมี</th>
                            <th className={th}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr
                                key={row.extraPerDay}
                                className={cn(
                                    'border-t border-border transition-colors',
                                    i % 2 === 1
                                        ? 'bg-slate-50/80 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-800/60'
                                        : 'bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50',
                                    row.status !== 'more' && 'font-bold'
                                )}
                            >
                                <td className={cn(td, 'text-center tabular-nums')}>{row.extraPerDay}</td>
                                <td className={cn(td, 'text-center tabular-nums')}>{row.mainShift}</td>
                                <td className={cn(td, 'text-center tabular-nums')}>{row.totalPositions}</td>
                                <td className={cn(td, 'text-center tabular-nums')}>{row.headcount}</td>
                                <td className={td}><SimulationBadge status={row.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                กะเสริมลดตำแหน่งที่กะหลักต้องมีช่วงพีคได้เท่ากับจำนวนที่เพิ่มในกะเสริม จึงมักไม่ลดจำนวนคนรวม (ตัวเลข &quot;เท่าเดิม&quot;) ประโยชน์คือให้กะหลักมีคนน้อยลงและเสริมเฉพาะช่วงพีค ถ้าเพิ่มเกินส่วนที่เกินพีคจะเปลืองคน (ตั้งค่าจริงที่แท็บ &quot;ตั้งค่า&quot;)
            </p>
        </Card>
    );
}

// ── Summary tab ─────────────────────────────────────────────────────────────

export function SummaryTab({ onViewFlights }: { onViewFlights: () => void }) {
    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {KPI_CARDS.map((card) => (
                    <KpiTile key={card.label} card={card} />
                ))}
            </div>

            {/* Daily License / Mechanic */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DailyTable title="ช่างถือ License รายวัน" rows={LICENSE_DAILY} peak={LICENSE_PEAK} />
                <DailyTable title="Mechanic รายวัน (รวมคู่ License)" rows={MECHANIC_DAILY} peak={MECHANIC_PEAK} />
            </div>

            {/* Concurrent staff by time slot */}
            <Card className="overflow-hidden p-5">
                <h2 className="mb-3 text-sm font-bold text-[#075CA2] dark:text-sky-300">
                    จำนวนช่างที่ต้องใช้พร้อมกัน ตามช่วงเวลา (ค่าสูงสุดทั้งสัปดาห์)
                </h2>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CONCURRENCY_DATA} barCategoryGap={1} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="slot"
                                interval={7}
                                tickFormatter={(v: string) => v.slice(0, 2)}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                                formatter={(_value: number, name: string, item: { payload?: (typeof CONCURRENCY_DATA)[number] }) => {
                                    const p = item.payload!;
                                    return name === 'License' ? [p.license, 'License'] : [p.mechanic, 'Mechanic (รวมคู่ License)'];
                                }}
                            />
                            <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="license" name="License" stackId="staff" fill={LICENSE_COLOR} isAnimationActive={false} />
                            <Bar dataKey="mechanicExtra" name="Mechanic (รวมคู่ License)" stackId="staff" fill={MECHANIC_COLOR} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Flight capacity estimation */}
            <Card className="overflow-hidden p-5">
                <h2 className="mb-3 text-sm font-bold text-[#075CA2] dark:text-sky-300">
                    จำนวนเที่ยวบินต่อวันที่ทีมปัจจุบันรับได้ (ประมาณ)
                </h2>
                <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full border-collapse">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className={th}></th>
                                <th className={cn(th, 'text-right')}>ตารางบินตอนนี้ (เฉลี่ย/วัน)</th>
                                <th className={cn(th, 'text-right')}>สูงสุด/วัน</th>
                                <th className={cn(th, 'text-right')}>รับได้ (ประมาณ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CAPACITY_ROWS.map((r, i) => (
                                <tr
                                    key={r.label}
                                    className={cn(
                                        'border-t border-border transition-colors',
                                        i % 2 === 1
                                            ? 'bg-slate-50/80 hover:bg-slate-100/70 dark:bg-slate-900/40 dark:hover:bg-slate-800/60'
                                            : 'bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                    )}
                                >
                                    <td className={cn(td, 'font-medium text-foreground')}>{r.label}</td>
                                    <td className={cn(td, 'text-right tabular-nums')}>{r.avgPerDay}</td>
                                    <td className={cn(td, 'text-right tabular-nums')}>{r.maxPerDay}</td>
                                    <td className={cn(td, 'text-right tabular-nums text-sm font-bold text-foreground')}>{r.capacity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    ย่อส่วนตามสัดส่วน min(License มี÷ต้องมี, Mechanic มี÷ต้องมี) = 54% สมมติว่าเที่ยวที่เหลือกระจายช่วงเวลาเหมือนเดิม
                </p>
            </Card>

            {/* License shortage banner */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-100/75 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
                <span className="font-bold text-amber-950 dark:text-amber-100">
                    เที่ยวที่ช่าง License ไม่พอ ({LICENSE_SHORT_FLIGHTS.length} แถว) —
                </span>
                <span>{LICENSE_SHORT_FLIGHTS.join(' · ')}</span>
                <button
                    type="button"
                    onClick={onViewFlights}
                    className="ml-1 cursor-pointer font-semibold underline hover:text-amber-950 dark:hover:text-amber-100"
                >
                    (ดูแท็บ &quot;เที่ยวบิน&quot;)
                </button>
            </div>

            {/* Extra shift simulations */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SimulationCard title="กะเสริม (8:00–20:00): ลองจำนวนคนต่อวัน — License" rows={LICENSE_SIMULATION} />
                <SimulationCard title="กะเสริม (8:00–20:00): ลองจำนวนคนต่อวัน — Mechanic" rows={MECHANIC_SIMULATION} />
            </div>
        </div>
    );
}
