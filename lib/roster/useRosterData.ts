'use client';

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import '@/lib/dayjs';
import {
    getQAStaffList,
    getStaffById,
    type QAStaffItem,
    type StaffByIdData,
} from '@/lib/api/qa/staff-management';
import {
    getMonitoringCrsList,
    type MonitoringCrsAirline,
    type MonitoringCrsStaffRow,
} from '@/lib/api/qa/authorization/monitoring-crs';
import { useCombinations } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks';
import { useStations } from '@/lib/api/hooks/useStations';
import { useFlightListQuery } from '@/lib/api/hooks/useFlightListQuery';
import type { FlightItem } from '@/lib/api/flight/filghtlist.interface';
import { getFlightLocalRange, isFlightCancelled, isFlightPlanning, formatFlightLabel } from '@/components/flight-timeline/utils';
import type { AnalysisFlight, RosterStaff } from './manpower';

export const DEFAULT_ROSTER_STATION = 'BKK';

// ── Fetchers ────────────────────────────────────────────────────────────────

async function fetchAllActiveStaff(): Promise<QAStaffItem[]> {
    const all: QAStaffItem[] = [];
    for (let page = 1; page <= 20; page++) {
        const res = await getQAStaffList({
            sortBy: '',
            sortDirection: '',
            name: '',
            employeeId: '',
            positionId: 0,
            departmentId: 0,
            staffstypeId: 0,
            isActive: true,
            page,
            perPage: 500,
        });
        const batch = res.responseData ?? [];
        all.push(...batch);
        if (batch.length < 500 || all.length >= (res.total ?? 0)) break;
    }
    return all;
}

/** perPage is capped at 100 by the API, so walk every page. */
async function fetchAllMonitoringCrs(): Promise<{ rows: MonitoringCrsStaffRow[]; airlines: MonitoringCrsAirline[] }> {
    const rows: MonitoringCrsStaffRow[] = [];
    let airlines: MonitoringCrsAirline[] = [];
    for (let page = 1; page <= 50; page++) {
        const res = await getMonitoringCrsList({
            searchKeyword: '',
            coverageStatus: '',
            samsStatus: '',
            airlineId: null,
            hasIssues: false,
            expiryWarningDays: 90,
            page,
            perPage: 100,
        });
        const data = res.responseData;
        if (page === 1) airlines = data?.airlines ?? [];
        const batch = data?.staffRows ?? [];
        rows.push(...batch);
        if (batch.length < 100 || rows.length >= (res.total ?? 0)) break;
    }
    return { rows, airlines };
}

// ── Station fields ──────────────────────────────────────────────────────────

/** Station data as returned by staff byid (and by listdata, once the API adds it). */
type StationFields = Pick<StaffByIdData, 'stationId' | 'stationObj' | 'staffStationTransferList'>;

function readStation(source: Partial<StationFields> | undefined, stationCodeById: Map<number, string>) {
    const stationId = source?.stationId ?? null;
    return {
        stationId,
        stationCode: source?.stationObj?.code || (stationId ? stationCodeById.get(stationId) ?? '' : ''),
        transfers: (source?.staffStationTransferList ?? [])
            .filter((t) => !t.isdelete)
            .map((t) => ({ id: t.id, stationId: t.stationId, stationCode: stationCodeById.get(t.stationId) ?? '' })),
    };
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useRosterStaff() {
    const staffQuery = useQuery({
        queryKey: ['roster', 'staff'],
        queryFn: fetchAllActiveStaff,
        staleTime: 5 * 60 * 1000,
    });
    const crsQuery = useQuery({
        queryKey: ['roster', 'monitoring-crs'],
        queryFn: fetchAllMonitoringCrs,
        staleTime: 5 * 60 * 1000,
    });
    const { data: combinations = [], isLoading: combosLoading } = useCombinations();
    const { data: stationsResp, isLoading: stationsLoading } = useStations();

    const stations = useMemo(() => (stationsResp?.responseData ?? []).filter((s) => !s.isdelete), [stationsResp]);
    const stationCodeById = useMemo(() => new Map(stations.map((s) => [s.id, s.code])), [stations]);

    const staffList = staffQuery.data ?? [];
    const crsRows = crsQuery.data?.rows ?? [];

    // Staff listdata may not carry station fields yet; fall back to byid for licence holders only.
    const listHasStation = staffList.length > 0 && 'stationId' in staffList[0];
    const detailIds = useMemo(() => {
        if (listHasStation || staffList.length === 0) return [];
        const crsIds = new Set(crsRows.filter((r) => r.samsAuthorization).map((r) => r.staffId));
        return staffList
            .filter((s) => crsIds.has(s.id) || s.staffAircraftLicenseList?.some((l) => !l.isdelete))
            .map((s) => s.id);
    }, [listHasStation, staffList, crsRows]);

    const detailQueries = useQueries({
        queries: detailIds.map((id) => ({
            queryKey: ['qa-staff-detail', id],
            queryFn: () => getStaffById(id),
            staleTime: 5 * 60 * 1000,
        })),
    });
    const detailsLoading = detailQueries.some((q) => q.isLoading);
    const detailById = useMemo(() => {
        const map = new Map<number, StaffByIdData>();
        detailQueries.forEach((q) => {
            const d = q.data?.responseData;
            if (d) map.set(d.id, d);
        });
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailQueries.map((q) => q.dataUpdatedAt).join(',')]);

    const staff = useMemo<RosterStaff[]>(() => {
        const comboById = new Map(combinations.map((c) => [c.id, c]));
        const crsById = new Map(crsRows.map((r) => [r.staffId, r]));

        return staffList
            .map((s): RosterStaff => {
                const crs = crsById.get(s.id);
                const stationSource = listHasStation
                    ? (s as unknown as Partial<StationFields>)
                    : detailById.get(s.id);
                const licences = (s.staffAircraftLicenseList ?? [])
                    .filter((l) => !l.isdelete)
                    .flatMap((l) => {
                        const c = l.aircraftEngineObj ?? comboById.get(l.aircraftEngineId);
                        return c
                            ? [{ combinationId: l.aircraftEngineId, familyCode: c.familyCode, series: c.series ?? '', engineCode: c.engineCode }]
                            : [];
                    });
                const sams = crs?.samsAuthorization;
                return {
                    staffId: s.id,
                    employeeId: s.employeeId || s.code || '',
                    name: s.fullNameEn || s.name || crs?.staffName || '',
                    jobTitle: s.positionObj?.name || s.jobTitle || crs?.jobTitle || '',
                    isActive: s.isActive,
                    ...readStation(stationSource, stationCodeById),
                    licences,
                    amelLicenses: (s.staffAmelLicenseList ?? [])
                        .filter((a) => !a.isdelete)
                        .map((a) => ({ licenseNumber: a.licenseNumber, categoryId: a.categoryId, expiryDate: a.expiryDate })),
                    sams: sams
                        ? {
                              authNo: sams.authNo,
                              statusName: sams.statusName,
                              isCrs: sams.isCrs,
                              expiryDate: sams.expiryDate,
                              daysToExpiry: sams.daysToExpiry,
                              aircraftTypes: sams.aircraftTypes.map((t) => t.code || t.name),
                          }
                        : null,
                    airlineAuths: (crs?.airlineEligibilities ?? [])
                        .filter((e) => e.isInScope)
                        .map((e) => ({
                            airlineId: e.airlineId,
                            airlineCode: e.airlineCode,
                            isEligible: e.isEligible,
                            statusName: e.customerStatusName,
                            expiryDate: e.expiryDate,
                        })),
                };
            })
            // Certifying staff and licence holders; other staff play no part in the roster.
            .filter((s) => s.sams || s.licences.length > 0);
    }, [staffList, crsRows, combinations, listHasStation, detailById, stationCodeById]);

    const authAirlines = crsQuery.data?.airlines ?? [];
    const authAirlineIds = useMemo(() => new Set(authAirlines.map((a) => a.airlineId)), [authAirlines]);

    return {
        staff,
        stations,
        authAirlines,
        authAirlineIds,
        isLoading: staffQuery.isLoading || crsQuery.isLoading || combosLoading || stationsLoading || detailsLoading,
        error: staffQuery.error || crsQuery.error,
    };
}

export function toRosterFlight(flight: FlightItem, index: number): AnalysisFlight | null {
    const range = getFlightLocalRange(flight);
    if (!range) return null;
    return {
        key: String(flight.flightsId ?? flight.flightInfosId ?? `row-${index}`),
        label: formatFlightLabel(flight),
        airlineId: flight.airlineObj?.id ?? null,
        airlineCode: flight.airlineObj?.code ?? '',
        airlineName: flight.airlineObj?.name ?? '',
        familyCode: flight.acTypeObj?.familyCode || flight.acTypeObj?.code || flight.acType || '',
        engineCode: flight.engineCode ?? '',
        start: range.start.toDate(),
        end: range.end.toDate(),
        cancelled: isFlightCancelled(flight),
        planning: isFlightPlanning(flight),
    };
}

/** One week (Mon–Sun, local) of flights for one station. */
export function useRosterFlights(stationCode: string, weekStart: Date) {
    const query = useFlightListQuery({
        stationCodeList: stationCode ? [stationCode] : [],
        dateStart: dayjs(weekStart).format('YYYY-MM-DD'),
        dateEnd: dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD'),
        page: 1,
        perPage: 1000,
    });
    const raw = useMemo(() => (query.data?.responseData ?? []).filter((f) => !f.isDelete), [query.data]);
    const flights = useMemo(
        () => raw.map(toRosterFlight).filter((f): f is AnalysisFlight => f !== null),
        [raw]
    );
    return { raw, flights, isLoading: query.isLoading, error: query.error };
}
