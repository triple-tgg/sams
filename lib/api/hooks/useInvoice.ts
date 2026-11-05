import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
    getPreInvoice,
    getDraftInvoice,
    InvoiceRequest,
    PreInvoiceResponse,
    DraftInvoiceResponse,
} from "../contract/invoiceApi";

/**
 * Hook for fetching pre-invoice data
 */
export const usePreInvoice = (
    request: InvoiceRequest,
    enabled: boolean = false,
    searchTrigger: number = 0
): UseQueryResult<PreInvoiceResponse, Error> => {
    return useQuery({
        queryKey: ["preInvoice", request, searchTrigger],
        queryFn: () => getPreInvoice(request),
        enabled,
        staleTime: 0,
        gcTime: 0,
        retry: 2,
        retryDelay: 1000,
    });
};

/**
 * Hook for fetching draft-invoice data
 */
export const useDraftInvoice = (
    request: InvoiceRequest,
    enabled: boolean = false,
    searchTrigger: number = 0
): UseQueryResult<DraftInvoiceResponse, Error> => {
    return useQuery({
        queryKey: ["draftInvoice", request, searchTrigger],
        queryFn: () => getDraftInvoice(request),
        enabled,
        staleTime: 0,
        gcTime: 0,
        retry: 2,
        retryDelay: 1000,
    });
};
