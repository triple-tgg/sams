'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import '@/lib/dayjs';
import { Activity, Plane, Search, SlidersHorizontal, UserCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getWeekStart } from '@/components/flight-timeline/utils';
import { DEFAULT_ROSTER_STATION, useRosterFlights, useRosterStaff } from '@/lib/roster/useRosterData';
import {
    DEFAULT_MANPOWER_PARAMS,
    holdsLicenceFor,
    hasAirlineAuth,
    isValidCertifyingStaff,
    movementStatus,
    reliefFactor,
    staffPerPosition,
    type ManpowerParams,
} from '@/lib/roster/manpower';
import { EmptyBlock, Pill, RosterHeader, StationSelect, WeekNav, td, th } from '../../components/RosterUi';
import { SUMMARY_MOCK_SHORTAGE, SummaryTab } from './SummaryTab';
import { DEFAULT_SETTINGS_RULES, SettingsTab, type SettingsRules } from './SettingsTab';

type TabKey = 'summary' | 'settings' | 'staff' | 'flights';

export default function ManpowerPlanningPage() {
    const [stationCode, setStationCode] = useState(DEFAULT_ROSTER_STATION);
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [params, setParams] = useState<ManpowerParams>(DEFAULT_MANPOWER_PARAMS);
    const [rules, setRules] = useState<SettingsRules>(DEFAULT_SETTINGS_RULES);
    const [activeTab, setActiveTab] = useState<TabKey>('summary');

    // Filter states for Staff Tab
    const [staffSearch, setStaffSearch] = useState('');
    const [staffCrsFilter, setStaffCrsFilter] = useState<'all' | 'crs' | 'no-crs'>('all');
    const [staffRatingFilter, setStaffRatingFilter] = useState<string>('all');

    // Filter states for Flights Tab
    const [flightSearch, setFlightSearch] = useState('');
    const [flightDayFilter, setFlightDayFilter] = useState<number | 'all'>('all');
    const [flightRiskFilter, setFlightRiskFilter] = useState<'all' | 'risk' | 'ok'>('all');

    const { staff, stations, authAirlineIds } = useRosterStaff();
    const { flights } = useRosterFlights(stationCode, weekStart);

    const stationStaff = useMemo(() => staff.filter((s) => s.stationCode === stationCode), [staff, stationCode]);

    // Filtered Staff
    const filteredStaff = useMemo(() => {
        return stationStaff.filter((s) => {
            if (staffSearch) {
                const q = staffSearch.toLowerCase();
                const matchName = s.name.toLowerCase().includes(q);
                const matchId = s.employeeId.toLowerCase().includes(q);
                const matchLicence = s.licences.some((l) => `${l.familyCode} ${l.engineCode}`.toLowerCase().includes(q));
                if (!matchName && !matchId && !matchLicence) return false;
            }
            if (staffCrsFilter === 'crs' && !isValidCertifyingStaff(s)) return false;
            if (staffCrsFilter === 'no-crs' && isValidCertifyingStaff(s)) return false;
            if (staffRatingFilter !== 'all') {
                const hasFam = s.licences.some((l) => l.familyCode.toUpperCase().includes(staffRatingFilter.toUpperCase()));
                if (!hasFam) return false;
            }
            return true;
        });
    }, [stationStaff, staffSearch, staffCrsFilter, staffRatingFilter]);

    // Available Aircraft Families for Staff Filter
    const availableFamilies = useMemo(() => {
        const set = new Set<string>();
        stationStaff.forEach((s) => s.licences.forEach((l) => l.familyCode && set.add(l.familyCode)));
        return Array.from(set).sort();
    }, [stationStaff]);

    // Filtered Flights
    const filteredFlights = useMemo(() => {
        return flights.filter((f) => {
            if (flightSearch) {
                const q = flightSearch.toLowerCase();
                const matchLabel = f.label.toLowerCase().includes(q);
                const matchAirline = f.airlineCode.toLowerCase().includes(q) || f.airlineName.toLowerCase().includes(q);
                const matchAc = `${f.familyCode} ${f.engineCode}`.toLowerCase().includes(q);
                if (!matchLabel && !matchAirline && !matchAc) return false;
            }
            if (flightDayFilter !== 'all') {
                const flightDay = dayjs(f.start).diff(dayjs(weekStart).startOf('day'), 'day');
                if (flightDay !== flightDayFilter) return false;
            }
            const certifying = stationStaff.filter(isValidCertifyingStaff);
            const licensed = certifying.filter((s) => holdsLicenceFor(s, f.familyCode, f.engineCode));
            const authorized = licensed.filter((s) => hasAirlineAuth(s, f.airlineId, authAirlineIds));
            const isRisk = authorized.length === 0;

            if (flightRiskFilter === 'risk' && !isRisk) return false;
            if (flightRiskFilter === 'ok' && isRisk) return false;

            return true;
        });
    }, [flights, flightSearch, flightDayFilter, flightRiskFilter, stationStaff, authAirlineIds, weekStart]);

    return (
        <div className="space-y-4">
            {/* ── Top Header ── */}
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<Users className="h-5 w-5" />}
                    title="วางกำลังคน (Manpower Planning)"
                    subtitle={`สถานี ${stationCode} • วิเคราะห์และวางแผนอัตรากำลังช่างรับรอง (Certifying Staff) เทียบตารางบิน`}
                >
                    <StationSelect stations={stations} value={stationCode} onChange={setStationCode} />
                    <WeekNav weekStart={weekStart} onChange={setWeekStart} />
                </RosterHeader>

                {/* ── 4 Main Tabs ── */}
                <div className="border-b border-border bg-card px-5 pt-2">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
                        <TabsList className="h-auto bg-transparent p-0 gap-6 border-b-0">
                            <TabsTrigger
                                value="summary"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                <Activity className="h-4 w-4" />
                                สรุป (Summary)
                                {SUMMARY_MOCK_SHORTAGE > 0 && (
                                    <span className="rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 px-2 py-0.2 text-[10px] font-bold">
                                        −{SUMMARY_MOCK_SHORTAGE}
                                    </span>
                                )}
                            </TabsTrigger>

                            <TabsTrigger
                                value="settings"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                ตั้งค่า (Settings)
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.2 text-[10px] font-bold">
                                    {(staffPerPosition(params) * reliefFactor(params)).toFixed(2)}x
                                </span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="staff"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                <UserCheck className="h-4 w-4" />
                                ช่าง (Staff)
                                <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-bold text-primary">
                                    {stationStaff.length}
                                </span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="flights"
                                className="relative pb-3 pt-2 text-sm font-semibold rounded-none border-b-2 border-transparent px-3 text-muted-foreground transition-all data-[state=active]:border-[#075CA2] data-[state=active]:text-[#075CA2] data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                <Plane className="h-4 w-4" />
                                เที่ยวบิน (Flights)
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.2 text-[10px] font-bold">
                                    {flights.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 1: สรุป (Summary)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'summary' && <SummaryTab onViewFlights={() => setActiveTab('flights')} />}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 2: ตั้งค่า (Settings / Rules)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
                <SettingsTab params={params} onParamsChange={setParams} rules={rules} onRulesChange={setRules} />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 3: ช่าง (Staff / Technicians)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'staff' && (
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        {/* Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-muted/20">
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ, รหัสพนักงาน, หรือ Type Rating..."
                                        value={staffSearch}
                                        onChange={(e) => setStaffSearch(e.target.value)}
                                        className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                    />
                                </div>

                                <select
                                    value={staffCrsFilter}
                                    onChange={(e) => setStaffCrsFilter(e.target.value as any)}
                                    className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                                >
                                    <option value="all">สถานะ CRS ทั้งหมด</option>
                                    <option value="crs">เฉพาะผู้ถือ SAMS CRS ที่พร้อม</option>
                                    <option value="no-crs">ยังไม่มี/หมดอายุ SAMS CRS</option>
                                </select>

                                <select
                                    value={staffRatingFilter}
                                    onChange={(e) => setStaffRatingFilter(e.target.value)}
                                    className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                                >
                                    <option value="all">Type Rating ทั้งหมด</option>
                                    {availableFamilies.map((fam) => (
                                        <option key={fam} value={fam}>{fam}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-xs text-muted-foreground font-medium">
                                แสดง {filteredStaff.length} จากทั้งหมด {stationStaff.length} คน ที่สถานี {stationCode}
                            </div>
                        </div>

                        {/* Staff Table */}
                        {filteredStaff.length === 0 ? (
                            <EmptyBlock>ไม่พบช่างที่ตรงกับเงื่อนไขการค้นหา</EmptyBlock>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[960px] border-collapse">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className={th}>รหัส / ชื่อพนักงาน</th>
                                            <th className={th}>ตำแหน่ง</th>
                                            <th className={th}>สถานะสังกัด</th>
                                            <th className={th}>SAMS CRS Authorization</th>
                                            <th className={th}>Aircraft & Engine Licences</th>
                                            <th className={th}>Airline Authorizations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.map((s) => {
                                            const isCrs = isValidCertifyingStaff(s);
                                            const mStatus = movementStatus(s);

                                            return (
                                                <tr key={s.staffId} className="border-t border-border hover:bg-muted/20 transition-colors">
                                                    <td className={td}>
                                                        <div className="font-semibold text-foreground text-sm">{s.name}</div>
                                                        <div className="font-mono text-xs text-muted-foreground">{s.employeeId || '—'}</div>
                                                    </td>
                                                    <td className={td}>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            {s.jobTitle || 'Certifying Staff'}
                                                        </span>
                                                    </td>
                                                    <td className={td}>
                                                        <Pill tone={mStatus === 'Permanent' ? 'default' : mStatus === 'Rotate' ? 'info' : 'warning'}>
                                                            {mStatus}
                                                        </Pill>
                                                    </td>
                                                    <td className={td}>
                                                        {s.sams?.isCrs ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Pill tone={isCrs ? 'success' : 'danger'}>
                                                                        {isCrs ? 'CRS Active' : 'CRS Expired'}
                                                                    </Pill>
                                                                    <span className="font-mono text-xs text-muted-foreground">{s.sams.authNo}</span>
                                                                </div>
                                                                {s.sams.expiryDate && (
                                                                    <div className="text-[11px] text-muted-foreground">
                                                                        หมดอายุ: {dayjs(s.sams.expiryDate).format('DD MMM YYYY')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Pill tone="default">ไม่มี CRS</Pill>
                                                        )}
                                                    </td>
                                                    <td className={td}>
                                                        {s.licences.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                                {s.licences.map((l, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground"
                                                                    >
                                                                        {l.familyCode} {l.engineCode && `(${l.engineCode})`}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={td}>
                                                        {s.airlineAuths.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                                {s.airlineAuths.map((a, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        title={a.statusName}
                                                                        className={cn(
                                                                            'rounded px-1.5 py-0.5 text-[10px] font-bold',
                                                                            a.isEligible
                                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                                : 'bg-muted text-muted-foreground'
                                                                        )}
                                                                    >
                                                                        {a.airlineCode}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
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
                TAB 4: เที่ยวบิน (Flights)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'flights' && (
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        {/* Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-muted/20">
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาเที่ยวบิน, สายการบิน, หรือ Type..."
                                        value={flightSearch}
                                        onChange={(e) => setFlightSearch(e.target.value)}
                                        className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#075CA2]/20"
                                    />
                                </div>

                                <select
                                    value={flightDayFilter}
                                    onChange={(e) => setFlightDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                    className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                                >
                                    <option value="all">ทุกวันในสัปดาห์</option>
                                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                        <option key={d} value={d}>
                                            {dayjs(weekStart).add(d, 'day').format('dddd (DD MMM)')}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={flightRiskFilter}
                                    onChange={(e) => setFlightRiskFilter(e.target.value as any)}
                                    className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                                >
                                    <option value="all">สถานะความพร้อมทั้งหมด</option>
                                    <option value="ok">มีช่างรับรองพร้อม (OK)</option>
                                    <option value="risk">มีความเสี่ยง/ขาดช่าง (At Risk)</option>
                                </select>
                            </div>

                            <div className="text-xs text-muted-foreground font-medium">
                                แสดง {filteredFlights.length} จาก {flights.length} เที่ยวบิน
                            </div>
                        </div>

                        {filteredFlights.length === 0 ? (
                            <EmptyBlock>ไม่พบเที่ยวบินที่ตรงกับเงื่อนไขการค้นหา</EmptyBlock>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[960px] border-collapse">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className={th}>วัน / วันที่</th>
                                            <th className={th}>เที่ยวบิน</th>
                                            <th className={th}>สายการบิน</th>
                                            <th className={th}>Type / Engine</th>
                                            <th className={th}>เวลา Ground Time (STA – STD)</th>
                                            <th className={th}>ลักษณะงาน</th>
                                            <th className={cn(th, 'text-right')}>ช่างที่มีสิทธิ์</th>
                                            <th className={th}>สถานะการรองรับ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFlights.map((f) => {
                                            const certifying = stationStaff.filter(isValidCertifyingStaff);
                                            const licensed = certifying.filter((s) => holdsLicenceFor(s, f.familyCode, f.engineCode));
                                            const authorized = licensed.filter((s) => hasAirlineAuth(s, f.airlineId, authAirlineIds));
                                            const groundMinutes = Math.round((f.end.getTime() - f.start.getTime()) / (60 * 1000));
                                            const isOvernightFlight = groundMinutes >= 240;

                                            return (
                                                <tr key={f.key} className="border-t border-border hover:bg-muted/20 transition-colors">
                                                    <td className={cn(td, 'whitespace-nowrap font-medium')}>
                                                        {dayjs(f.start).format('ddd DD MMM')}
                                                    </td>
                                                    <td className={cn(td, 'font-mono text-xs font-bold text-[#075CA2]')}>
                                                        {f.label}
                                                    </td>
                                                    <td className={td}>
                                                        <span className="font-semibold">{f.airlineCode || '—'}</span>
                                                        <span className="text-xs text-muted-foreground block">{f.airlineName}</span>
                                                    </td>
                                                    <td className={td}>
                                                        <span className="font-medium text-foreground">{f.familyCode}</span>
                                                        {f.engineCode && (
                                                            <span className="text-xs text-muted-foreground block">{f.engineCode}</span>
                                                        )}
                                                    </td>
                                                    <td className={cn(td, 'font-mono text-xs whitespace-nowrap')}>
                                                        <div>{dayjs(f.start).format('HH:mm')} – {dayjs(f.end).format('HH:mm')}</div>
                                                        <div className="text-[10px] text-muted-foreground font-sans">
                                                            {Math.floor(groundMinutes / 60)}h {groundMinutes % 60}m
                                                        </div>
                                                    </td>
                                                    <td className={td}>
                                                        <Pill tone={isOvernightFlight ? 'info' : 'default'}>
                                                            {isOvernightFlight ? 'Overnight' : 'Transit / Turn'}
                                                        </Pill>
                                                    </td>
                                                    <td className={cn(td, 'text-right tabular-nums font-bold')}>
                                                        <span className={authorized.length > 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'}>
                                                            {authorized.length}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-normal"> / {licensed.length} licence</span>
                                                    </td>
                                                    <td className={td}>
                                                        {authorized.length > 0 ? (
                                                            <Pill tone="success">พร้อมรองรับ (Covered)</Pill>
                                                        ) : licensed.length > 0 ? (
                                                            <Pill tone="warning">ขาดสิทธิ์สายการบิน</Pill>
                                                        ) : (
                                                            <Pill tone="danger">ไม่มี License สำหรับ Type</Pill>
                                                        )}
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
        </div>
    );
}
