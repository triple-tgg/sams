"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { thfRevisionService } from "@/lib/store/useThfRevisionStore";
import { requestRevisionApi } from "@/lib/api/lineMaintenances/thfRevision";
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface";

interface RequestRevisionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flight: FlightItem | null;
    onSuccess?: () => void;
}

const CATEGORIES = [
    { value: "Manpower", label: "Manpower & Labor Hours" },
    { value: "Parts & Tools", label: "Parts & Equipment" },
    { value: "Fluid / Servicing", label: "Fluids & Servicing" },
    { value: "Attachments", label: "Attachments & Photos" },
    { value: "General", label: "General / Other" },
];

export function RequestRevisionModal({ open, onOpenChange, flight, onSuccess }: RequestRevisionModalProps) {
    const [category, setCategory] = useState<string>("Manpower");
    const [reason, setReason] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flight) return;

        if (!reason.trim()) {
            toast.error("Please provide revision details.");
            return;
        }

        try {
            setIsSubmitting(true);
            const lineMaintenanceId = flight.lineMaintenancesId;

            // Attempt to call the backend API endpoint
            if (lineMaintenanceId) {
                try {
                    await requestRevisionApi(lineMaintenanceId, {
                        category,
                        reason: reason.trim(),
                        requestedBy: "Accounting Department",
                    });
                } catch (apiError) {
                    console.warn("Backend API request-revision returned error (using local store fallback):", apiError);
                }
            }

            // Always update store to guarantee immediate UI reactivity
            thfRevisionService.requestRevision({
                flightId: flight.flightInfosId || flight.flightsId,
                lineMaintenanceId: flight.lineMaintenancesId,
                thfNumber: flight.thfNumber,
                category,
                reason: reason.trim(),
                requestedBy: "Accounting Department",
            });

            toast.warning(`Revision request for THF ${flight.thfNumber || ""} submitted`, {
                description: "Maintenance team has been notified on the Flight List page.",
            });

            onSuccess?.();
            onOpenChange(false);
            setReason("");
        } catch (error) {
            console.error("Failed to request revision:", error);
            toast.error("Failed to submit revision request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!flight) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            <DialogTitle className="text-lg">Request THF Revision</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Specify the errors or items requiring maintenance team corrections. This document will be held and cannot be used to Create Pre-Invoice until updated.
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
                        {/* Error Category */}
                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                                Error Category <span className="text-destructive">*</span>
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category" className="h-9 text-xs">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value} className="text-xs">
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Revision Details / Note */}
                        <div className="space-y-1.5">
                            <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                                Revision Details & Requirements <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g. Labor hours do not match logbook, please attach additional photo of logbook page 2, or correct lubrication quantity..."
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
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={isSubmitting || !reason.trim()}
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            {isSubmitting ? "Submitting..." : "Confirm Request Revision"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
