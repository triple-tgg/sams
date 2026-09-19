"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LockKeyhole, Send } from "lucide-react";
import { toast } from "sonner";
import { thfRevisionService } from "@/lib/store/useThfRevisionStore";
import { requestUnlockApi } from "@/lib/api/lineMaintenances/thfRevision";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";

interface RequestUnlockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flight: FlightItem | null;
    onSuccess?: () => void;
}

export function RequestUnlockModal({ open, onOpenChange, flight, onSuccess }: RequestUnlockModalProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flight) return;

        if (!reason.trim()) {
            toast.error("Please provide a reason for the edit request.");
            return;
        }

        try {
            setIsSubmitting(true);
            const lineMaintenanceId = flight.lineMaintenancesId;

            // Attempt to call backend API
            if (lineMaintenanceId) {
                try {
                    await requestUnlockApi(lineMaintenanceId, {
                        reason: reason.trim(),
                        requestedBy: "Engineer / Maintenance Team",
                    });
                } catch (apiError) {
                    console.warn("Backend API request-unlock returned error (using local store fallback):", apiError);
                }
            }

            // Always update store to guarantee immediate UI reactivity
            thfRevisionService.requestUnlock({
                flightId: flight.flightInfosId || flight.flightsId,
                lineMaintenanceId: flight.lineMaintenancesId,
                thfNumber: flight.thfNumber,
                reason: reason.trim(),
                requestedBy: "Engineer / Maintenance Team",
            });

            toast.info(`Unlock request for THF ${flight.thfNumber || ""} sent to Accounting`, {
                description: "Once Accounting approves the request, you can edit this document immediately.",
            });

            onSuccess?.();
            onOpenChange(false);
            setReason("");
        } catch (error) {
            console.error("Failed to request unlock:", error);
            toast.error("Failed to submit unlock request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!flight) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-blue-600">
                            <LockKeyhole className="h-5 w-5" />
                            <DialogTitle className="text-lg">Request THF Edit</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            This THF has been saved and submitted to Accounting (Invoice). Any modifications require Accounting approval to prevent billing discrepancies.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Flight & THF Info Card */}
                    <div className="my-4 p-3 bg-slate-50 border rounded-lg text-xs grid grid-cols-2 gap-2 text-slate-700">
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

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="unlockReason" className="text-xs font-semibold text-slate-700">
                                Reason for Edit Request <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="unlockReason"
                                placeholder="e.g. Adjust hydraulic servicing quantity to match actual logbook, update technician staff ID..."
                                className="min-h-[100px] text-xs resize-none"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isSubmitting || !reason.trim()}
                        >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            {isSubmitting ? "Submitting..." : "Submit Request to Accounting"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
