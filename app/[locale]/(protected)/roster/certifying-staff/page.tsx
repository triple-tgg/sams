'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Search, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { groupCombinationDisplayLabels } from '@/lib/utils/aircraftEngineDisplay';
import { useRosterStaff } from '@/lib/roster/useRosterData';
import { isValidCertifyingStaff, movementStatus, type MovementStatus, type RosterStaff } from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock, Pill, RosterHeader, StatTile, StationSelect, td, th } from '../components/RosterUi';

const UNASSIGNED = '__none__';

function licenceLabels(staff: RosterStaff): string[] {
    const combos = staff.licences.map((l) => ({ id: l.combinationId, familyCode: l.familyCode, series: l.series, engineCode: l.engineCode }));
    return groupCombinationDisplayLabels(combos.map((c) => c.id), combos);
}

function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.format('DD MMM YYYY') : value;
}

function SamsCell({ staff }: { staff: RosterStaff }) {
    const sams = staff.sams;
    if (!sams) return <Pill>Not issued</Pill>;
    const valid = isValidCertifyingStaff(staff);
    const expiring = valid && sams.daysToExpiry !== null && sams.daysToExpiry <= 90;
    return (
        <div className="space-y-1">
            <div className="font-mono text-xs">{sams.authNo || '—'}</div>
            <div className="flex flex-wrap gap-1">
                <Pill tone={!valid ? 'danger' : expiring ? 'warning' : 'success'}>{sams.statusName || (valid ? 'Valid' : 'Invalid')}</Pill>
                {!sams.isCrs && <Pill>Not CRS</Pill>}
            </div>
            <div className="text-[11px] text-muted-foreground">Exp. {formatDate(sams.expiryDate)}</div>
        </div>
    );
}

const MOVEMENT_TONE: Record<MovementStatus, 'default' | 'info' | 'warning'> = {
    Permanent: 'default',
    Rotate: 'info',
    Transfer: 'warning',
};

export default function CertifyingStaffPage() {
    const { staff, stations, isLoading, error } = useRosterStaff();
    const [search, setSearch] = useState('');
    const [stationCode, setStationCode] = useState('');
    const [movement, setMovement] = useState<'' | MovementStatus>('');
    const [crsOnly, setCrsOnly] = useState(true);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return staff
            .filter((s) => !crsOnly || isValidCertifyingStaff(s))
            .filter((s) =>
                !stationCode
                    ? true
                    : stationCode === UNASSIGNED
                      ? !s.stationCode
                      : s.stationCode === stationCode || s.transfers.some((t) => t.stationCode === stationCode)
            )
            .filter((s) => !movement || movementStatus(s) === movement)
            .filter((s) => !q || s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q) || (s.sams?.authNo ?? '').toLowerCase().includes(q))
            .sort((a, b) => a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true }));
    }, [staff, search, stationCode, movement, crsOnly]);

    const certifying = staff.filter(isValidCertifyingStaff);
    const moving = certifying.filter((s) => movementStatus(s) !== 'Permanent').length;
    const unassigned = certifying.filter((s) => !s.stationCode).length;

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<UserCheck className="h-5 w-5" />}
                    title="Certifying Staff"
                    subtitle="Licences, authorizations and station per person"
                />
                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
                    <StatTile label="Valid CS" value={certifying.length} unit="people" />
                    <StatTile label="Licence holders" value={staff.length} unit="people" />
                    <StatTile label="Rotate / Transfer" value={moving} tone={moving > 0 ? 'warning' : 'default'} />
                    <StatTile label="No station" value={unassigned} tone={unassigned > 0 ? 'danger' : 'success'} />
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Name, employee ID, auth no."
                            className="h-9 w-64 rounded-md border border-border bg-card pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <StationSelect
                        stations={stations}
                        value={stationCode}
                        onChange={setStationCode}
                        allowAll
                        extraOptions={[{ value: UNASSIGNED, label: 'No station' }]}
                    />
                    <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <select
                            value={movement}
                            onChange={(e) => setMovement(e.target.value as '' | MovementStatus)}
                            className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                        >
                            <option value="">All</option>
                            <option value="Permanent">Permanent</option>
                            <option value="Rotate">Rotate</option>
                            <option value="Transfer">Transfer</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={crsOnly} onChange={(e) => setCrsOnly(e.target.checked)} className="h-4 w-4" />
                        Valid CRS only
                    </label>
                    <span className="ml-auto text-sm text-muted-foreground">{rows.length} people</span>
                </div>
            </Card>

            <Card className="overflow-hidden">
                {isLoading ? (
                    <LoadingBlock label="Loading staff and authorizations..." />
                ) : error ? (
                    <EmptyBlock>Failed to load staff: {(error as Error).message}</EmptyBlock>
                ) : rows.length === 0 ? (
                    <EmptyBlock>No staff match these filters.</EmptyBlock>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1150px] border-collapse">
                            <thead className="bg-muted/50">
                                <tr>
                                    {['Employee', 'Station', 'Rotate / Transfer', 'AMEL Licence', 'Aircraft Licence', 'SAMS Authorization', 'Customer Authorization'].map((h) => (
                                        <th key={h} className={th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s) => {
                                    const status = movementStatus(s);
                                    const eligible = s.airlineAuths.filter((a) => a.isEligible);
                                    const notEligible = s.airlineAuths.length - eligible.length;
                                    return (
                                        <tr key={s.staffId} className="border-t border-border">
                                            <td className={td}>
                                                <div className="font-medium">{s.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    <span className="font-mono">{s.employeeId}</span>
                                                    {s.jobTitle && ` · ${s.jobTitle}`}
                                                </div>
                                            </td>
                                            <td className={td}>{s.stationCode ? <span className="font-mono">{s.stationCode}</span> : <Pill tone="danger">None</Pill>}</td>
                                            <td className={td}>
                                                <Pill tone={MOVEMENT_TONE[status]}>{status}</Pill>
                                                {s.transfers.length > 0 && (
                                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                                        → {s.transfers.map((t) => t.stationCode || `#${t.stationId}`).join(', ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={td}>
                                                {s.amelLicenses.length === 0
                                                    ? '—'
                                                    : s.amelLicenses.map((a) => (
                                                          <div key={a.licenseNumber}>
                                                              <div className="font-mono text-xs">{a.licenseNumber}</div>
                                                              <div className="text-[11px] text-muted-foreground">Exp. {formatDate(a.expiryDate)}</div>
                                                          </div>
                                                      ))}
                                            </td>
                                            <td className={cn(td, 'max-w-[280px]')}>
                                                <div className="flex flex-wrap gap-1">
                                                    {licenceLabels(s).map((l) => <Pill key={l}>{l}</Pill>)}
                                                    {s.licences.length === 0 && '—'}
                                                </div>
                                            </td>
                                            <td className={td}><SamsCell staff={s} /></td>
                                            <td className={cn(td, 'max-w-[260px]')}>
                                                <div className="flex flex-wrap gap-1">
                                                    {eligible.map((a) => (
                                                        <Pill key={a.airlineId} tone="success" title={`${a.statusName} · Exp. ${formatDate(a.expiryDate)}`}>
                                                            {a.airlineCode}
                                                        </Pill>
                                                    ))}
                                                    {eligible.length === 0 && <span className="text-muted-foreground">—</span>}
                                                </div>
                                                {notEligible > 0 && <div className="mt-1 text-[11px] text-muted-foreground">{notEligible} airline(s) not eligible</div>}
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
    );
}
