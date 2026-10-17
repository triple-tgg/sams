'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import '@/lib/dayjs';
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CalendarCheck2,
    CalendarDays,
    CheckCircle,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    Filter,
    HelpCircle,
    Info,
    Plane,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    Wrench,
    XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getWeekStart } from '@/components/flight-timeline/utils';
import { DEFAULT_ROSTER_STATION, useRosterFlights, useRosterStaff } from '@/lib/roster/useRosterData';
import {
    analyzeManpower,
    DEFAULT_MANPOWER_PARAMS,
    holdsLicenceFor,
    hasAirlineAuth,
    isValidCertifyingStaff,
    type RosterStaff,
} from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect, WeekNav, td, th } from '../../components/RosterUi';

type TabKey = 'duty' | 'frms';
type ShiftType = 'D' | 'N' | 'O' | 'L' | 'T';

interface ShiftConfig {
    code: ShiftType;
    label: string;
    hours: number;
    start: string;
    end: string;
    color: string;
    badgeClass: string;
    desc: string;
}

const SHIFT_TYPES: Record<ShiftType, ShiftConfig> = {
    D: {
        code: 'D',
        label: 'Day Shift',
        hours: 12,
        start: '06:00',
        end: '18:00',
        color: 'sky',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
        desc: 'กะกลางวัน (06:00 - 18:00)',
    },
    N: {
        code: 'N',
        label: 'Night Shift',
        hours: 12,
        start: '18:00',
        end: '06:00',
        color: 'indigo',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
        desc: 'กะกลางคืน (18:00 - 06:00)',
    },
    O: {
        code: 'O',
        label: 'Off Day',
        hours: 0,
        start: '-',
        end: '-',
        color: 'slate',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        desc: 'วันหยุดพักผ่อนประจำสัปดาห์',
    },
    L: {
        code: 'L',
        label: 'Leave',
        hours: 0,
        start: '-',
        end: '-',
        color: 'amber',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
        desc: 'วันลา (พักร้อน/ลาป่วย/ลากิจ)',
    },
    T: {
        code: 'T',
        label: 'Training',
        hours: 8,
        start: '08:30',
        end: '17:00',
        color: 'emerald',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
        desc: 'อบรมตามรอบ (Recurrent Training)',
    },
};

const NEXT_SHIFT_CYCLE: Record<ShiftType, ShiftType> = {
    D: 'N',
    N: 'O',
    O: 'L',
    L: 'T',
    T: 'D',
};

interface FrmsViolation {
    id: string;
    staffId: number;
    staffName: string;
    employeeId: string;
    ruleCode: 'CONSECUTIVE_DAYS' | 'MIN_REST' | 'NIGHT_FATIGUE' | 'WEEKLY_HOURS';
    ruleTitle: string;
    severity: 'violation' | 'warning';
    dayIndex: number;
    dateLabel: string;
    description: string;
    recommendation: string;
}

export default function ManpowerSchedulingPage() {
    const [stationCode, setStationCode] = useState(DEFAULT_ROSTER_STATION);
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [activeTab, setActiveTab] = useState<TabKey>('duty');

    // Selected day for task / flight assignment (0-6)
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    // Shifts state: map staffId -> [ShiftType * 7]
    const [shiftsByStaff, setShiftsByStaff] = useState<Record<number, ShiftType[]>>({});

    // Task / Flight assignments: map flightKey -> staffId[]
    const [flightAssignments, setFlightAssignments] = useState<Record<string, number[]>>({});

    // Filters for shift grid & FRMS
    const [searchStaff, setSearchStaff] = useState('');
    const [frmsSeverityFilter, setFrmsSeverityFilter] = useState<'all' | 'violation' | 'warning'>('all');

    const { staff, stations, authAirlineIds, isLoading: staffLoading } = useRosterStaff();
    const { flights, isLoading: flightsLoading } = useRosterFlights(stationCode, weekStart);

    const stationStaff = useMemo(() => staff.filter((s) => s.stationCode === stationCode), [staff, stationCode]);
    const analysis = useMemo(
        () => analyzeManpower(flights, stationStaff, authAirlineIds, weekStart, 7, DEFAULT_MANPOWER_PARAMS),
        [flights, stationStaff, authAirlineIds, weekStart]
    );

    // Initialize shift roster with a balanced default pattern (3-on/3-off staggered)
    useMemo(() => {
        setShiftsByStaff((prev) => {
            const next: Record<number, ShiftType[]> = { ...prev };
            stationStaff.forEach((s, idx) => {
                if (!next[s.staffId]) {
                    // Stagger shift pattern based on staff index
                    const pattern: ShiftType[] = [];
                    for (let day = 0; day < 7; day++) {
                        const phase = (idx * 2 + day) % 6;
                        if (phase === 0 || phase === 1) pattern.push('D');
                        else if (phase === 2 || phase === 3) pattern.push('N');
                        else pattern.push('O');
                    }
                    next[s.staffId] = pattern;
                }
            });
            return next;
        });
    }, [stationStaff]);

    const handleCycleShift = (staffId: number, dayIndex: number) => {
        setShiftsByStaff((prev) => {
            const currentList = prev[staffId] || ['O', 'O', 'O', 'O', 'O', 'O', 'O'];
            const currentShift = currentList[dayIndex] || 'O';
            const nextShift = NEXT_SHIFT_CYCLE[currentShift];
            const updated = [...currentList];
            updated[dayIndex] = nextShift;
            return { ...prev, [staffId]: updated };
        });
    };

    const handleAutoGenerate = (patternType: '3-3' | '4-2') => {
        const next: Record<number, ShiftType[]> = {};
        stationStaff.forEach((s, idx) => {
            const pattern: ShiftType[] = [];
            const cycleLen = patternType === '3-3' ? 6 : 6;
            for (let day = 0; day < 7; day++) {
                if (patternType === '3-3') {
                    const phase = (idx * 2 + day) % 6;
                    if (phase === 0 || phase === 1) pattern.push('D');
                    else if (phase === 2) pattern.push('N');
                    else pattern.push('O');
                } else {
                    const phase = (idx * 2 + day) % 6;
                    if (phase === 0 || phase === 1) pattern.push('D');
                    else if (phase === 2 || phase === 3) pattern.push('N');
                    else pattern.push('O');
                }
            }
            next[s.staffId] = pattern;
        });
        setShiftsByStaff(next);
    };

    const handleResetAllOff = () => {
        const next: Record<number, ShiftType[]> = {};
        stationStaff.forEach((s) => {
            next[s.staffId] = ['O', 'O', 'O', 'O', 'O', 'O', 'O'];
        });
        setShiftsByStaff(next);
    };

    // Calculate shift counts per day
    const dailyCoverage = useMemo(() => {
        return Array.from({ length: 7 }, (_, dayIndex) => {
            let dayCount = 0;
            let nightCount = 0;
            let offCount = 0;
            stationStaff.forEach((s) => {
                const shift = shiftsByStaff[s.staffId]?.[dayIndex] || 'O';
                if (shift === 'D') dayCount++;
                else if (shift === 'N') nightCount++;
                else if (shift === 'O') offCount++;
            });
            const peak = analysis.overall.peaks[dayIndex] || { day: 0, night: 0 };
            return {
                dayCount,
                nightCount,
                offCount,
                requiredDay: peak.day,
                requiredNight: peak.night,
                dayDeficit: Math.max(0, peak.day - dayCount),
                nightDeficit: Math.max(0, peak.night - nightCount),
            };
        });
    }, [stationStaff, shiftsByStaff, analysis.overall.peaks]);

    // FRMS Compliance Engine: Check Aviation Labor / Fatigue rules
    const frmsAudits = useMemo(() => {
        const violations: FrmsViolation[] = [];

        stationStaff.forEach((s) => {
            const staffShifts = shiftsByStaff[s.staffId] || ['O', 'O', 'O', 'O', 'O', 'O', 'O'];

            // 1. Check Consecutive Work Days (Max 6 days in a row)
            let consecutiveDays = 0;
            for (let d = 0; d < 7; d++) {
                const shift = staffShifts[d];
                if (shift === 'D' || shift === 'N' || shift === 'T') {
                    consecutiveDays++;
                    if (consecutiveDays > 6) {
                        violations.push({
                            id: `${s.staffId}-consec-${d}`,
                            staffId: s.staffId,
                            staffName: s.name,
                            employeeId: s.employeeId,
                            ruleCode: 'CONSECUTIVE_DAYS',
                            ruleTitle: 'ทำงานติดต่อกันเกิน 6 วัน (Max 6 Consecutive Days)',
                            severity: 'violation',
                            dayIndex: d,
                            dateLabel: dayjs(weekStart).add(d, 'day').format('ddd DD MMM'),
                            description: `พนักงานทำงานต่อเนื่องครบ ${consecutiveDays} วันโดยไม่มีวันหยุดพักผ่อนประจำสัปดาห์ (Off Day) ตามระเบียบ CAAT / ICAO`,
                            recommendation: 'ปรับเปลี่ยนเวรให้มีวันหยุดพักผ่อน (O) อย่างน้อย 24-36 ชั่วโมงต่อเนื่อง',
                        });
                    }
                } else {
                    consecutiveDays = 0;
                }
            }

            // 2. Check Minimum Rest between Shifts (Flags Night shift followed immediately by Day shift next day)
            for (let d = 0; d < 6; d++) {
                const todayShift = staffShifts[d];
                const nextDayShift = staffShifts[d + 1];

                // Night shift ends at 06:00, Day shift starts at 06:00 same morning -> 0h rest!
                if (todayShift === 'N' && nextDayShift === 'D') {
                    violations.push({
                        id: `${s.staffId}-rest-${d}`,
                        staffId: s.staffId,
                        staffName: s.name,
                        employeeId: s.employeeId,
                        ruleCode: 'MIN_REST',
                        ruleTitle: 'เวลาพักผ่อนระหว่างกะไม่ถึงเกณฑ์ (Insufficient Rest < 11h)',
                        severity: 'violation',
                        dayIndex: d + 1,
                        dateLabel: dayjs(weekStart).add(d + 1, 'day').format('ddd DD MMM'),
                        description: `เข้ากะกลางคืน (N) ในวันที่ ${dayjs(weekStart).add(d, 'day').format('DD MMM')} เลิกกะ 06:00 แล้วเข้ากะกลางวัน (D) ทันทีในวันที่ ${dayjs(weekStart).add(d + 1, 'day').format('DD MMM')} เวลาพักผ่อนไม่เพียงพอ (Quick Turnaround)`,
                        recommendation: 'ห้ามจัดกะกลางวันต่อจากกะกลางคืนทันที ต้องมีเวลาพักผ่อนขั้นต่ำ 11-12 ชั่วโมง',
                    });
                }
            }

            // 3. Check Consecutive Night Shifts (Fatigue Risk > 2 or 3 consecutive nights)
            let consecutiveNights = 0;
            for (let d = 0; d < 7; d++) {
                if (staffShifts[d] === 'N') {
                    consecutiveNights++;
                    if (consecutiveNights >= 3) {
                        violations.push({
                            id: `${s.staffId}-night-${d}`,
                            staffId: s.staffId,
                            staffName: s.name,
                            employeeId: s.employeeId,
                            ruleCode: 'NIGHT_FATIGUE',
                            ruleTitle: 'เข้ากะกลางคืนสะสมต่อเนื่อง (Night Shift Fatigue Risk)',
                            severity: consecutiveNights >= 4 ? 'violation' : 'warning',
                            dayIndex: d,
                            dateLabel: dayjs(weekStart).add(d, 'day').format('ddd DD MMM'),
                            description: `พนักงานเข้ากะกลางคืนติดต่อกันเป็นวันที่ ${consecutiveNights} ซึ่งเสี่ยงต่ออาการล้าสะสมตามหลักสรีรวิทยา (Circadian Disruption)`,
                            recommendation: 'จำกัดกะกลางคืนไม่เกิน 2-3 คืนติดต่อกัน และจัดให้มี Recovery Rest อย่างน้อย 48 ชั่วโมง',
                        });
                    }
                } else {
                    consecutiveNights = 0;
                }
            }

            // 4. Check Weekly Total Duty Hours (> 60h per week)
            let totalHours = 0;
            staffShifts.forEach((st) => {
                totalHours += SHIFT_TYPES[st].hours;
            });
            if (totalHours > 60) {
                violations.push({
                    id: `${s.staffId}-hours`,
                    staffId: s.staffId,
                    staffName: s.name,
                    employeeId: s.employeeId,
                    ruleCode: 'WEEKLY_HOURS',
                    ruleTitle: 'ชั่วโมงปฏิบัติงานรวมสัปดาห์เกินกำหนด (> 60 Hours/Week)',
                    severity: 'violation',
                    dayIndex: 6,
                    dateLabel: 'ตลอดสัปดาห์',
                    description: `ชั่วโมงการทำงานรวมสัปดาห์นี้อยู่ที่ ${totalHours} ชั่วโมง ซึ่งเกินเกณฑ์ความปลอดภัยด้านการบิน (กำหนดไม่เกิน 60 ชม./สัปดาห์)`,
                    recommendation: 'ลดจำนวนกะการทำงาน หรือจัดวันหยุด Off Day เพิ่มเติมเพื่อลดชั่วโมงงานสะสม',
                });
            } else if (totalHours > 48) {
                violations.push({
                    id: `${s.staffId}-hours-warn`,
                    staffId: s.staffId,
                    staffName: s.name,
                    employeeId: s.employeeId,
                    ruleCode: 'WEEKLY_HOURS',
                    ruleTitle: 'ชั่วโมงปฏิบัติงานเริ่มเข้าใกล้ขีดจำกัด (48 - 60 Hours)',
                    severity: 'warning',
                    dayIndex: 6,
                    dateLabel: 'ตลอดสัปดาห์',
                    description: `ชั่วโมงการทำงานรวมสัปดาห์นี้อยู่ที่ ${totalHours} ชั่วโมง ควรระวังการมอบหมายงานล่วงเวลา (Overtime) เพิ่มเติม`,
                    recommendation: 'ติดตามความพร้อมในการปฏิบัติงานและหลีกเลี่ยงการจัดเวรล่วงเวลาซ้ำซ้อน',
                });
            }
        });

        return violations;
    }, [stationStaff, shiftsByStaff, weekStart]);

    const violationCount = frmsAudits.filter((a) => a.severity === 'violation').length;
    const warningCount = frmsAudits.filter((a) => a.severity === 'warning').length;
    const compliantCount = Math.max(0, stationStaff.length - new Set(frmsAudits.map((a) => a.staffId)).size);
    const complianceRate = stationStaff.length > 0 ? Math.round((compliantCount / stationStaff.length) * 100) : 100;

    // Filtered staff for Shift Grid
    const filteredStaff = useMemo(() => {
        if (!searchStaff) return stationStaff;
        const q = searchStaff.toLowerCase();
        return stationStaff.filter((s) => s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q));
    }, [stationStaff, searchStaff]);

    // Flights on the selected day
    const selectedDayFlights = useMemo(() => {
        return flights.filter((f) => {
            const diff = dayjs(f.start).diff(dayjs(weekStart).startOf('day'), 'day');
            return diff === selectedDayIndex;
        });
    }, [flights, weekStart, selectedDayIndex]);

    // Staff on duty on the selected day
    const onDutyStaffSelectedDay = useMemo(() => {
        return stationStaff.filter((s) => {
            const shift = shiftsByStaff[s.staffId]?.[selectedDayIndex];
            return shift === 'D' || shift === 'N';
        });
    }, [stationStaff, shiftsByStaff, selectedDayIndex]);

    return (
        <div className="space-y-4">
            {/* ── Top Header ── */}
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<CalendarDays className="h-5 w-5" />}
                    title="จัดตารางเข้างาน (Shift Scheduling & FRMS)"
                    subtitle={`สถานี ${stationCode} • จัดเวรเข้างาน มอบหมายงานช่าง และตรวจสอบความปลอดภัยตามกฎหมายการบิน`}
                >
                    <StationSelect stations={stations} value={stationCode} onChange={setStationCode} />
                    <WeekNav weekStart={weekStart} onChange={setWeekStart} />
                </RosterHeader>

                {/* ── Tabs Bar ── */}
                <div className="border-b border-border bg-card px-5 pt-2">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
                        <TabsList className="h-auto bg-transparent p-0 gap-6 border-b-0">
                            <TabsTrigger
                                value="duty"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                <CalendarCheck2 className="h-4 w-4" />
                                จัดเวร/จัดงาน (Duty Roster)
                                <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-bold text-primary">
                                    {stationStaff.length} ช่าง
                                </span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="frms"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                ตรวจกฎหมาย/FRMS (Compliance)
                                {violationCount > 0 ? (
                                    <span className="rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.2 text-[10px] font-bold">
                                        {violationCount} ผิดกฎ
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.2 text-[10px] font-bold">
                                        {complianceRate}% ผ่านเกณฑ์
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 1: จัดเวร/จัดงาน (Duty Roster)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'duty' && (
                <div className="space-y-4">
                    {/* Shift Controls & Legend Bar */}
                    <Card className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-semibold text-muted-foreground">สัญลักษณ์กะเวร:</span>
                                {Object.values(SHIFT_TYPES).map((st) => (
                                    <div key={st.code} className="flex items-center gap-1.5 text-xs">
                                        <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded border font-bold text-[11px]', st.badgeClass)}>
                                            {st.code}
                                        </span>
                                        <span className="text-muted-foreground">{st.label} ({st.hours}h)</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleAutoGenerate('3-3')}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#075CA2]/30 bg-[#075CA2]/10 px-3 text-xs font-semibold text-[#075CA2] hover:bg-[#075CA2]/20 transition-colors"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    จัดเวรอัตโนมัติ (Pattern 3-On/3-Off)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetAllOff}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    ล้างเวรทั้งหมด
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Shift Scheduling Grid */}
                    <Card className="overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-muted/20">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อ หรือรหัสช่าง..."
                                    value={searchStaff}
                                    onChange={(e) => setSearchStaff(e.target.value)}
                                    className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                />
                            </div>
                            <div className="text-xs text-muted-foreground">
                                คลิกที่ช่องวันเพื่อเปลี่ยนกะเวรหมุนเวียน (D ➔ N ➔ O ➔ L ➔ T)
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] border-collapse">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className={cn(th, 'w-[220px]')}>ชื่อช่าง / รหัสพนักงาน</th>
                                        <th className={cn(th, 'w-[140px]')}>Type License</th>
                                        {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                                            const dayDate = dayjs(weekStart).add(d, 'day');
                                            const isSelected = selectedDayIndex === d;
                                            return (
                                                <th
                                                    key={d}
                                                    onClick={() => setSelectedDayIndex(d)}
                                                    className={cn(
                                                        th,
                                                        'text-center cursor-pointer hover:bg-muted/60 transition-colors',
                                                        isSelected && 'bg-blue-50/80 dark:bg-blue-950/40 border-b-2 border-b-[#075CA2]'
                                                    )}
                                                >
                                                    <div className="font-bold text-foreground">{dayDate.format('dddd')}</div>
                                                    <div className="text-[10px] text-muted-foreground">{dayDate.format('DD MMM')}</div>
                                                </th>
                                            );
                                        })}
                                        <th className={cn(th, 'text-right')}>ชม./สัปดาห์</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStaff.map((s) => {
                                        const staffShifts = shiftsByStaff[s.staffId] || ['O', 'O', 'O', 'O', 'O', 'O', 'O'];
                                        let weeklyHours = 0;
                                        staffShifts.forEach((sh) => {
                                            weeklyHours += SHIFT_TYPES[sh]?.hours || 0;
                                        });

                                        return (
                                            <tr key={s.staffId} className="border-t border-border hover:bg-muted/20 transition-colors">
                                                <td className={td}>
                                                    <div className="font-semibold text-foreground text-sm">{s.name}</div>
                                                    <div className="font-mono text-xs text-muted-foreground">{s.employeeId}</div>
                                                </td>
                                                <td className={td}>
                                                    <div className="flex flex-wrap gap-1 max-w-[130px]">
                                                        {s.licences.slice(0, 2).map((l, i) => (
                                                            <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium">
                                                                {l.familyCode}
                                                            </span>
                                                        ))}
                                                        {s.licences.length > 2 && (
                                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                                                +{s.licences.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 7 Days Shifts */}
                                                {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                                                    const shiftCode = staffShifts[d] || 'O';
                                                    const shiftMeta = SHIFT_TYPES[shiftCode];
                                                    const isSelected = selectedDayIndex === d;

                                                    return (
                                                        <td
                                                            key={d}
                                                            className={cn(
                                                                'p-2 text-center align-middle',
                                                                isSelected && 'bg-blue-50/30 dark:bg-blue-950/20'
                                                            )}
                                                        >
                                                            <button
                                                                type="button"
                                                                title={`คลิกเปลี่ยนกะ (ปัจจุบัน: ${shiftMeta.label})`}
                                                                onClick={() => handleCycleShift(s.staffId, d)}
                                                                className={cn(
                                                                    'h-9 w-11 rounded-md border font-mono text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95',
                                                                    shiftMeta.badgeClass
                                                                )}
                                                            >
                                                                {shiftCode}
                                                            </button>
                                                        </td>
                                                    );
                                                })}

                                                <td className={cn(td, 'text-right font-mono text-sm font-semibold tabular-nums')}>
                                                    <span className={cn(weeklyHours > 60 ? 'text-red-600 dark:text-red-400 font-bold' : weeklyHours > 48 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
                                                        {weeklyHours}h
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                {/* Bottom Coverage Summary Row */}
                                <tfoot className="bg-muted/30 border-t-2 border-border font-semibold text-xs">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-3 font-bold text-foreground">
                                            สรุปยอดช่างเข้ากะรายวัน (Scheduled vs Required):
                                        </td>
                                        {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                                            const cov = dailyCoverage[d];
                                            const dayOk = cov.dayDeficit === 0;
                                            const nightOk = cov.nightDeficit === 0;

                                            return (
                                                <td key={d} className="p-2 text-center align-top">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className="font-bold text-sky-600 dark:text-sky-400">D: {cov.dayCount}</span>
                                                            <span className="text-muted-foreground text-[10px]">/ {cov.requiredDay}</span>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">N: {cov.nightCount}</span>
                                                            <span className="text-muted-foreground text-[10px]">/ {cov.requiredNight}</span>
                                                        </div>
                                                        <div>
                                                            {dayOk && nightOk ? (
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ พอดี</span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                                                                    ขาด {cov.dayDeficit + cov.nightDeficit}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-3 text-right text-muted-foreground">
                                            รวมทั้งสถานี
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>

                    {/* Task & Flight Assignment on Selected Day */}
                    <Card className="overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-muted/20">
                            <div className="flex items-center gap-2">
                                <Plane className="h-4 w-4 text-[#075CA2]" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    มอบหมายงานเที่ยวบินประจำวัน: {dayjs(weekStart).add(selectedDayIndex, 'day').format('dddd, DD MMMM YYYY')}
                                </h3>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                ช่างปฏิบัติหน้าที่วันนี้: <b className="text-foreground">{onDutyStaffSelectedDay.length}</b> คน ({onDutyStaffSelectedDay.filter((s) => shiftsByStaff[s.staffId]?.[selectedDayIndex] === 'D').length} Day / {onDutyStaffSelectedDay.filter((s) => shiftsByStaff[s.staffId]?.[selectedDayIndex] === 'N').length} Night)
                            </div>
                        </div>

                        {selectedDayFlights.length === 0 ? (
                            <EmptyBlock>ไม่มีเที่ยวบินในวันนี้</EmptyBlock>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[880px] border-collapse">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className={th}>เที่ยวบิน</th>
                                            <th className={th}>สายการบิน</th>
                                            <th className={th}>Type / Engine</th>
                                            <th className={th}>เวลา Ground Time</th>
                                            <th className={th}>กะการทำงาน</th>
                                            <th className={th}>ช่างที่ขึ้นเวรและมีสิทธิ์</th>
                                            <th className={th}>มอบหมายผู้รับผิดชอบ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedDayFlights.map((f) => {
                                            const hour = dayjs(f.start).hour();
                                            const isDay = hour >= 6 && hour < 18;
                                            const dutyShiftCode: ShiftType = isDay ? 'D' : 'N';

                                            // Staff on this duty shift with licence
                                            const eligibleOnDuty = onDutyStaffSelectedDay.filter((s) => {
                                                const staffShift = shiftsByStaff[s.staffId]?.[selectedDayIndex];
                                                if (staffShift !== dutyShiftCode) return false;
                                                return holdsLicenceFor(s, f.familyCode, f.engineCode);
                                            });

                                            return (
                                                <tr key={f.key} className="border-t border-border hover:bg-muted/20">
                                                    <td className={cn(td, 'font-mono text-xs font-bold text-[#075CA2]')}>
                                                        {f.label}
                                                    </td>
                                                    <td className={td}>
                                                        <span className="font-semibold">{f.airlineCode || '—'}</span>
                                                        <span className="text-xs text-muted-foreground block">{f.airlineName}</span>
                                                    </td>
                                                    <td className={td}>
                                                        <span className="font-medium">{f.familyCode}</span>
                                                        {f.engineCode && <span className="text-xs text-muted-foreground block">{f.engineCode}</span>}
                                                    </td>
                                                    <td className={cn(td, 'font-mono text-xs')}>
                                                        {dayjs(f.start).format('HH:mm')} – {dayjs(f.end).format('HH:mm')}
                                                    </td>
                                                    <td className={td}>
                                                        <Pill tone={isDay ? 'info' : 'default'}>
                                                            {isDay ? 'Day Shift (06-18)' : 'Night Shift (18-06)'}
                                                        </Pill>
                                                    </td>
                                                    <td className={td}>
                                                        <span className={cn('text-xs font-semibold', eligibleOnDuty.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                                                            {eligibleOnDuty.length} คน พร้อมในกะ
                                                        </span>
                                                    </td>
                                                    <td className={td}>
                                                        <select
                                                            className="h-8 rounded border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#075CA2]"
                                                            defaultValue=""
                                                        >
                                                            <option value="">-- เลือกช่างรับรองเที่ยวบิน --</option>
                                                            {eligibleOnDuty.map((s) => (
                                                                <option key={s.staffId} value={s.staffId}>
                                                                    {s.name} ({s.employeeId})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 2: ตรวจกฎหมาย/FRMS (Compliance & Fatigue Check)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'frms' && (
                <div className="space-y-4">
                    {/* FRMS Overview KPI Tiles */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatTile
                            label="FRMS Compliance Rate"
                            value={`${complianceRate}%`}
                            tone={complianceRate >= 95 ? 'success' : complianceRate >= 85 ? 'warning' : 'danger'}
                            unit="อัตราความถูกต้องตามกฎหมาย"
                        />
                        <StatTile
                            label="Violations (ข้อผิดกฎ)"
                            value={violationCount}
                            tone={violationCount > 0 ? 'danger' : 'success'}
                            unit="รายการต้องแก้ไขทันที"
                        />
                        <StatTile
                            label="Warnings (ข้อควรระวัง)"
                            value={warningCount}
                            tone={warningCount > 0 ? 'warning' : 'default'}
                            unit="ความเสี่ยงต่อความล้าสะสม"
                        />
                        <StatTile
                            label="Staff Compliant"
                            value={`${compliantCount} / ${stationStaff.length}`}
                            tone="default"
                            unit="ช่างที่ตารางเวรถูกต้อง 100%"
                        />
                    </div>

                    {/* Rule Reference Info Alert */}
                    <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-[#075CA2] shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <div className="font-semibold text-[#075CA2] dark:text-sky-300">
                                    เกณฑ์การตรวจความสอดคล้องตามระเบียบกรมท่าอากาศยาน/CAAT และ Fatigue Risk Management (FRMS)
                                </div>
                                <div className="text-muted-foreground leading-relaxed">
                                    1. <b>ห้ามทำงานเกิน 6 วันติดต่อกัน:</b> ต้องมีวันพักผ่อนประจำสัปดาห์ (Rest Period) อย่างน้อย 24-36 ชั่วโมงต่อเนื่อง<br />
                                    2. <b>เวลาพักผ่อนระหว่างกะขั้นต่ำ 11 ชั่วโมง:</b> ห้ามต่อกะกลางคืน (เลิก 06:00) ด้วยกะกลางวัน (เข้า 06:00) ทันทีเด็ดขาด<br />
                                    3. <b>จำกัดกะกลางคืนต่อเนื่อง:</b> ไม่ควรเข้ากะกลางคืนเกิน 3 คืนติดต่อกันเพื่อป้องกันอาการล้าสะสมจากวงจรชีวภาพ (Circadian Rhythm)<br />
                                    4. <b>ชั่วโมงการทำงานรวมสัปดาห์:</b> ต้องไม่เกิน 60 ชั่วโมงในรอบ 7 วันติดต่อกัน
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Audit Findings Table */}
                    <Card className="overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-muted/20">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-[#075CA2]" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    ผลการตรวจสอบตารางเวร (Audit Findings Log)
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={frmsSeverityFilter}
                                    onChange={(e) => setFrmsSeverityFilter(e.target.value as any)}
                                    className="h-8 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                                >
                                    <option value="all">ระดับความเสี่ยงทั้งหมด</option>
                                    <option value="violation">เฉพาะข้อผิดกฎ (Violations)</option>
                                    <option value="warning">เฉพาะข้อควรระวัง (Warnings)</option>
                                </select>
                            </div>
                        </div>

                        {frmsAudits.length === 0 ? (
                            <div className="py-16 text-center space-y-2">
                                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                                <div className="text-base font-semibold text-foreground">ตารางเวรสมบูรณ์และถูกต้อง 100%</div>
                                <div className="text-xs text-muted-foreground max-w-md mx-auto">
                                    ไม่พบข้อผิดพลาดด้านกฎหมายแรงงานการบิน หรือความเสี่ยงต่อความล้า (FRMS) ในตารางเวรสัปดาห์นี้
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[960px] border-collapse">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className={th}>ระดับความเสี่ยง</th>
                                            <th className={th}>ชื่อช่าง / รหัส</th>
                                            <th className={th}>หัวข้อระเบียบความปลอดภัย</th>
                                            <th className={th}>วันที่เกิดเหตุการณ์</th>
                                            <th className={th}>รายละเอียดความขัดแย้ง</th>
                                            <th className={th}>คำแนะนำในการปรับตารางเวร</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {frmsAudits
                                            .filter((a) => frmsSeverityFilter === 'all' || a.severity === frmsSeverityFilter)
                                            .map((item) => (
                                                <tr key={item.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                                                    <td className={td}>
                                                        {item.severity === 'violation' ? (
                                                            <span className="inline-flex items-center gap-1 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.5 text-xs font-bold">
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Violation
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 text-xs font-bold">
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                Warning
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={td}>
                                                        <div className="font-semibold text-foreground">{item.staffName}</div>
                                                        <div className="font-mono text-xs text-muted-foreground">{item.employeeId}</div>
                                                    </td>
                                                    <td className={td}>
                                                        <span className="text-xs font-bold text-foreground block">
                                                            {item.ruleTitle}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-muted-foreground">
                                                            CODE: {item.ruleCode}
                                                        </span>
                                                    </td>
                                                    <td className={cn(td, 'whitespace-nowrap font-medium text-xs')}>
                                                        {item.dateLabel}
                                                    </td>
                                                    <td className={cn(td, 'text-xs text-muted-foreground max-w-xs leading-relaxed')}>
                                                        {item.description}
                                                    </td>
                                                    <td className={td}>
                                                        <span className="text-xs font-medium text-[#075CA2] dark:text-sky-300">
                                                            {item.recommendation}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
