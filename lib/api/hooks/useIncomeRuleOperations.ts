"use client";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
    getIncomeRuleList,
    getIncomeRuleById,
    upsertIncomeRule,
    deleteIncomeRule,
} from "@/lib/api/master/income-rules/incomeRuleOperations";
import type {
    IncomeRuleListResponse,
    IncomeRuleByIdResponse,
    IncomeRuleUpsertRequest,
    IncomeRuleUpsertResponse,
    IncomeRuleDeleteRequest,
    IncomeRuleDeleteResponse,
} from "@/lib/api/master/income-rules/income-rules.interface";

/**
 * Hook for fetching all income rules
 */
export const useIncomeRuleList = (
    enabled: boolean = true
): UseQueryResult<IncomeRuleListResponse, Error> => {
    return useQuery({
        queryKey: ["income-rules"],
        queryFn: getIncomeRuleList,
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Hook for fetching income rule by ID
 */
export const useIncomeRuleById = (
    id: number,
    enabled: boolean = true
): UseQueryResult<IncomeRuleByIdResponse, Error> => {
    return useQuery({
        queryKey: ["income-rule", id],
        queryFn: () => getIncomeRuleById(id),
        enabled: enabled && id > 0,
    });
};

/**
 * Hook for creating/updating income rules
 */
export const useUpsertIncomeRule = () => {
    const queryClient = useQueryClient();

    return useMutation<IncomeRuleUpsertResponse, Error, IncomeRuleUpsertRequest>({
        mutationFn: (data) => upsertIncomeRule(data),
        mutationKey: ["income-rule-upsert"],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["income-rules"] });
            queryClient.invalidateQueries({ queryKey: ["income-rule"] });
        },
        onError: (error) => {
            console.error("Income rule upsert failed:", error);
        },
    });
};

/**
 * Hook for deleting income rules
 */
export const useDeleteIncomeRule = () => {
    const queryClient = useQueryClient();

    return useMutation<IncomeRuleDeleteResponse, Error, IncomeRuleDeleteRequest>({
        mutationFn: (data) => deleteIncomeRule(data),
        mutationKey: ["income-rule-delete"],
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["income-rules"] });
            queryClient.invalidateQueries({ queryKey: ["income-rule"] });
        },
        onError: (error) => {
            console.error("Income rule delete failed:", error);
        },
    });
};
