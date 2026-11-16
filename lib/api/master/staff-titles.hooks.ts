"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteStaffTitle,
    getStaffTitleById,
    getStaffTitles,
    upsertStaffTitle,
    type DeleteStaffTitleRequest,
    type DeleteStaffTitleResponse,
    type StaffTitle,
    type UpsertStaffTitleRequest,
    type UpsertStaffTitleResponse,
} from "./staff-titles";

export const staffTitleKeys = {
    all: ["staff-titles"] as const,
    detail: (id: number) => ["staff-titles", id] as const,
};

/** Name titles for staff forms and the staff import (value = titleId). GET /master/titles/listdata */
export function useStaffTitles() {
    return useQuery<StaffTitle[]>({
        queryKey: staffTitleKeys.all,
        queryFn: getStaffTitles,
        staleTime: 30 * 60 * 1000,
    });
}

/** One name title by id. GET /master/titles/{id} */
export function useStaffTitleById(id: number, enabled: boolean = true) {
    return useQuery<StaffTitle | null>({
        queryKey: staffTitleKeys.detail(id),
        queryFn: () => getStaffTitleById(id),
        enabled: enabled && id > 0,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Create or update a name title. POST /master/titles/upsert
 * Refreshes the title list (staff forms and the staff import read it) on success.
 */
export function useUpsertStaffTitle() {
    const queryClient = useQueryClient();
    return useMutation<UpsertStaffTitleResponse, Error, UpsertStaffTitleRequest>({
        mutationFn: upsertStaffTitle,
        mutationKey: ["staff-titles-upsert"],
        onSuccess: (res) => {
            if (res.message !== "success") return;
            queryClient.invalidateQueries({ queryKey: staffTitleKeys.all });
        },
    });
}

/**
 * Delete a name title. POST /master/titles/delete
 * Refreshes the title list on success, so deleted titles drop out of the staff forms and the import.
 */
export function useDeleteStaffTitle() {
    const queryClient = useQueryClient();
    return useMutation<DeleteStaffTitleResponse, Error, DeleteStaffTitleRequest>({
        mutationFn: deleteStaffTitle,
        mutationKey: ["staff-titles-delete"],
        onSuccess: (res) => {
            if (res.message !== "success") return;
            queryClient.invalidateQueries({ queryKey: staffTitleKeys.all });
        },
    });
}
