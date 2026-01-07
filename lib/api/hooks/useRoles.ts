// src/lib/api/hooks/useRoles.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getRoles } from "@/lib/api/master/roles/getRoles";
import type { RolesResponse, RoleItem } from "@/lib/api/master/roles/roles.interface";

/**
 * Hook for getting all roles
 */
export function useRoles() {
    return useQuery<RolesResponse, Error>({
        queryKey: ["roles"],
        queryFn: getRoles,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook for getting roles as dropdown options
 */
export function useRolesOptions() {
    const { data, isLoading, error } = useRoles();

    const options = data?.responseData?.map((role: RoleItem) => ({
        id: role.id,
        value: role.id.toString(),
        label: role.name,
        code: role.code,
    })) ?? [];

    return {
        options,
        isLoading,
        error,
        isEmpty: options.length === 0 && !isLoading,
    };
}

export default useRoles;
