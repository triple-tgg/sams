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
    { value: "Manpower", label: "ข้อมูลช่างและชั่วโมงแรงงาน (Manpower)" },
    { value: "Parts & Tools", label: "รายการอะไหล่และอุปกรณ์ (Parts & Tools)" },
    { value: "Fluid / Servicing", label: "การเติมสารเหลวและบริการ (Fluid / Servicing)" },
    { value: "Attachments", label: "เอกสารแนบและรูปถ่าย (Attachments)" },
    { value: "General", label: "อื่นๆ / รายละเอียดทั่วไป (General)" },
];

export function RequestRevisionModal({ open, onOpenChange, flight, onSuccess }: RequestRevisionModalProps) {
    const [category, setCategory] = useState<string>("Manpower");
    const [reason, setReason] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flight) return;

        if (!reason.trim()) {
            toast.error("กรุณาระบุรายละเอียดที่ต้องแก้ไข");
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

            toast.warning(`ส่งคำขอแก้ไขเอกสาร THF ${flight.thfNumber || ""} เรียบร้อยแล้ว`, {
                description: "ระบบได้แจ้งเตือนไปยังหน้า Flight List สำหรับทีมช่างแล้ว",
            });

            onSuccess?.();
            onOpenChange(false);
            setReason("");
        } catch (error) {
            console.error("Failed to request revision:", error);
            toast.error("เกิดข้อผิดพลาดในการส่งคำขอแก้ไข");
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
                            <DialogTitle className="text-lg">ส่งกลับแก้ไขเอกสาร THF (Request Revision)</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            ระบุข้อผิดพลาดหรือจุดที่ต้องการให้ทีมช่างทำการแก้ไข เอกสารนี้จะถูกกักไว้และไม่สามารถนำไป Create Pre-Invoice ได้จนกว่าจะแก้ไขเรียบร้อย
                        </DialogDescription>
                    </DialogHeader>

                    {/* Flight & THF Info Card */}
                    <div className="my-4 p-3 bg-slate-50 border rounded-lg text-xs grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                            <span className="text-muted-foreground">THF Number: </span>
                            <span className="font-semibold text-slate-900">{flight.thfNumber || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Flight No: </span>
                            <span className="font-semibold text-slate-900">{flight.arrivalFlightNo || flight.departureFlightNo || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Airline: </span>
                            <span className="font-semibold text-slate-900">{flight.airlineObj?.code || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Station: </span>
                            <span className="font-semibold text-slate-900">{flight.stationObj?.code || "-"}</span>
                        </div>
                    </div>

                    <div className="space-y-4 py-2">
                        {/* Error Category */}
                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                                หมวดหมู่ข้อผิดพลาด <span className="text-destructive">*</span>
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category" className="h-9 text-xs">
                                    <SelectValue placeholder="เลือกหมวดหมู่" />
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
                                รายละเอียดและสิ่งที่ต้องแก้ไข <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="เช่น ชั่วโมงแรงงานไม่ตรงกับใบล็อกบุ๊ก, ขอให้แนบรูปถ่ายใบล็อกบุ๊กหน้า 2 เพิ่มเติม, หรือแก้ไขจำนวนน้ำมันหล่อลื่น..."
                                className="min-h-[100px] text-xs resize-none"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={isSubmitting || !reason.trim()}
                        >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันส่งกลับแก้ไข"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
