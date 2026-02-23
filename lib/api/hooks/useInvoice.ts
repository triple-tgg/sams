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
    enabled: boolean = false
): UseQueryResult<PreInvoiceResponse, Error> => {
    return useQuery({
        queryKey: ["preInvoice", request],
        queryFn: () => getPreInvoice(request),
        enabled,
        staleTime: 2 * 60 * 1000,  // 2 minutes
        gcTime: 10 * 60 * 1000,    // 10 minutes
        retry: 2,
        retryDelay: 1000,
    });
};

/**
 * Hook for fetching draft-invoice data
 */
export const useDraftInvoice = (
    request: InvoiceRequest,
    enabled: boolean = false
): UseQueryResult<DraftInvoiceResponse, Error> => {
    return useQuery({
        queryKey: ["draftInvoice", request],
        queryFn: () => getDraftInvoice(request),
        enabled,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
    });
};
