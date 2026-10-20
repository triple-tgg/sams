'use client';

import { useState, type ReactNode } from 'react';
import { CheckCircle2, Plus, RotateCcw, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DEFAULT_MANPOWER_PARAMS, reliefFactor, staffPerPosition, type ManpowerParams } from '@/lib/roster/manpower';

// ── Settings rules (beyond ManpowerParams) ──────────────────────────────────

export type StaffKind = 'License' | 'Mechanic';

export interface MainShift {
    id: number;
    name: string;
    /** Hours; end > 24 means past midnight (31 = 07:00 next day). */
    start: number;
    end: number;
}

export interface JobType {
    id: number;
    name: string;
    staffKind: StaffKind;
    priority: number;
}

export interface SettingsRules {
    mainShifts: MainShift[];
    extraShift: {
        enabled: boolean;
        name: string;
        start: number;
        end: number;
        licensePerDay: number;
        mechanicPerDay: number;
    };
    /** Level 2 rule switches */
    mechanicPairsLicense: boolean;
    ratingOnlyWithoutAuth: boolean;
    countTraineeAsMechanic: boolean;
    jobTypes: JobType[];
    /** Level 3 rules */
    noEarlyAfterNight: boolean;
    minRestHours: number;
    maxJobsPerDay: number;
}

export const DEFAULT_SETTINGS_RULES: SettingsRules = {
    mainShifts: [
        { id: 1, name: 'เช้า', start: 6, end: 19 },
        { id: 2, name: 'ดึก', start: 18, end: 31 },
    ],
    extraShift: { enabled: false, name: 'กะเสริม', start: 8, end: 20, licensePerDay: 0, mechanicPerDay: 0 },
    mechanicPairsLicense: true,
    ratingOnlyWithoutAuth: true,
    countTraineeAsMechanic: false,
    jobTypes: [
        { id: 1, name: 'Full CRS', staffKind: 'License', priority: 1 },
        { id: 2, name: 'STBY', staffKind: 'License', priority: 2 },
        { id: 3, name: 'On call', staffKind: 'Mechanic', priority: 5 },
        { id: 4, name: 'Marshalling', staffKind: 'Mechanic', priority: 3 },
        { id: 5, name: 'Towing', staffKind: 'Mechanic', priority: 3 },
        { id: 6, name: 'Mechanic assistance', staffKind: 'Mechanic', priority: 4 },
    ],
    noEarlyAfterNight: true,
    minRestHours: 11,
    maxJobsPerDay: 0,
};

const nextId = (items: { id: number }[]) => items.reduce((m, i) => Math.max(m, i.id), 0) + 1;

const toNumber = (raw: string) => {
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : null;
};

// ── UI helpers ──────────────────────────────────────────────────────────────

const inputCls =
    'h-9 rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20';

function Section({ level, title, children }: { level: 1 | 2 | 3; title: string; children: ReactNode }) {
    return (
        <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#075CA2] dark:text-sky-300">
                <span className="rounded-md bg-[#2B4A75] px-2 py-0.5 text-[11px] font-bold text-white">ระดับ {level}</span>
                {title}
            </h2>
            <div className="space-y-3">{children}</div>
        </Card>
    );
}

function SubHeading({ children }: { children: ReactNode }) {
    return <h3 className="pt-2 text-sm font-bold text-[#075CA2] dark:text-sky-300">{children}</h3>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm text-muted-foreground">{label}</span>
            <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => {
                    const v = toNumber(e.target.value);
                    if (v !== null) onChange(v);
                }}
                className={cn(inputCls, 'w-24 tabular-nums')}
            />
        </label>
    );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-start gap-3 border-b border-dashed border-border pb-3 last:border-b-0">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-border text-[#075CA2] focus:ring-[#075CA2]"
            />
            <span>
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
            </span>
        </label>
    );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
            ลบ
        </button>
    );
}

function shiftInfo(s: MainShift) {
    const hours = Math.max(0, s.end - s.start);
    return `${hours} ชม. · พัก ${hours > 10 ? 2 : 1} ครั้ง`;
}

// ── Settings tab ────────────────────────────────────────────────────────────

export function SettingsTab({
    params,
    onParamsChange,
    rules,
    onRulesChange,
}: {
    params: ManpowerParams;
    onParamsChange: (next: ManpowerParams) => void;
    rules: SettingsRules;
    onRulesChange: (next: SettingsRules) => void;
}) {
    const [savedAlert, setSavedAlert] = useState(false);
    const [newJobName, setNewJobName] = useState('');

    const setParam = <K extends keyof ManpowerParams>(key: K, value: ManpowerParams[K]) => onParamsChange({ ...params, [key]: value });
    const setRule = <K extends keyof SettingsRules>(key: K, value: SettingsRules[K]) => onRulesChange({ ...rules, [key]: value });
    const setExtra = (patch: Partial<SettingsRules['extraShift']>) => setRule('extraShift', { ...rules.extraShift, ...patch });

    const updateShift = (id: number, patch: Partial<MainShift>) =>
        setRule('mainShifts', rules.mainShifts.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const addShift = () =>
        setRule('mainShifts', [...rules.mainShifts, { id: nextId(rules.mainShifts), name: `กะที่ ${rules.mainShifts.length + 1}`, start: 0, end: 12 }]);

    const updateJob = (id: number, patch: Partial<JobType>) =>
        setRule('jobTypes', rules.jobTypes.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    const addJob = () => {
        const name = newJobName.trim();
        if (!name) return;
        const maxPriority = rules.jobTypes.reduce((m, j) => Math.max(m, j.priority), 0);
        setRule('jobTypes', [...rules.jobTypes, { id: nextId(rules.jobTypes), name, staffKind: 'Mechanic', priority: maxPriority + 1 }]);
        setNewJobName('');
    };

    const handleReset = () => {
        onParamsChange(DEFAULT_MANPOWER_PARAMS);
        onRulesChange(DEFAULT_SETTINGS_RULES);
    };

    const handleSave = () => {
        setSavedAlert(true);
        setTimeout(() => setSavedAlert(false), 3000);
    };

    const multiplier = staffPerPosition(params) * reliefFactor(params);

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                    <h2 className="text-base font-semibold text-foreground">การตั้งค่ากฎคำนวณกำลังคน (Manpower Rules)</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        ตัวคูณปัจจุบัน ×{multiplier.toFixed(2)} (roster ×{staffPerPosition(params).toFixed(2)} · relief ×{reliefFactor(params).toFixed(3)})
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        คืนค่าเริ่มต้น (Reset Defaults)
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#075CA2] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#064B85]"
                    >
                        <Save className="h-3.5 w-3.5" />
                        บันทึกการตั้งค่า
                    </button>
                </div>
            </Card>

            {savedAlert && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Settings saved successfully.
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {/* ── Level 1: working time & shifts ── */}
                <Section level={1} title="เวลาทำงานและกะ">
                    <NumberField label="รับเครื่อง (นาที)" value={params.receiveMinutes} onChange={(v) => setParam('receiveMinutes', v)} />
                    <NumberField label="ปล่อยเครื่อง (นาที)" value={params.releaseMinutes} onChange={(v) => setParam('releaseMinutes', v)} />
                    <NumberField label="Buffer เดินระหว่างหลุม (นาที)" value={params.bufferMinutes} onChange={(v) => setParam('bufferMinutes', v)} />
                    <NumberField label="เกณฑ์จอดนอน เริ่ม (ชม.)" value={params.nightWindowStartHour} onChange={(v) => setParam('nightWindowStartHour', v)} />
                    <NumberField label="เกณฑ์จอดนอน จบ (ชม.)" value={params.nightWindowEndHour} onChange={(v) => setParam('nightWindowEndHour', v)} />

                    <SubHeading>กะหลัก (เวลาเป็นชั่วโมง; จบเกิน 24 = ข้ามเที่ยงคืน เช่น 31 = 07:00)</SubHeading>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-muted/40">
                                <tr className="text-left">
                                    <th className="px-2 py-2 font-semibold">ชื่อกะ</th>
                                    <th className="px-2 py-2 font-semibold">เริ่ม</th>
                                    <th className="px-2 py-2 font-semibold">จบ</th>
                                    <th className="px-2 py-2 font-semibold">ชั่วโมง/พัก</th>
                                    <th className="px-2 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rules.mainShifts.map((s) => (
                                    <tr key={s.id} className="border-t border-border">
                                        <td className="px-2 py-2">
                                            <input value={s.name} onChange={(e) => updateShift(s.id, { name: e.target.value })} className={cn(inputCls, 'w-24')} />
                                        </td>
                                        {(['start', 'end'] as const).map((k) => (
                                            <td key={k} className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={48}
                                                    value={s[k]}
                                                    onChange={(e) => {
                                                        const v = toNumber(e.target.value);
                                                        if (v !== null) updateShift(s.id, { [k]: v });
                                                    }}
                                                    className={cn(inputCls, 'w-16 tabular-nums')}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-2 py-2 text-xs text-muted-foreground">{shiftInfo(s)}</td>
                                        <td className="px-2 py-2 text-right">
                                            <DeleteButton onClick={() => setRule('mainShifts', rules.mainShifts.filter((x) => x.id !== s.id))} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        type="button"
                        onClick={addShift}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        เพิ่มกะหลัก (กะที่ {rules.mainShifts.length + 1})
                    </button>
                    <p className="text-xs text-muted-foreground">
                        งานแต่ละช่วงเป็นของกะที่เริ่มล่าสุดก่อนเวลานั้น (เหมือนโมเดล Excel) กะที่เกิน 10 ชม. ต้องพัก 2 ครั้ง
                    </p>
                </Section>

                {/* ── Level 1: extra shift + roster pattern ── */}
                <Section level={1} title="กะเสริม (ซัพพอตช่วงพีค)">
                    <Toggle
                        label="เปิดใช้กะเสริม"
                        desc="คนกะเสริมช่วยลดตำแหน่งที่ต้องมีในกะหลัก ช่วงที่เวลาตรงกับกะเสริม"
                        checked={rules.extraShift.enabled}
                        onChange={(v) => setExtra({ enabled: v })}
                    />
                    <fieldset disabled={!rules.extraShift.enabled} className="space-y-3 disabled:opacity-60">
                        <label className="block">
                            <span className="mb-1 block text-sm text-muted-foreground">ชื่อกะ</span>
                            <input value={rules.extraShift.name} onChange={(e) => setExtra({ name: e.target.value })} className={cn(inputCls, 'w-full')} />
                        </label>
                        <NumberField label="เริ่ม (ชม.)" value={rules.extraShift.start} onChange={(v) => setExtra({ start: v })} />
                        <NumberField label="จบ (ชม.)" value={rules.extraShift.end} onChange={(v) => setExtra({ end: v })} />
                        <NumberField label="License ต่อวัน (คน)" value={rules.extraShift.licensePerDay} onChange={(v) => setExtra({ licensePerDay: v })} />
                        <NumberField label="Mechanic ต่อวัน (คน)" value={rules.extraShift.mechanicPerDay} onChange={(v) => setExtra({ mechanicPerDay: v })} />
                    </fieldset>
                    <p className="text-xs text-muted-foreground">ดูตัวเลขคุ้มที่สุดได้ที่ตาราง &quot;ลองกะเสริม&quot; ในแท็บสรุป</p>

                    <SubHeading>รูปแบบเข้างานและวันลา</SubHeading>
                    <NumberField label="ทำงานติดกัน (วัน)" value={params.workDays} onChange={(v) => setParam('workDays', v)} />
                    <NumberField label="หยุดติดกัน (วัน)" value={params.offDays} onChange={(v) => setParam('offDays', v)} />
                    <NumberField label="ลาพักร้อน (วัน/ปี)" value={params.annualLeaveDays} onChange={(v) => setParam('annualLeaveDays', v)} />
                    <NumberField label="ลาป่วย (วัน/ปี)" value={params.sickLeaveDays} onChange={(v) => setParam('sickLeaveDays', v)} />
                    <NumberField label="เทรนนิ่ง (วัน/ปี)" value={params.trainingDays} onChange={(v) => setParam('trainingDays', v)} />
                </Section>

                {/* ── Level 1: flight scope ── */}
                <Section level={1} title="ขอบเขตเที่ยวบิน">
                    <Toggle
                        label="นับเที่ยวบิน Planning ด้วย"
                        desc="ปิด = นับเฉพาะ Current · เปิด = รวม Planning (สลับได้ที่หัวหน้าจอเช่นกัน)"
                        checked={params.includePlanning}
                        onChange={(v) => setParam('includePlanning', v)}
                    />
                </Section>

                {/* ── Level 2: rule switches ── */}
                <Section level={2} title="สวิตช์กติกา">
                    <Toggle
                        label="Mechanic ต้องไปคู่ License ทุกไฟล์ท Full CRS/STBY"
                        desc="เปิด = นับ Mechanic เพิ่มตามจำนวนงาน License ที่ทำพร้อมกัน"
                        checked={rules.mechanicPairsLicense}
                        onChange={(v) => setRule('mechanicPairsLicense', v)}
                    />
                    <Toggle
                        label="สายการบินที่ไม่มี authorization → ตรวจเฉพาะ rating"
                        desc="ปิด = เที่ยวที่ไม่มี Airline key ใช้ Mechanic แทน (กฎเดิม)"
                        checked={rules.ratingOnlyWithoutAuth}
                        onChange={(v) => setRule('ratingOnlyWithoutAuth', v)}
                    />
                    <Toggle
                        label="นับ Trainee / Technician Assistant เป็น Mechanic"
                        desc="ปิด = ไม่นับในจำนวน Mechanic ที่มีอยู่"
                        checked={rules.countTraineeAsMechanic}
                        onChange={(v) => setRule('countTraineeAsMechanic', v)}
                    />
                </Section>

                {/* ── Level 2: job types ── */}
                <Section level={2} title="ตารางประเภทงาน">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-muted/40">
                                <tr className="text-left">
                                    <th className="px-2 py-2 font-semibold">ประเภทงาน</th>
                                    <th className="px-2 py-2 font-semibold">ใช้ช่าง</th>
                                    <th className="px-2 py-2 font-semibold">ลำดับความสำคัญ</th>
                                    <th className="px-2 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rules.jobTypes.map((j) => (
                                    <tr key={j.id} className="border-t border-border">
                                        <td className="px-2 py-2 text-foreground">{j.name}</td>
                                        <td className="px-2 py-2">
                                            <select
                                                value={j.staffKind}
                                                onChange={(e) => updateJob(j.id, { staffKind: e.target.value as StaffKind })}
                                                className={cn(inputCls, 'w-32')}
                                            >
                                                <option value="License">License</option>
                                                <option value="Mechanic">Mechanic</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={j.priority}
                                                onChange={(e) => {
                                                    const v = toNumber(e.target.value);
                                                    if (v !== null && v >= 1) updateJob(j.id, { priority: v });
                                                }}
                                                className={cn(inputCls, 'w-20 tabular-nums')}
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <DeleteButton onClick={() => setRule('jobTypes', rules.jobTypes.filter((x) => x.id !== j.id))} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newJobName}
                            onChange={(e) => setNewJobName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addJob()}
                            placeholder="ชื่อประเภทงานใหม่"
                            className={cn(inputCls, 'flex-1')}
                        />
                        <button
                            type="button"
                            onClick={addJob}
                            disabled={!newJobName.trim()}
                            className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            เพิ่ม
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ลำดับความสำคัญใช้ตอนจัดงาน: ถ้าช่างไม่พอ ระบบละเว้นเที่ยวเลขมากก่อน (Planning ถูกละเว้นก่อนเสมอ)
                    </p>
                </Section>

                {/* ── Level 3: additional rules ── */}
                <Section level={3} title="กติกาเพิ่มเติม">
                    <Toggle
                        label="ห้ามจัดช่างที่ทำกะดึกเมื่อคืนมาทำกะเช้า"
                        desc="ช่างที่กะดึกคืนก่อนข้ามเที่ยงคืน จะไม่ถูกจัดกะที่เริ่มเร็วกว่า (เวลาเลิกกะดึก + เวลาพักขั้นต่ำ)"
                        checked={rules.noEarlyAfterNight}
                        onChange={(v) => setRule('noEarlyAfterNight', v)}
                    />
                    <NumberField label="เวลาพักขั้นต่ำระหว่างกะ (ชม.)" value={rules.minRestHours} onChange={(v) => setRule('minRestHours', v)} />
                    <NumberField label="งานสูงสุดต่อคนต่อวัน (0 = ไม่จำกัด)" value={rules.maxJobsPerDay} onChange={(v) => setRule('maxJobsPerDay', v)} />
                    <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        ถ้าช่างไม่พอ → ละเว้นเที่ยวก่อน (เรียงตามลำดับความสำคัญ) ไม่ฝืนจัดช่างซ้อนเวลา ดูผลที่แท็บ &quot;จัดเวร/จัดงาน&quot;
                    </div>
                </Section>
            </div>
        </div>
    );
}
