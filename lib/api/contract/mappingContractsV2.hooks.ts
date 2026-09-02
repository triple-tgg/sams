"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mapContractsV2, type MappingContractsV2Request } from "./mappingContractsV2";
import { toast } from "sonner";

export function useMapContractsV2() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: MappingContractsV2Request) => mapContractsV2(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["flightList"] });
            qc.invalidateQueries({ queryKey: ["thfDocumentList"] });
            toast.success("Pre-Invoice generated successfully.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || error?.message || "Failed to generate Pre-Invoice.");
        }
    });
}
