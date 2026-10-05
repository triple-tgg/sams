'use client';

import { Fragment, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRosterStaff } from '@/lib/roster/useRosterData';
import { countByTypeEngine, type RosterStaff, type TypeEngineCount } from '@/lib/roster/manpower';
import { EmptyBlock, LoadingBlock, RosterHeader, StatTile, StationSelect, td, th } from '../components/RosterUi';

interface FamilyRow {
    familyCode: string;
    engines: TypeEngineCount[];
    licensed: number;
    certifying: number;
}

/** Distinct people across the engines of one family. */
function distinct(lists: RosterStaff[][]): number {
    return new Set(lists.flat().map((s) => s.staffId)).size;
}

function NameList({ staff }: { staff: RosterStaff[] }) {
    if (staff.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {staff.map((s) => (
                <span key={s.staffId}>
                    {s.name} <span className="font-mono text-muted-foreground">{s.employeeId}</span>
                    {s.stationCode && <span className="text-muted-foreground"> · {s.stationCode}</span>}
                </span>
            ))}
        </div>
    );
}

export default function AircraftTypeSummaryPage() {
    const { staff, stations, isLoading, error } = useRosterStaff();
    const [stationCode, setStationCode] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const stationStaff = useMemo(
        () => (stationCode ? staff.filter((s) => s.stationCode === stationCode) : staff),
        [staff, stationCode]
    );
    const counts = useMemo(() => countByTypeEngine(stationStaff), [stationStaff]);

    const families = useMemo<FamilyRow[]>(() => {
        const map = new Map<string, TypeEngineCount[]>();
        counts.forEach((c) => map.set(c.familyCode, [...(map.get(c.familyCode) ?? []), c]));
        return Array.from(map.entries()).map(([familyCode, engines]) => ({
            familyCode,
            engines,
            licensed: distinct(engines.map((e) => e.licensed)),
            certifying: distinct(engines.map((e) => e.certifying)),
        }));
    }, [counts]);

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const maxCertifying = Math.max(1, ...counts.map((c) => c.certifying.length));
    const thin = counts.filter((c) => c.certifying.length <= 2).length;

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <RosterHeader
                    icon={<Icon icon="mdi:engine-outline" className="h-5 w-5" />}
                    title="Engine Summary"
                    subtitle="How many Certifying Staff hold each aircraft type and engine"
                >
                    <StationSelect stations={stations} value={stationCode} onChange={setStationCode} allowAll />
                </RosterHeader>
                <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-4">
                    <StatTile label="Aircraft types" value={families.length} />
                    <StatTile label="Type / Engine" value={counts.length} unit="combinations" />
                    <StatTile label="Valid CS" value={stationStaff.filter((s) => counts.some((c) => c.certifying.includes(s))).length} unit="people" />
                    <StatTile label="≤ 2 valid CS" value={thin} unit="combinations" tone={thin > 0 ? 'warning' : 'success'} />
                </div>
            </Card>

            <Card className="overflow-hidden">
                {isLoading ? (
                    <LoadingBlock label="Loading licences..." />
                ) : error ? (
                    <EmptyBlock>Failed to load staff: {(error as Error).message}</EmptyBlock>
                ) : families.length === 0 ? (
                    <EmptyBlock>No licence holders for this station.</EmptyBlock>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className={th}>A/C Type</th>
                                    <th className={th}>Engine</th>
                                    <th className={cn(th, 'text-right')}>Licence holders</th>
                                    <th className={cn(th, 'text-right')}>Valid CS</th>
                                    <th className={cn(th, 'w-[35%]')}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {families.map((fam) => (
                                    <Fragment key={fam.familyCode}>
                                        <tr className="border-t-2 border-border bg-muted/30">
                                            <td className={cn(td, 'font-semibold')}>{fam.familyCode}</td>
                                            <td className={cn(td, 'text-muted-foreground')}>All engines</td>
                                            <td className={cn(td, 'text-right font-semibold tabular-nums')}>{fam.licensed}</td>
                                            <td className={cn(td, 'text-right font-semibold tabular-nums')}>{fam.certifying}</td>
                                            <td className={td}></td>
                                        </tr>
                                        {fam.engines.map((e) => {
                                            const open = expanded.has(e.key);
                                            return (
                                                <Fragment key={e.key}>
                                                    <tr className="border-t border-border hover:bg-muted/40 cursor-pointer" onClick={() => toggle(e.key)}>
                                                        <td className={td}></td>
                                                        <td className={td}>
                                                            <span className="inline-flex items-center gap-1">
                                                                <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-90')} />
                                                                {e.engineCode || '—'}
                                                            </span>
                                                        </td>
                                                        <td className={cn(td, 'text-right tabular-nums')}>{e.licensed.length}</td>
                                                        <td
                                                            className={cn(
                                                                td,
                                                                'text-right font-medium tabular-nums',
                                                                e.certifying.length === 0 && 'text-red-600 dark:text-red-400',
                                                                e.certifying.length > 0 && e.certifying.length <= 2 && 'text-amber-600 dark:text-amber-400'
                                                            )}
                                                        >
                                                            {e.certifying.length}
                                                        </td>
                                                        <td className={td}>
                                                            <div className="h-2 rounded-sm bg-muted">
                                                                <div
                                                                    className="h-2 rounded-sm bg-primary"
                                                                    style={{ width: `${(e.certifying.length / maxCertifying) * 100}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {open && (
                                                        <tr className="bg-muted/20">
                                                            <td className={td}></td>
                                                            <td className={td} colSpan={4}>
                                                                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Valid CS</div>
                                                                <NameList staff={e.certifying} />
                                                                {e.licensed.length > e.certifying.length && (
                                                                    <>
                                                                        <div className="mb-1 mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                                            Licence only (no valid CRS)
                                                                        </div>
                                                                        <NameList staff={e.licensed.filter((s) => !e.certifying.includes(s))} />
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
