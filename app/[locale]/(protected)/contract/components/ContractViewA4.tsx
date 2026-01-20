"use client";

import { ContractFormData } from "./types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, MapPin, Plane, DollarSign } from "lucide-react";

interface ContractViewA4Props {
    formData: ContractFormData;
    isLoading?: boolean;
}

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// A4 paper aspect ratio: 210mm x 297mm (approximately 1:1.414)
export const ContractViewA4 = ({ formData, isLoading }: ContractViewA4Props) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-muted-foreground">Loading contract...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 p-6 min-h-full">
            {/* A4 Paper Container */}
            <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-8 relative">
                {/* Header */}
                <div className="border-b-2 border-primary pb-4 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <img
                                src="/images/logo/logo.png"
                                alt="SAM Logo"
                                className="h-14 w-auto object-contain"
                            />
                            <div>
                                <h1 className="text-2xl font-bold text-primary">SERVICE CONTRACT</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Contract No: <span className="font-semibold text-foreground">{formData.contractCode || "-"}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge
                                className={
                                    formData.status === "active"
                                        ? "bg-success/10 text-success border-success/20"
                                        : formData.status === "on hold"
                                            ? "bg-warning/10 text-warning border-warning/20"
                                            : "bg-destructive/10 text-destructive border-destructive/20"
                                }
                            >
                                {formData.status || "Unknown"}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                                Type: {formData.contractType || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contract Parties */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                    {/* Handler Company */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Handler Company</h3>
                        <div className="bg-muted/30 rounded-lg p-4">
                            <p className="font-semibold">{formData.handlerCompanyName || "SAM Airline Maintenance"}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {formData.handlerCompanyAddress || "Bangkok, Thailand"}
                            </p>
                        </div>
                    </div>

                    {/* Customer Airline */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Airline</h3>
                        <div className="bg-muted/30 rounded-lg p-4">
                            <p className="font-semibold">{formData.carrierName || "-"}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {formData.carrierAddress || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contract Duration */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Contract Duration
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Effective From</p>
                            <p className="font-semibold">{formatDate(formData.effectiveFrom)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Valid From</p>
                            <p className="font-semibold">{formatDate(formData.validFrom)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Expires On</p>
                            <p className="font-semibold">
                                {formData.isNoExpiryDate ? (
                                    <span className="text-success">No Expiry</span>
                                ) : (
                                    formatDate(formData.expiresOn)
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Terms */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        Payment Terms
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm">{formData.creditTerms || "N/A"}</p>
                    </div>
                </div>

                <Separator className="my-6" />

                {/* Pricing Rates */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Service Pricing Rates
                    </h3>

                    {formData.pricingRates.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No pricing rates configured.</p>
                    ) : (
                        <div className="space-y-4">
                            {formData.pricingRates.map((rate, index) => (
                                <div key={rate.id} className="border rounded-lg overflow-hidden">
                                    {/* Rate Header */}
                                    <div className="bg-primary/5 px-4 py-2 flex items-center justify-between">
                                        <span className="font-semibold text-sm">Rate #{index + 1}</span>
                                        <div className="flex gap-2">
                                            {rate.serviceLocation.length > 0 && (
                                                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                    <MapPin className="h-3 w-3" />
                                                    {rate.serviceLocation.join(", ")}
                                                </span>
                                            )}
                                            {rate.aircraftTypes.length > 0 && (
                                                <span className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                                                    <Plane className="h-3 w-3" />
                                                    {rate.aircraftTypes.join(", ")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rate Details - Compact Table */}
                                    <div className="p-4 text-xs">
                                        {/* Transit Checks - With Certificate */}
                                        <div className="mb-2">
                                            <p className="font-semibold text-primary mb-2">Transit Checks</p>
                                            <p className="font-semibold mb-1">With Certificate (Per Check)</p>
                                            <div className="grid grid-cols-6 gap-2">
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">&lt;2hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChkUnder2hrsCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">2-3hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk2to3hrsCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">3-4hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk3to4hrsCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">4-5hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk4to5hrsCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">5-6hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk5to6hrsCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">6+hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.additionalFee6hrsPlusCert)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transit Checks - Without Certificate */}
                                        <div className="mb-2">
                                            <p className="font-semibold mb-1">Without Certificate (Per Check)</p>
                                            <div className="grid grid-cols-6 gap-2">
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">&lt;2hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChkUnder2hrsNoCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">2-3hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk2to3hrsNoCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">3-4hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk3to4hrsNoCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">4-5hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk4to5hrsNoCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">5-6hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.tsChk5to6hrsNoCert)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-muted-foreground">6+hrs</p>
                                                    <p className="font-medium">${formatCurrency(rate.additionalFee6hrsPlusNoCert)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transit Checks - Other */}
                                        <div className="mb-5">
                                            <p className="font-semibold mb-1">Transit Checks (Other)</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Standby Per Check:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.standbyPerCheck)}/check</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">On-Call Per Check:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.onCallPerCheck)}/check</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Routine Checks */}
                                        <div className="mb-5">
                                            <p className="font-semibold text-primary mb-1">Routine Checks (Per Check)</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Daily:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.dailyCheck)}/check</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Pre-Flight:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.preFlightCheck)}/check</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Weekly:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.weeklyCheck)}/check</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Labor Rates */}
                                        <div className="mb-5">
                                            <p className="font-semibold text-primary mb-1">Labor Rates (Per Hour)</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Additional LAE MH:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.additionalLaeMhHr)}/hr</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Additional Mech MH:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.additionalMechMhHr)}/hr</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Wheel Services */}
                                        <div className="mb-5">
                                            <p className="font-semibold text-primary mb-1">Wheel Services</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">LH or RH Nose Wheel Rpl:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.lhOrRhNoseWheelRpl)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">LH & RH Nose Wheel Rpl:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.lhAndRhNoseWheelRpl)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Main Wheel Rpl:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.mainWheelRpl)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">2 MW Rpl (No Repos):</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.twoMwRplNoReposition)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">2 MW Rpl (Repos):</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.twoMwRplReposition)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Brake Rpl:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.brakeRpl)}/service</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ground Services */}
                                        <div className="mb-5">
                                            <p className="font-semibold text-primary mb-1">Ground Services</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Towing Per Service:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.towingPerService)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Storage Fee:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.storageFeeMonth)}/Sq.M./Month</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Storage Handling Fee:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.storageHandlingFee)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Maint Step:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.maintStepHr)}/hr</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Marshalling:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.marshalling)}/service</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fluids & Nitrogen */}
                                        <div className="mb-5">
                                            <p className="font-semibold text-primary mb-1">Fluids & Nitrogen (Per Quart/Per Service)</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Engine Oil:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.engineOilQuad)}/qt</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Hydraulic Fluid:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.hydraulicFluidQuad)}/qt</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Low Pressure N2:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.lowPressureN2)}/service</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">High Pressure N2:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.highPressureN2)}/service</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other Charges */}
                                        <div>
                                            <p className="font-semibold text-primary mb-1">Other Charges (Per Invoice)</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Defect Rectification Tools:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.defectRectificationTools)}/invoice</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Material Handling Fee:</span>
                                                    <span className="font-medium ml-1">${formatCurrency(rate.materialHandlingFee)}/invoice</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contract Document */}
                {formData.contractDocumentPath && (
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            Attached Document
                        </h3>
                        <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <a
                                href={formData.contractDocumentPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                            >
                                {formData.contractDocumentName || "View Document"}
                            </a>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="absolute bottom-8 left-8 right-8 pt-4 border-t text-xs text-muted-foreground">
                    <div className="flex justify-between">
                        <span>SAM Airline Maintenance - Service Contract</span>
                        <span>Page 1 of 1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
