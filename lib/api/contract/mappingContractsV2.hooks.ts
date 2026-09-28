"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mapContractsV2, type MappingContractsV2Request } from "./mappingContractsV2";
import { toast } from "sonner";

// Backend returns some Pre-Invoice errors in Thai — translate the known ones to English
const LOCKED_DOC_PATTERN = /ไม่สามารถแก้ไขหรือออก\s*Pre-Invoice\s*ได้\s*เนื่องจากเอกสาร\s*(.+?)\s*ถูกล็อกแล้ว\s*(?:\(Locked\))?/;

function toEnglishPreInvoiceError(message: string): string {
    const locked = message.match(LOCKED_DOC_PATTERN);
    if (locked) return `Cannot edit or issue Pre-Invoice because document ${locked[1]} is locked.`;
    return message;
}

const PROCESSING_TOAST_ID = "pre-invoice-processing";
/** After a client-side timeout the server is usually still working — re-check the lists at these delays. */
const RECHECK_DELAYS_MS = [10_000, 30_000, 60_000];

/** axios timeout (the server may still complete the request). */
export function isRequestTimeout(error: any): boolean {
    return error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT" || /timeout/i.test(error?.message ?? "");
}

/**
 * Generate Pre-Invoice (PUT /lineMaintenances/mapping-contracts-v2).
 * `isProcessing` stays true while the request runs AND while we re-check after a timeout,
 * so callers can keep their buttons disabled and avoid a duplicate submission.
 */
export function useMapContractsV2() {
    const qc = useQueryClient();
    const [awaitingServer, setAwaitingServer] = useState(false);
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    const refreshLists = () => {
        qc.invalidateQueries({ queryKey: ["flightList"] });
        qc.invalidateQueries({ queryKey: ["thfDocumentList"] });
        qc.invalidateQueries({ queryKey: ["preInvoice"] });
    };

    const recheckAfterTimeout = () => {
        timers.current.forEach(clearTimeout);
        setAwaitingServer(true);
        toast.loading("Pre-Invoice is still processing. Please wait a moment — the list will refresh automatically.", {
            id: PROCESSING_TOAST_ID,
            duration: Infinity,
        });
        timers.current = RECHECK_DELAYS_MS.map((delay, i) =>
            setTimeout(() => {
                refreshLists();
                if (i === RECHECK_DELAYS_MS.length - 1) {
                    setAwaitingServer(false);
                    toast.info("The list has been refreshed. Check the Pre-Invoice tab before trying again.", {
                        id: PROCESSING_TOAST_ID,
                        duration: 10_000,
                        closeButton: true,
                    });
                }
            }, delay),
        );
    };

    const mutation = useMutation({
        mutationFn: (data: MappingContractsV2Request) => mapContractsV2(data),
        onSuccess: () => {
            refreshLists();
            toast.success("Pre-Invoice generated successfully.");
        },
        onError: (error: any) => {
            if (isRequestTimeout(error)) {
                recheckAfterTimeout();
                return;
            }
            const message = error?.response?.data?.message || error?.message
            toast.error(message ? toEnglishPreInvoiceError(message) : "Failed to generate Pre-Invoice.", {
                duration: Infinity,
                closeButton: true,
            });
        }
    });

    return { ...mutation, isProcessing: mutation.isPending || awaitingServer, isAwaitingServer: awaitingServer };
}
