import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { upsertContract, ContractUpsertRequest, ContractUpsertResponse } from "../contract/upsertContract";
import { getContractById, ContractByIdResponse } from "../contract/getContractById";
import { deleteContract, ContractDeleteRequest, ContractDeleteResponse } from "../contract/deleteContract";

/**
 * Custom hook for upserting (create/update) a contract
 * Uses useMutation since it's a POST request that modifies data
 */
export const useUpsertContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ContractUpsertRequest) => upsertContract(data),
        mutationKey: ['contractUpsert'],
        onSuccess: (data) => {
            console.log('Contract upsert successful:', data);
            // Invalidate contract list to refresh the table
            queryClient.invalidateQueries({ queryKey: ['contractList'] });
        },
        onError: (error) => {
            console.error('Contract upsert failed:', error);
        },
    });
};

/**
 * Custom hook for getting contract by ID
 * @param id - Contract ID
 * @param enabled - Whether to enable the query
 */
export const useContractById = (
    id: number,
    enabled: boolean = true
): UseQueryResult<ContractByIdResponse, Error> => {
    return useQuery({
        queryKey: ['contractById', id],
        queryFn: () => getContractById(id),
        enabled: enabled && id > 0,
        // staleTime: 5 * 60 * 1000, // 5 minutes
        // gcTime: 15 * 60 * 1000, // 15 minutes
        retry: 2,
        retryDelay: 1000,
    });
};

/**
 * Custom hook for deleting a contract
 * Uses useMutation for POST /contract/delete
 */
export const useDeleteContract = () => {
    const queryClient = useQueryClient();

    return useMutation<ContractDeleteResponse, Error, ContractDeleteRequest>({
        mutationFn: (data) => deleteContract(data),
        mutationKey: ['contractDelete'],
        onSuccess: () => {
            // Invalidate contract list to refresh the table
            queryClient.invalidateQueries({ queryKey: ['contractList'] });
            queryClient.invalidateQueries({ queryKey: ['contractById'] });
        },
        onError: (error) => {
            console.error('Contract delete failed:', error);
        },
    });
};

export default useUpsertContract;
