'use client';

import { useQuery } from '@tanstack/react-query';
import { getStaffList } from '@/lib/api/master/staff/staffOperations';

export interface StaffOption {
    id: number;
    code: string;
    name: string;
    positionCode: string;
}

/**
 * Hook for fetching all staff for import validation
 * Loads all staff in a single query for efficient validation
 */
export const useStaffListForImport = (enabled: boolean = true) => {
    const query = useQuery({
        queryKey: ['staff-list-import'],
        queryFn: async () => {
            // Fetch all staff (large page size)
            const response = await getStaffList({ page: 1, perPage: 1000 });
            return response;
        },
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    // Transform to options
    const allStaff: StaffOption[] = query.data?.responseData?.map((staff: any) => ({
        id: staff.id,
        code: staff.code || '',
        name: staff.name || '',
        positionCode: staff.staffstypeObj?.code?.toUpperCase() || '',
    })) || [];

    // Filter CS staff (position contains CS or CUSTOMER)
    const csStaffOptions = allStaff.filter((staff) =>
        staff.positionCode.includes('CS') || staff.positionCode.includes('CUSTOMER')
    );

    // Filter MECH staff (position contains MECH, LAE, or TECH)
    const mechStaffOptions = allStaff.filter((staff) =>
        staff.positionCode.includes('MECH') ||
        staff.positionCode.includes('LAE') ||
        staff.positionCode.includes('TECH')
    );

    /**
     * Find staff by name (case-insensitive, partial match)
     */
    const findStaffByName = (name: string, type: 'CS' | 'MECH'): StaffOption | undefined => {
        const options = type === 'CS' ? csStaffOptions : mechStaffOptions;
        const normalizedName = name.trim().toUpperCase();
        return options.find((staff) =>
            staff.name.toUpperCase().includes(normalizedName) ||
            normalizedName.includes(staff.name.toUpperCase())
        );
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
    };
};

export default useStaffListForImport;
