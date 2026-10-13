'use client';

import { useQuery } from '@tanstack/react-query';
import { getQAStaffList, QAStaffItem } from '@/lib/api/qa/staff-management';

export interface StaffOption {
    id: number;
    code: string;
    name: string;
    positionCode: string;
    departmentName?: string;
    staffType?: string;
    staffTypeName?: string;
    jobTitle?: string;
}

/**
 * Helper to determine if a staff member qualifies for CS, MECH, or both:
 * - When selecting MECH: show MECH and CS&MECH
 * - When selecting CS:   show CS and CS&MECH
 */
export const checkStaffRoles = (staff: StaffOption) => {
    const rawType = (staff.staffType || '').trim().toUpperCase();
    const rawTypeName = (staff.staffTypeName || '').trim().toUpperCase();
    const rawPosCode = (staff.positionCode || '').trim().toUpperCase();
    const rawJobTitle = (staff.jobTitle || '').trim().toUpperCase();

    const typeCombined = `${rawType} ${rawTypeName}`;
    const posCombined = `${rawPosCode} ${rawJobTitle}`;

    // 1. Dual role check: CS&MECH / CS & MECH / CS/MECH / MECH&CS / etc.
    const isDual =
        typeCombined.includes('CS&MECH') ||
        typeCombined.includes('CS & MECH') ||
        typeCombined.includes('CS/MECH') ||
        typeCombined.includes('CS / MECH') ||
        typeCombined.includes('MECH&CS') ||
        typeCombined.includes('MECH & CS') ||
        typeCombined.includes('MECH/CS') ||
        typeCombined.includes('CS+MECH') ||
        typeCombined.includes('CS,MECH') ||
        typeCombined.includes('CS, MECH') ||
        (typeCombined.includes('CS') && typeCombined.includes('MECH')) ||
        (posCombined.includes('CS') && (posCombined.includes('MECH') || posCombined.includes('LAE')));

    // 2. Pure CS check
    const isCsType =
        rawType === 'CS' ||
        rawTypeName === 'CS' ||
        typeCombined.includes('CERTIF') ||
        typeCombined.includes('CUSTOMER');

    const isCsPos =
        rawPosCode === 'CS' ||
        posCombined.includes('CERTIF');

    // 3. Pure MECH check
    const isMechType =
        rawType === 'MECH' ||
        rawTypeName === 'MECH' ||
        typeCombined.includes('MECHANIC');

    const isMechPos =
        rawPosCode === 'MECH' ||
        posCombined.includes('MECHANIC') ||
        posCombined.includes('LAE');

    // Explicit staffType takes priority over fallback position
    const isCS = isDual || isCsType || (!isMechType && isCsPos);
    const isMech = isDual || isMechType || (!isCsType && isMechPos);

    return { isCS, isMech, isDual };
};

/**
 * Hook for fetching all staff from /master/staff-management/listdata
 * Loads all active staff for flight timeline staff assignment and Excel import validation
 */
export const useStaffListForImport = (enabled: boolean = true) => {
    const query = useQuery({
        queryKey: ['staff-management-listdata-all'],
        queryFn: async (): Promise<QAStaffItem[]> => {
            const allStaffList: QAStaffItem[] = [];
            const pageSize = 500;
            const maxPages = 10;

            for (let page = 1; page <= maxPages; page++) {
                const res = await getQAStaffList({
                    sortBy: 'employeeId',
                    sortDirection: 'asc',
                    name: '',
                    employeeId: '',
                    positionId: 0,
                    departmentId: 0,
                    staffstypeId: 0,
                    isActive: true,
                    page,
                    perPage: pageSize,
                });

                const batch = res.responseData ?? [];
                allStaffList.push(...batch);

                if (batch.length < pageSize || allStaffList.length >= (res.totalAll || res.total || 0)) {
                    break;
                }
            }

            return allStaffList;
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000,   // 30 minutes
    });

    // Transform QAStaffItem to StaffOption
    const allStaff: StaffOption[] = (query.data ?? []).map((staff: QAStaffItem) => {
        const displayName =
            staff.fullNameEn?.trim() ||
            (staff.name ? `${staff.title ? `${staff.title.trim()} ` : ''}${staff.name.trim()}` : '') ||
            staff.name?.trim() ||
            staff.code ||
            `Staff #${staff.id}`;

        const staffTypeCode = staff.staffstypeObj?.code?.trim() || '';
        const staffTypeName = staff.staffstypeObj?.name?.trim() || '';
        const positionName = staff.positionObj?.name?.trim() || staff.jobTitle?.trim() || '';
        const positionCode = staff.positionObj?.code?.trim() || '';
        const departmentName = staff.departmentObj?.name?.trim() || '';

        return {
            id: staff.id,
            code: staff.code || '',
            name: displayName,
            positionCode: positionCode || positionName.toUpperCase(),
            departmentName,
            staffType: staffTypeCode,
            staffTypeName,
            jobTitle: positionName,
        };
    });

    // Filter CS staff: Show CS and CS&MECH
    const csStaffOptions = allStaff.filter((staff) => checkStaffRoles(staff).isCS);

    // Filter MECH staff: Show MECH and CS&MECH
    const mechStaffOptions = allStaff.filter((staff) => checkStaffRoles(staff).isMech);

    /**
     * Find staff by name (case-insensitive, partial match or code match)
     * Matches within target role (CS or MECH, including CS&MECH) first, then falls back to all staff
     */
    const findStaffByName = (name: string, type: 'CS' | 'MECH'): StaffOption | undefined => {
        if (!name || !name.trim()) return undefined;
        const normalized = name.trim().toUpperCase();

        const targetList = type === 'CS' ? csStaffOptions : mechStaffOptions;

        // 1. Search in target role options first (which includes CS&MECH)
        const roleMatch = targetList.find((staff) => {
            const raw = (query.data ?? []).find((s) => s.id === staff.id);
            const enName = raw?.fullNameEn?.toUpperCase() || '';
            const thName = raw?.name?.toUpperCase() || '';
            const code = staff.code.toUpperCase();
            const optionName = staff.name.toUpperCase();

            return (
                optionName.includes(normalized) ||
                normalized.includes(optionName) ||
                (enName && (enName.includes(normalized) || normalized.includes(enName))) ||
                (thName && (thName.includes(normalized) || normalized.includes(thName))) ||
                (code && code === normalized)
            );
        });

        if (roleMatch) return roleMatch;

        // 2. Fallback to all staff if not found in role list
        return allStaff.find((staff) => {
            const raw = (query.data ?? []).find((s) => s.id === staff.id);
            const enName = raw?.fullNameEn?.toUpperCase() || '';
            const thName = raw?.name?.toUpperCase() || '';
            const code = staff.code.toUpperCase();
            const optionName = staff.name.toUpperCase();

            return (
                optionName.includes(normalized) ||
                normalized.includes(optionName) ||
                (enName && (enName.includes(normalized) || normalized.includes(enName))) ||
                (thName && (thName.includes(normalized) || normalized.includes(thName))) ||
                (code && code === normalized)
            );
        });
    };

    /**
     * Parse comma-separated names and find matching staff
     * Returns array of found staff and array of not found names
     */
    const parseAndMatchStaff = (
        value: string,
        type: 'CS' | 'MECH'
    ): { found: StaffOption[]; notFound: string[] } => {
        if (!value || !value.trim()) {
            return { found: [], notFound: [] };
        }

        const names = value.split(',').map((n) => n.trim()).filter(Boolean);
        const found: StaffOption[] = [];
        const notFound: string[] = [];

        for (const name of names) {
            const staff = findStaffByName(name, type);
            if (staff) {
                found.push(staff);
            } else {
                notFound.push(name);
            }
        }

        return { found, notFound };
    };

    return {
        allStaff,
        csStaffOptions,
        mechStaffOptions,
        findStaffByName,
        parseAndMatchStaff,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
};

export default useStaffListForImport;

