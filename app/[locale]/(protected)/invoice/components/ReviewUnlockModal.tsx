"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LockKeyhole, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { thfRevisionService, useThfRevision } from "@/lib/store/useThfRevisionStore";
import { reviewUnlockApi } from "@/lib/api/lineMaintenances/thfRevision";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";

interface ReviewUnlockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flight: FlightItem | null;
    onSuccess?: () => void;
}

export function ReviewUnlockModal({ open, onOpenChange, flight, onSuccess }: ReviewUnlockModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { record: revRecord } = useThfRevision({
        flightId: flight?.flightInfosId || flight?.flightsId,
        lineMaintenanceId: flight?.lineMaintenancesId,
        thfNumber: flight?.thfNumber,
    });

    if (!flight) return null;

    const unlockReason = revRecord?.unlockReason || flight.revisionReason || "Reason not provided";
    const requestedBy = revRecord?.requestedBy || "Engineer / Maintenance Team";
    const requestedAt = revRecord?.unlockRequestedAt
        ? new Date(revRecord.unlockRequestedAt).toLocaleString()
        : null;

    const handleApprove = async () => {
        try {
            setIsSubmitting(true);
            const lineMaintenanceId = flight.lineMaintenancesId;

            if (lineMaintenanceId) {
                try {
                    await reviewUnlockApi(lineMaintenanceId, {
                        action: "APPROVE",
                        reviewedBy: "Accounting Department",
                    });
                } catch (apiErr) {
                    console.warn("Backend review-unlock returned error (using local store fallback):", apiErr);
                }
            }

            thfRevisionService.approveUnlock({
                flightId: flight.flightInfosId || flight.flightsId,
                lineMaintenanceId: flight.lineMaintenancesId,
                thfNumber: flight.thfNumber,
            });

            toast.success(`Approved edit request for THF ${flight.thfNumber || ""}`, {
                description: "Maintenance can now edit and update this document from the Flight List page.",
            });

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to approve unlock:", error);
            toast.error("Failed to approve edit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        try {
            setIsSubmitting(true);
            const lineMaintenanceId = flight.lineMaintenancesId;

            if (lineMaintenanceId) {
                try {
                    await reviewUnlockApi(lineMaintenanceId, {
                        action: "REJECT",
                        reviewedBy: "Accounting Department",
                    });
                } catch (apiErr) {
                    console.warn("Backend review-unlock returned error (using local store fallback):", apiErr);
                }
            }

            thfRevisionService.rejectUnlock({
                flightId: flight.flightInfosId || flight.flightsId,
                lineMaintenanceId: flight.lineMaintenancesId,
                thfNumber: flight.thfNumber,
            });

            toast.info(`Rejected edit request for THF ${flight.thfNumber || ""}`);

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to reject unlock:", error);
            toast.error("Failed to reject edit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-blue-600">
                        <LockKeyhole className="h-5 w-5" />
                        <DialogTitle className="text-lg">Review THF Edit Request</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground pt-1">
                        The maintenance team has requested permission to unlock and edit this submitted THF.
                    </DialogDescription>
                </DialogHeader>

                {/* Flight Info Card */}
                <div className="my-3 p-3 bg-slate-50 border rounded-lg text-xs grid grid-cols-2 gap-2 text-slate-700">
                    <div className="col-span-2">
                        <span className="text-muted-foreground">THF Number: </span>
                        <span className="font-semibold text-slate-900">{flight.thfNumber || "-"}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-muted-foreground">Flight No: </span>
                        <span className="font-semibold text-slate-900">
                            {flight.arrivalFlightNo && flight.departureFlightNo && flight.arrivalFlightNo !== flight.departureFlightNo && !flight.arrivalFlightNo.includes(flight.departureFlightNo)
                                ? `${flight.arrivalFlightNo} / ${flight.departureFlightNo}`
                                : (flight.arrivalFlightNo || flight.departureFlightNo || "-")}
                        </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-muted-foreground">Airline: </span>
                        <span className="font-semibold text-slate-900">{flight.airlineObj?.code || "-"}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-muted-foreground">Station: </span>
                        <span className="font-semibold text-slate-900">{flight.stationObj?.code || "-"}</span>
                    </div>
                </div>

                {/* Reason Details Box */}
                <div className="space-y-3 py-1">
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold text-amber-900">
                            <span>Request Details:</span>
                            {requestedAt && <span className="text-[11px] font-normal text-amber-700">{requestedAt}</span>}
                        </div>
                        <p className="mt-1.5 p-2 bg-white/90 rounded border border-amber-200/60 font-medium text-slate-800">
                            {unlockReason}
                        </p>
                        <div className="mt-1.5 text-[11px] text-amber-800">
                            Requested by: <span className="font-medium">{requestedBy}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex sm:justify-between gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={handleReject}
                            disabled={isSubmitting}
                        >
                            <XCircle className="h-4 w-4 mr-1.5 text-red-600" />
                            Reject
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleApprove}
                            disabled={isSubmitting}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            {isSubmitting ? "Processing..." : "Approve & Allow Edit"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
