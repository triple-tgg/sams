"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContractFormData } from "./types";

interface ServicePricingStepProps {
    formData: ContractFormData;
    onFormChange: (field: keyof ContractFormData, value: string | number) => void;
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

export const ServicePricingStep = ({ formData, onFormChange }: ServicePricingStepProps) => {
    const handleNumberChange = (field: keyof ContractFormData) => (value: number) => {
        onFormChange(field, value);
    };

    return (
        <div className="space-y-6">
            {/* Transit Checks */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-primary">Transit Checks</h4>
                <div className="grid grid-cols-2 gap-3">
                    <PriceInput
                        id="tsChkUnder2hrsCert"
                        label="T/S CHK < 2hrs with Cert."
                        value={formData.tsChkUnder2hrsCert}
                        onChange={handleNumberChange("tsChkUnder2hrsCert")}
                        suffix="/Check"
                    />
                    <PriceInput
                        id="tsChk2to3hrsNoCert"
                        label="T/S CHK ≥2 but <3hrs w/o Cert."
                        value={formData.tsChk2to3hrsNoCert}
                        onChange={handleNumberChange("tsChk2to3hrsNoCert")}
                        suffix="/Check"
                    />
                    <PriceInput
                        id="tsChk3to4hrsNoCert"
                        label="T/S CHK ≥3 but <4hrs w/o Cert."
                        value={formData.tsChk3to4hrsNoCert}
                        onChange={handleNumberChange("tsChk3to4hrsNoCert")}
                        suffix="/Check"
                    />
                    <PriceInput
                        id="tsChkUnder2hrsNoCert"
                        label="T/S CHK ≤2hrs w/o Cert."
                        value={formData.tsChkUnder2hrsNoCert}
                        onChange={handleNumberChange("tsChkUnder2hrsNoCert")}
                        suffix="/Check"
                    />
                    <PriceInput
                        id="tsChkOver2hrsNoCert"
                        label="T/S CHK >2hrs w/o Cert."
                        value={formData.tsChkOver2hrsNoCert}
                        onChange={handleNumberChange("tsChkOver2hrsNoCert")}
                        suffix="/Check"
                    />
                </div>
            </div>

            {/* Routine Checks */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-primary">Routine Checks</h4>
                <div className="grid grid-cols-2 gap-3">
                    <PriceInput
                        id="standbyPerCheck"
                        label="Stand-by"
                        value={formData.standbyPerCheck}
                        onChange={handleNumberChange("standbyPerCheck")}
                        suffix="/Check"
                    />
                    <PriceInput
                        id="preFlightCheck"
                        label="Pre-Flight Check"
                        value={formData.preFlightCheck}
                        onChange={handleNumberChange("preFlightCheck")}
                        suffix="/Check"
                    />
                    <PriceInput
                        id="weeklyCheck"
                        label="Weekly Check"
                        value={formData.weeklyCheck}
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
                        id="additionalLaeMhHr"
                        label="Additional LAE MH"
                        value={formData.additionalLaeMhHr}
                        onChange={handleNumberChange("additionalLaeMhHr")}
                        suffix="/Hr"
                    />
                    <PriceInput
                        id="additionalMechMhHr"
                        label="Additional Mechanic MH"
                        value={formData.additionalMechMhHr}
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
                        id="lhOrRhNoseWheelRpl"
                        label="LH or RH Nose Wheel RPL"
                        value={formData.lhOrRhNoseWheelRpl}
                        onChange={handleNumberChange("lhOrRhNoseWheelRpl")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="lhAndRhNoseWheelRpl"
                        label="LH & RH Nose Wheel RPL"
                        value={formData.lhAndRhNoseWheelRpl}
                        onChange={handleNumberChange("lhAndRhNoseWheelRpl")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="mainWheelRpl"
                        label="Main Wheel RPL"
                        value={formData.mainWheelRpl}
                        onChange={handleNumberChange("mainWheelRpl")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="twoMwRplNoReposition"
                        label="2 MW RPL (Jack not reposition)"
                        value={formData.twoMwRplNoReposition}
                        onChange={handleNumberChange("twoMwRplNoReposition")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="twoMwRplReposition"
                        label="2 MW RPL (Jack reposition)"
                        value={formData.twoMwRplReposition}
                        onChange={handleNumberChange("twoMwRplReposition")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="brakeRpl"
                        label="Brake RPL"
                        value={formData.brakeRpl}
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
                        id="towingPerService"
                        label="Towing"
                        value={formData.towingPerService}
                        onChange={handleNumberChange("towingPerService")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="storageFeeMonth"
                        label="Storage Fee"
                        value={formData.storageFeeMonth}
                        onChange={handleNumberChange("storageFeeMonth")}
                        suffix="/Month"
                    />
                    <PriceInput
                        id="storageHandlingFee"
                        label="Storage Handling Fee"
                        value={formData.storageHandlingFee}
                        onChange={handleNumberChange("storageHandlingFee")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="maintStepHr"
                        label="Maint. Step"
                        value={formData.maintStepHr}
                        onChange={handleNumberChange("maintStepHr")}
                        suffix="/Hr"
                    />
                    <PriceInput
                        id="marshalling"
                        label="Marshalling"
                        value={formData.marshalling}
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
                        id="engineOilQuad"
                        label="Engine Oil"
                        value={formData.engineOilQuad}
                        onChange={handleNumberChange("engineOilQuad")}
                        suffix="/Quad"
                    />
                    <PriceInput
                        id="hydraulicFluidQuad"
                        label="Hydraulic Fluid"
                        value={formData.hydraulicFluidQuad}
                        onChange={handleNumberChange("hydraulicFluidQuad")}
                        suffix="/Quad"
                    />
                    <PriceInput
                        id="lowPressureN2"
                        label="Low Pressure N2"
                        value={formData.lowPressureN2}
                        onChange={handleNumberChange("lowPressureN2")}
                        suffix="/Service"
                    />
                    <PriceInput
                        id="highPressureN2"
                        label="High Pressure N2"
                        value={formData.highPressureN2}
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
                        id="defectRectificationTools"
                        label="Defect Rectification Tools"
                        value={formData.defectRectificationTools}
                        onChange={handleNumberChange("defectRectificationTools")}
                        suffix="/Invoice"
                    />
                    <PriceInput
                        id="materialHandlingFee"
                        label="Material Handling Fee"
                        value={formData.materialHandlingFee}
                        onChange={handleNumberChange("materialHandlingFee")}
                        suffix="/Invoice"
                    />
                </div>
            </div>
        </div>
    );
};
