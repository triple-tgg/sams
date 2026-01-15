"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronDown, Trash2, MapPin, Plane, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractFormData, PricingRate } from "./types";
import { defaultPricingRate } from "./data";
import { useStationsOptions } from "@/lib/api/hooks/useStations";
import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ServicePricingStepProps {
    formData: ContractFormData;
    onPricingRatesChange: (pricingRates: PricingRate[]) => void;
}

// Reusable Price Input with combined USD suffix
const PriceInput = ({
    id,
    label,
    value,
    onChange,
    suffix,
}: {
    id: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix: string;
}) => (
    <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs">{label}</Label>
        <div className="flex items-center">
            <Input
                id={id}
                type="number"
                min={0}
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="rounded-r-none border-r-0 text-right"
            />
            <span className="inline-flex items-center px-3 h-9 text-sm border rounded-r-md bg-muted text-muted-foreground whitespace-nowrap">
                USD{suffix}
            </span>
        </div>
    </div>
);

export const ServicePricingStep = ({ formData, onPricingRatesChange }: ServicePricingStepProps) => {
    const [expandedRates, setExpandedRates] = useState<Set<string>>(new Set());
    const { options: stationOptions, isLoading: isLoadingStations } = useStationsOptions();
    const { options: aircraftTypeOptions, isLoading: isLoadingAircraftTypes } = useAircraftTypes();

    const handleAddPricing = () => {
        const newRate: PricingRate = {
            id: `rate-${Date.now()}`,
            ...defaultPricingRate,
        };
        const updatedRates = [...formData.pricingRates, newRate];
        onPricingRatesChange(updatedRates);
        // Auto-expand the new rate
        setExpandedRates(prev => new Set(Array.from(prev).concat(newRate.id)));
    };

    const handleDeleteRate = (rateId: string) => {
        const updatedRates = formData.pricingRates.filter(rate => rate.id !== rateId);
        onPricingRatesChange(updatedRates);
        setExpandedRates(prev => {
            const newSet = new Set(prev);
            newSet.delete(rateId);
            return newSet;
        });
    };

    const handleRateChange = (rateId: string, field: keyof PricingRate, value: string | number | string[]) => {
        const updatedRates = formData.pricingRates.map(rate => {
            if (rate.id === rateId) {
                return { ...rate, [field]: value };
            }
            return rate;
        });
        onPricingRatesChange(updatedRates);
    };

    const toggleExpanded = (rateId: string) => {
        setExpandedRates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rateId)) {
                newSet.delete(rateId);
            } else {
                newSet.add(rateId);
            }
            return newSet;
        });
    };

    const handleAircraftTypeToggle = (rateId: string, aircraftCode: string, checked: boolean) => {
        const rate = formData.pricingRates.find(r => r.id === rateId);
        if (!rate) return;

        let newTypes: string[];
        if (checked) {
            newTypes = [...rate.aircraftTypes, aircraftCode];
        } else {
            newTypes = rate.aircraftTypes.filter(t => t !== aircraftCode);
        }
        handleRateChange(rateId, "aircraftTypes", newTypes);
    };

    const handleServiceLocationToggle = (rateId: string, locationCode: string, checked: boolean) => {
        const rate = formData.pricingRates.find(r => r.id === rateId);
        if (!rate) return;

        let newLocations: string[];
        if (checked) {
            newLocations = [...rate.serviceLocation, locationCode];
        } else {
            newLocations = rate.serviceLocation.filter(l => l !== locationCode);
        }
        handleRateChange(rateId, "serviceLocation", newLocations);
    };

    const renderPricingForm = (rate: PricingRate) => {
        const handleNumberChange = (field: keyof PricingRate) => (value: number) => {
            handleRateChange(rate.id, field, value);
        };

        return (
            <div className="space-y-6 pt-4">
                {/* Transit Checks */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                    <h4 className="text-sm font-semibold text-primary">Transit Checks</h4>

                    {/* With Certificate */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">With Certificate</p>
                        <div className="grid grid-cols-2 gap-3">
                            <PriceInput
                                id={`${rate.id}-tsChkUnder2hrsCert`}
                                label="Transit Check <2hrs"
                                value={rate.tsChkUnder2hrsCert}
                                onChange={handleNumberChange("tsChkUnder2hrsCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk2to3hrsCert`}
                                label="Transit Check ≥2hrs and <3hrs"
                                value={rate.tsChk2to3hrsCert}
                                onChange={handleNumberChange("tsChk2to3hrsCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk3to4hrsCert`}
                                label="Transit Check ≥3hrs and <4hrs"
                                value={rate.tsChk3to4hrsCert}
                                onChange={handleNumberChange("tsChk3to4hrsCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk4to5hrsCert`}
                                label="Transit Check ≥4hrs and <5hrs"
                                value={rate.tsChk4to5hrsCert}
                                onChange={handleNumberChange("tsChk4to5hrsCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk5to6hrsCert`}
                                label="Transit Check ≥5hrs and <6hrs"
                                value={rate.tsChk5to6hrsCert}
                                onChange={handleNumberChange("tsChk5to6hrsCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-additionalFee6hrsPlusCert`}
                                label="Additional Fee ≥6hrs"
                                value={rate.additionalFee6hrsPlusCert}
                                onChange={handleNumberChange("additionalFee6hrsPlusCert")}
                                suffix="/Check"
                            />
                        </div>
                    </div>

                    {/* Without Certificate */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Without Certificate</p>
                        <div className="grid grid-cols-2 gap-3">
                            <PriceInput
                                id={`${rate.id}-tsChkUnder2hrsNoCert`}
                                label="Transit Check <2hrs"
                                value={rate.tsChkUnder2hrsNoCert}
                                onChange={handleNumberChange("tsChkUnder2hrsNoCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk2to3hrsNoCert`}
                                label="Transit Check ≥2hrs and <3hrs"
                                value={rate.tsChk2to3hrsNoCert}
                                onChange={handleNumberChange("tsChk2to3hrsNoCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk3to4hrsNoCert`}
                                label="Transit Check ≥3hrs and <4hrs"
                                value={rate.tsChk3to4hrsNoCert}
                                onChange={handleNumberChange("tsChk3to4hrsNoCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk4to5hrsNoCert`}
                                label="Transit Check ≥4hrs and <5hrs"
                                value={rate.tsChk4to5hrsNoCert}
                                onChange={handleNumberChange("tsChk4to5hrsNoCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-tsChk5to6hrsNoCert`}
                                label="Transit Check ≥5hrs and <6hrs"
                                value={rate.tsChk5to6hrsNoCert}
                                onChange={handleNumberChange("tsChk5to6hrsNoCert")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-additionalFee6hrsPlusNoCert`}
                                label="Additional Fee ≥6hrs"
                                value={rate.additionalFee6hrsPlusNoCert}
                                onChange={handleNumberChange("additionalFee6hrsPlusNoCert")}
                                suffix="/Check"
                            />
                        </div>
                    </div>

                    {/* Other */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Other</p>
                        <div className="grid grid-cols-2 gap-3">
                            <PriceInput
                                id={`${rate.id}-standbyPerCheck`}
                                label="Stand-by"
                                value={rate.standbyPerCheck}
                                onChange={handleNumberChange("standbyPerCheck")}
                                suffix="/Check"
                            />
                            <PriceInput
                                id={`${rate.id}-onCallPerCheck`}
                                label="On Call"
                                value={rate.onCallPerCheck}
                                onChange={handleNumberChange("onCallPerCheck")}
                                suffix="/Check"
                            />
                        </div>
                    </div>
                </div>

                {/* Routine Checks */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Routine Checks</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                            id={`${rate.id}-dailyCheck`}
                            label="Daily Check"
                            value={rate.dailyCheck}
                            onChange={handleNumberChange("dailyCheck")}
                            suffix="/Check"
                        />
                        <PriceInput
                            id={`${rate.id}-preFlightCheck`}
                            label="Pre-Flight Check"
                            value={rate.preFlightCheck}
                            onChange={handleNumberChange("preFlightCheck")}
                            suffix="/Check"
                        />
                        <PriceInput
                            id={`${rate.id}-weeklyCheck`}
                            label="Weekly Check"
                            value={rate.weeklyCheck}
                            onChange={handleNumberChange("weeklyCheck")}
                            suffix="/Check"
                        />
                    </div>
                </div>

                {/* Labor Rates */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Labor Rates</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                            id={`${rate.id}-additionalLaeMhHr`}
                            label="Additional LAE MH"
                            value={rate.additionalLaeMhHr}
                            onChange={handleNumberChange("additionalLaeMhHr")}
                            suffix="/Hr"
                        />
                        <PriceInput
                            id={`${rate.id}-additionalMechMhHr`}
                            label="Additional Mechanic MH"
                            value={rate.additionalMechMhHr}
                            onChange={handleNumberChange("additionalMechMhHr")}
                            suffix="/Hr"
                        />
                    </div>
                </div>

                {/* Wheel Services */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Wheel Services</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                            id={`${rate.id}-lhOrRhNoseWheelRpl`}
                            label="LH or RH Nose Wheel RPL"
                            value={rate.lhOrRhNoseWheelRpl}
                            onChange={handleNumberChange("lhOrRhNoseWheelRpl")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-lhAndRhNoseWheelRpl`}
                            label="LH & RH Nose Wheel RPL"
                            value={rate.lhAndRhNoseWheelRpl}
                            onChange={handleNumberChange("lhAndRhNoseWheelRpl")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-mainWheelRpl`}
                            label="Main Wheel RPL"
                            value={rate.mainWheelRpl}
                            onChange={handleNumberChange("mainWheelRpl")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-twoMwRplNoReposition`}
                            label="2 MW RPL (Jack not reposition)"
                            value={rate.twoMwRplNoReposition}
                            onChange={handleNumberChange("twoMwRplNoReposition")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-twoMwRplReposition`}
                            label="2 MW RPL (Jack reposition)"
                            value={rate.twoMwRplReposition}
                            onChange={handleNumberChange("twoMwRplReposition")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-brakeRpl`}
                            label="Brake RPL"
                            value={rate.brakeRpl}
                            onChange={handleNumberChange("brakeRpl")}
                            suffix="/Service"
                        />
                    </div>
                </div>

                {/* Ground Services */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Ground Services</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                            id={`${rate.id}-towingPerService`}
                            label="Towing"
                            value={rate.towingPerService}
                            onChange={handleNumberChange("towingPerService")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-storageFeeMonth`}
                            label="Storage Fee"
                            value={rate.storageFeeMonth}
                            onChange={handleNumberChange("storageFeeMonth")}
                            suffix="/Sq.M./Month"
                        />
                        <PriceInput
                            id={`${rate.id}-storageHandlingFee`}
                            label="Storage Handling Fee"
                            value={rate.storageHandlingFee}
                            onChange={handleNumberChange("storageHandlingFee")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-maintStepHr`}
                            label="Maint. Step"
                            value={rate.maintStepHr}
                            onChange={handleNumberChange("maintStepHr")}
                            suffix="/Hr"
                        />
                        <PriceInput
                            id={`${rate.id}-marshalling`}
                            label="Marshalling"
                            value={rate.marshalling}
                            onChange={handleNumberChange("marshalling")}
                            suffix="/Service"
                        />
                    </div>
                </div>

                {/* Fluids & N2 */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Fluids & Nitrogen</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                            id={`${rate.id}-engineOilQuad`}
                            label="Engine Oil"
                            value={rate.engineOilQuad}
                            onChange={handleNumberChange("engineOilQuad")}
                            suffix="/Quart"
                        />
                        <PriceInput
                            id={`${rate.id}-hydraulicFluidQuad`}
                            label="Hydraulic Fluid"
                            value={rate.hydraulicFluidQuad}
                            onChange={handleNumberChange("hydraulicFluidQuad")}
                            suffix="/Quart"
                        />
                        <PriceInput
                            id={`${rate.id}-lowPressureN2`}
                            label="Low Pressure N2"
                            value={rate.lowPressureN2}
                            onChange={handleNumberChange("lowPressureN2")}
                            suffix="/Service"
                        />
                        <PriceInput
                            id={`${rate.id}-highPressureN2`}
                            label="High Pressure N2"
                            value={rate.highPressureN2}
                            onChange={handleNumberChange("highPressureN2")}
                            suffix="/Service"
                        />
                    </div>
                </div>

                {/* Other Charges */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Other Charges</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                            id={`${rate.id}-defectRectificationTools`}
                            label="Defect Rectification Tools"
                            value={rate.defectRectificationTools}
                            onChange={handleNumberChange("defectRectificationTools")}
                            suffix="/Invoice"
                        />
                        <PriceInput
                            id={`${rate.id}-materialHandlingFee`}
                            label="Material Handling Fee"
                            value={rate.materialHandlingFee}
                            onChange={handleNumberChange("materialHandlingFee")}
                            suffix="/Invoice"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Empty State / Add Button */}
            {formData.pricingRates.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">No Pricing Rates</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add pricing rates for different service locations and aircraft types
                            </p>
                        </div>
                        <Button onClick={handleAddPricing} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Pricing
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Add Button at top */}
                    <div className="flex justify-end">
                        <Button onClick={handleAddPricing} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Pricing
                        </Button>
                    </div>

                    {/* Rate Cards */}
                    <div className="space-y-3">
                        {formData.pricingRates.map((rate, index) => (
                            <Collapsible
                                key={rate.id}
                                open={expandedRates.has(rate.id)}
                                onOpenChange={() => toggleExpanded(rate.id)}
                            >
                                <div className="border rounded-lg overflow-hidden">
                                    {/* Header */}
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-3 p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                                            <ChevronDown
                                                className={cn(
                                                    "h-5 w-5 text-muted-foreground transition-transform",
                                                    expandedRates.has(rate.id) && "rotate-180"
                                                )}
                                            />
                                            <div className="flex-1 flex items-center gap-4">
                                                <span className="font-semibold text-sm">
                                                    Rate #{index + 1}
                                                </span>
                                                {rate.serviceLocation.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                        <MapPin className="h-3 w-3" />
                                                        {rate.serviceLocation.length} Location{rate.serviceLocation.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {rate.aircraftTypes.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                                        <Plane className="h-3 w-3" />
                                                        {rate.aircraftTypes.length} Aircraft
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRate(rate.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CollapsibleTrigger>

                                    {/* Content */}
                                    <CollapsibleContent>
                                        <div className="p-4 border-t space-y-4">
                                            {/* Service Location & Aircraft Types */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Service Location */}
                                                <div className="space-y-2">
                                                    <Label>Service Location</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-between h-auto min-h-9 py-2"
                                                                disabled={isLoadingStations}
                                                            >
                                                                <span className="flex flex-wrap gap-1">
                                                                    {rate.serviceLocation.length > 0 ? (
                                                                        rate.serviceLocation.map((loc) => (
                                                                            <span
                                                                                key={loc}
                                                                                className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
                                                                            >
                                                                                {loc}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-muted-foreground">
                                                                            {isLoadingStations ? "Loading..." : "Select Locations"}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-2" align="start">
                                                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                                {stationOptions.map((station) => (
                                                                    <div
                                                                        key={station.value}
                                                                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                                                        onClick={() => handleServiceLocationToggle(
                                                                            rate.id,
                                                                            station.value,
                                                                            !rate.serviceLocation.includes(station.value)
                                                                        )}
                                                                    >
                                                                        <Checkbox
                                                                            checked={rate.serviceLocation.includes(station.value)}
                                                                            onCheckedChange={(checked) => handleServiceLocationToggle(
                                                                                rate.id,
                                                                                station.value,
                                                                                checked as boolean
                                                                            )}
                                                                        />
                                                                        <span className="text-sm flex-1">{station.label}</span>
                                                                        {rate.serviceLocation.includes(station.value) && (
                                                                            <Check className="h-4 w-4 text-primary" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                {/* Aircraft Types */}
                                                <div className="space-y-2">
                                                    <Label>Aircraft Types</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-between h-auto min-h-9 py-2"
                                                                disabled={isLoadingAircraftTypes}
                                                            >
                                                                <span className="flex flex-wrap gap-1">
                                                                    {rate.aircraftTypes.length > 0 ? (
                                                                        rate.aircraftTypes.map((type) => (
                                                                            <span
                                                                                key={type}
                                                                                className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
                                                                            >
                                                                                {type}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-muted-foreground">
                                                                            {isLoadingAircraftTypes ? "Loading..." : "Select Aircraft Types"}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-2" align="start">
                                                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                                {aircraftTypeOptions.map((aircraft) => (
                                                                    <div
                                                                        key={aircraft.value}
                                                                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                                                        onClick={() => handleAircraftTypeToggle(
                                                                            rate.id,
                                                                            aircraft.value,
                                                                            !rate.aircraftTypes.includes(aircraft.value)
                                                                        )}
                                                                    >
                                                                        <Checkbox
                                                                            checked={rate.aircraftTypes.includes(aircraft.value)}
                                                                            onCheckedChange={(checked) => handleAircraftTypeToggle(
                                                                                rate.id,
                                                                                aircraft.value,
                                                                                checked as boolean
                                                                            )}
                                                                        />
                                                                        <span className="text-sm flex-1">{aircraft.label}</span>
                                                                        {rate.aircraftTypes.includes(aircraft.value) && (
                                                                            <Check className="h-4 w-4 text-primary" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>

                                            {/* Pricing Form */}
                                            {renderPricingForm(rate)}
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
