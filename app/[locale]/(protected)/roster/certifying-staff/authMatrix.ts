import type { CustomerAuthStaffItem } from '@/lib/api/qa/authorization/customer-auth';
import { getCustomerAuthCellData, type CustomerAuthUiStatus } from '@/lib/api/qa/authorization/customer-auth.utils';
import type { MonitoringCrsAirline } from '@/lib/api/qa/authorization/monitoring-crs';
import type { RosterStaff } from '@/lib/roster/manpower';
import { AIRLINE_TYPES } from './mockData';

/**
 * Customer Authorization matrix: airline column groups, each split into the aircraft types
 * authorized at that airline. Airlines without any aircraft type get a single status column.
 */

export interface AircraftTypeGroup {
    model: string;
    subtypes: string[];
}

export function groupAircraftTypes(types: string[]): AircraftTypeGroup[] {
    if (!types || types.length === 0) {
        return [{ model: '-', subtypes: ['-'] }];
    }
    const groups: AircraftTypeGroup[] = [];
    types.forEach((type) => {
        let model = type;
        if (type.includes(' - ')) {
            model = type.split(' - ')[0].trim();
        } else if (type.includes(' ')) {
            model = type.split(' ')[0].trim();
        }
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.model === model) {
            lastGroup.subtypes.push(type);
        } else {
            groups.push({ model, subtypes: [type] });
        }
    });
    return groups;
}

export interface MatrixAirline {
    airlineId: number;
    code: string;
    name: string;
    colorForeground: string | null;
    colorBackground: string | null;
    /** Aircraft type columns (sorted). Empty = one status column. */
    types: string[];
}

export interface MatrixCell {
    status: CustomerAuthUiStatus;
    statusCode: string;
    aircraft: string[];
    expiryDate: string;
    /** CRS status for the airline (used for the single column when the airline has no aircraft types). */
    crs: CrsCellStatus;
    /** CRS status per aircraft type; falls back to `crs`. */
    crsByType?: Record<string, CrsCellStatus>;
}

/** Certifying Staff cell status shown in the matrix. */
export type CrsCellStatus = 'true' | 'false' | 'pending';

export const CRS_STATUS_META: Record<CrsCellStatus, { label: string; dot: string; text: string; bg: string }> = {
    true: { label: 'True', dot: '#16a34a', text: '#15803d', bg: '#f0fdf4' },
    false: { label: 'False', dot: '#dc2626', text: '#991b1b', bg: '#fef2f2' },
    pending: { label: 'Pending', dot: '#64748b', text: '#475569', bg: '#f8fafc' },
};

/**
 * TEMPORARY: the True/False/Pending API isn't ready yet, so derive it from the customer-auth status.
 * Replace once the backend returns the CRS status directly.
 */
export function toCrsStatus(status: CustomerAuthUiStatus): CrsCellStatus {
    if (status === 'valid' || status === 'not_complete') return 'true';
    if (status === 'pending') return 'pending';
    return 'false';
}

export function getCellCrs(cell: MatrixCell, type: string | null): CrsCellStatus {
    if (!type) return cell.crs;
    if (cell.crsByType?.[type]) return cell.crsByType[type];
    if (cell.crsByType) {
        const found = Object.entries(cell.crsByType).find(
            ([k]) => type.startsWith(k) || k.startsWith(type) || type.includes(k)
        );
        if (found) return found[1];
    }
    return cell.crs;
}

/** Deterministic pseudo-random for the mock matrix. */
function rand(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

export interface AuthMatrix {
    airlines: MatrixAirline[];
    /** staffId → airlineId → cell */
    cells: Map<number, Map<number, MatrixCell>>;
}

const sortTypes = (types: Iterable<string>, preferredOrder?: string[]) => {
    const arr = Array.from(types);
    if (preferredOrder && preferredOrder.length > 0) {
        return arr.sort((a, b) => {
            const ia = preferredOrder.indexOf(a);
            const ib = preferredOrder.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.localeCompare(b, undefined, { numeric: true });
        });
    }
    return arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

/** Build from POST /authorization/customer-auth/listdata (airlineStatuses[].aircrafts per staff). */
export function buildMatrixFromCustomerAuth(items: CustomerAuthStaffItem[]): AuthMatrix {
    const airlines = new Map<number, Omit<MatrixAirline, 'types'> & { types: Set<string> }>();
    const cells = new Map<number, Map<number, MatrixCell>>();

    items.forEach((item) => {
        const byAirline = cells.get(item.staffId) ?? new Map<number, MatrixCell>();
        (item.airlineStatuses ?? []).forEach((s) => {
            const airlineId = s.airline?.id ?? s.airlineId;
            if (!airlineId) return;
            if (!airlines.has(airlineId)) {
                airlines.set(airlineId, {
                    airlineId,
                    code: s.airline?.code || s.airlineCode || `#${airlineId}`,
                    name: s.airline?.name || '',
                    colorForeground: s.airline?.colorForeground || null,
                    colorBackground: s.airline?.colorBackground || null,
                    types: new Set<string>(),
                });
            }
            const data = getCustomerAuthCellData(s);
            data.aircraftLabels.forEach((t) => airlines.get(airlineId)!.types.add(t));
            if (s.status || data.aircraftLabels.length > 0) {
                byAirline.set(airlineId, {
                    status: data.status,
                    statusCode: (s.status || '').trim(),
                    aircraft: data.aircraftLabels,
                    expiryDate: data.expiryDate,
                    crs: toCrsStatus(data.status),
                });
            }
        });
        cells.set(item.staffId, byAirline);
    });

    return {
        airlines: Array.from(airlines.values()).map((a) => ({ ...a, types: sortTypes(a.types) })),
        cells,
    };
}

/** Build from the sample data (mockData.ts). */
export function buildMatrixFromMock(airlines: MonitoringCrsAirline[], staff: RosterStaff[]): AuthMatrix {
    const types = new Map<number, Set<string>>();
    // Pre-seed types from AIRLINE_TYPES so all columns exist
    airlines.forEach((a) => {
        if (AIRLINE_TYPES[a.code]) {
            types.set(a.airlineId, new Set(AIRLINE_TYPES[a.code]));
        }
    });

    const cells = new Map<number, Map<number, MatrixCell>>();
    staff.forEach((s, si) => {
        const byAirline = new Map<number, MatrixCell>();
        s.airlineAuths.forEach((a, ai) => {
            const set = types.get(a.airlineId) ?? new Set<string>();
            (a.aircraftTypes ?? []).forEach((t) => set.add(t));
            types.set(a.airlineId, set);
            const status: CustomerAuthUiStatus =
                a.eligibilityStatus === 'AT_RISK' ? 'not_complete' : a.isEligible ? 'valid' : 'suspended';
            const pick = (seed: number): CrsCellStatus => {
                const r = rand(seed);
                return r < 0.6 ? 'true' : r < 0.8 ? 'false' : 'pending';
            };
            const crsByType: Record<string, CrsCellStatus> = {};
            (a.aircraftTypes ?? []).forEach((t, ti) => {
                crsByType[t] = pick(si * 101 + ai * 13 + ti * 7 + 1);
            });
            byAirline.set(a.airlineId, {
                status,
                statusCode: status === 'valid' ? 'VAL' : status === 'not_complete' ? 'EXG' : 'EXP',
                aircraft: a.aircraftTypes ?? [],
                expiryDate: a.expiryDate ?? '',
                crs: pick(si * 101 + ai * 13),
                crsByType,
            });
        });
        cells.set(s.staffId, byAirline);
    });
    return {
        airlines: [...airlines]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((a) => {
                const preferred = AIRLINE_TYPES[a.code] || [];
                return {
                    airlineId: a.airlineId,
                    code: a.code,
                    name: a.name,
                    colorForeground: a.colorForeground,
                    colorBackground: a.colorBackground,
                    types: sortTypes(types.get(a.airlineId) ?? [], preferred),
                };
            }),
        cells,
    };
}

/** Same palette as QA > Authorization (CUST_STATUS_META). */
export const STATUS_META: Record<CustomerAuthUiStatus, { bg: string; dot: string; text: string; label: string; icon: string }> = {
    valid: { bg: '#dcfce7', dot: '#16a34a', text: '#15803d', label: 'Valid', icon: '✓' },
    not_complete: { bg: '#fef3c7', dot: '#d97706', text: '#92400e', label: 'Expiring', icon: '!' },
    not_approve: { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Not Approved', icon: '✕' },
    suspended: { bg: '#fee2e2', dot: '#dc2626', text: '#991b1b', label: 'Expired', icon: 'S' },
    pending: { bg: '#f1f5f9', dot: '#64748b', text: '#475569', label: 'Pending', icon: '—' },
};
