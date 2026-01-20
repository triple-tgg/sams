"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { ContractFormData, PricingRate } from "./types";
import { defaultFormData, FORM_STEPS } from "./data";
import { GeneralInfoStep } from "./GeneralInfoStep";
import { ServicePricingStep } from "./ServicePricingStep";
import { ContractViewA4 } from "./ContractViewA4";
import { useUpsertContract, useContractById } from "@/lib/api/hooks/useContractOperations";
import { useReduxAuth } from "@/lib/api/hooks/useReduxAuth";
import { ContractUpsertRequest, ContractPricingDataRequest } from "@/lib/api/contract/upsertContract";
import { ContractDetail } from "@/lib/api/contract/getContractById";

// Upload status type
type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

// Dialog mode type
type DialogMode = "create" | "edit" | "view";

interface ContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: DialogMode;
    contractId?: number;
}

// Transform API data to form data
const transformApiToFormData = (data: ContractDetail): ContractFormData => {
    return {
        contractId: data.id,
        airlineId: data.airlineObj?.id || 0,
        contractTypeId: data.contractTypeObj?.id || 0,
        contractStatusId: data.contractStatusObj?.id || 0,
        referenceDocument: "",
        contractType: data.contractTypeObj?.code || "",
        contractCode: data.contractNo,
        station: data.serviceStation?.[0] || "",
        handlerCompanyName: "",
        handlerCompanyAddress: "",
        carrierName: data.airlineObj?.code || "",
        carrierAddress: "",
        effectiveFrom: data.effectiveFrom,
        validFrom: data.validFrom,
        expiresOn: data.expiresOn,
        isNoExpiryDate: data.isNoExpiryDate ?? false,
        status: data.contractStatusObj?.code || "",
        pricingRates: data.pricingDataList?.map((p) => ({
            id: p.id,
            serviceLocation: p.stationCodeList || [],
            aircraftTypes: p.aircraftTypeCodeList || [], // Use aircraft type codes from API
            aircraftTypeId: 0, // Deprecated, kept for backwards compatibility
            tsChkUnder2hrsCert: p.tsChkUnder2hrsCert || 0,
            tsChk2to3hrsCert: p.tsChk2to3hrsCert || 0,
            tsChk3to4hrsCert: p.tsChk3to4hrsCert || 0,
            tsChk4to5hrsCert: p.tsChk4to5hrsCert || 0,
            tsChk5to6hrsCert: p.tsChk5to6hrsCert || 0,
            additionalFee6hrsPlusCert: p.additionalFee6hrsPlusCert || 0,
            tsChkUnder2hrsNoCert: p.tsChkUnder2hrsNoCert || 0,
            tsChk2to3hrsNoCert: p.tsChk2to3hrsNoCert || 0,
            tsChk3to4hrsNoCert: p.tsChk3to4hrsNoCert || 0,
            tsChk4to5hrsNoCert: p.tsChk4to5hrsNoCert || 0,
            tsChk5to6hrsNoCert: p.tsChk5to6hrsNoCert || 0,
            additionalFee6hrsPlusNoCert: p.additionalFee6hrsPlusNoCert || 0,
            standbyPerCheck: p.standbyPerCheck || 0,
            onCallPerCheck: p.onCallPerCheck || 0,
            dailyCheck: p.dailyCheck || 0,
            preFlightCheck: p.preFlightCheck || 0,
            weeklyCheck: p.weeklyCheck || 0,
            additionalLaeMhHr: p.additionalLaeMhHr || 0,
            additionalMechMhHr: p.additionalMechMhHr || 0,
            lhOrRhNoseWheelRpl: p.lhOrRhNoseWheelRpl || 0,
            lhAndRhNoseWheelRpl: p.lhAndRhNoseWheelRpl || 0,
            mainWheelRpl: p.mainWheelRpl || 0,
            twoMwRplNoReposition: p.twoMwRplNoReposition || 0,
            twoMwRplReposition: p.twoMwRplReposition || 0,
            brakeRpl: p.brakeRpl || 0,
            towingPerService: p.towingPerService || 0,
            storageFeeMonth: p.storageFeeMonth || 0,
            storageHandlingFee: p.storageHandlingFee || 0,
            maintStepHr: p.maintStepHr || 0,
            marshalling: p.marshalling || 0,
            engineOilQuad: p.engineOilQuad || 0,
            hydraulicFluidQuad: p.hydraulicFluidQuad || 0,
            lowPressureN2: p.lowPressureN2 || 0,
            highPressureN2: p.highPressureN2 || 0,
            defectRectificationTools: p.defectRectificationTools || 0,
            materialHandlingFee: p.materialHandlingFee || 0,
        })) || [],
        yearlyIncreaseRate: "",
        billingAttn: "",
        billingEmail: "",
        billingPhone: "",
        billingAddress: "",
        paymentTerms: "",
        latePenalty: "",
        creditTerms: data.creditTerms || "",
        contractDocumentPath: data.attachContractObj?.storagePath || "",
        contractDocumentName: data.attachContractObj?.realName || "",
    };
};

const transformFormDataToRequest = (
    formData: ContractFormData,
    userName: string,
    isCreate: boolean = false
): ContractUpsertRequest => {
    const pricingDataList: ContractPricingDataRequest[] = formData.pricingRates.map((rate) => ({
        // For create mode, always set id = 0; for update mode, use the existing id
        id: isCreate ? 0 : rate.id,
        stationCodeList: rate.serviceLocation,
        aircraftTypeCodeList: rate.aircraftTypes, // Use aircraft type codes from form
        tsChkUnder2hrsCert: rate.tsChkUnder2hrsCert,
        tsChk2to3hrsCert: rate.tsChk2to3hrsCert,
        tsChk3to4hrsCert: rate.tsChk3to4hrsCert,
        tsChk4to5hrsCert: rate.tsChk4to5hrsCert,
        tsChk5to6hrsCert: rate.tsChk5to6hrsCert,
        additionalFee6hrsPlusCert: rate.additionalFee6hrsPlusCert,
        tsChkUnder2hrsNoCert: rate.tsChkUnder2hrsNoCert,
        tsChk2to3hrsNoCert: rate.tsChk2to3hrsNoCert,
        tsChk3to4hrsNoCert: rate.tsChk3to4hrsNoCert,
        tsChk4to5hrsNoCert: rate.tsChk4to5hrsNoCert,
        tsChk5to6hrsNoCert: rate.tsChk5to6hrsNoCert,
        additionalFee6hrsPlusNoCert: rate.additionalFee6hrsPlusNoCert,
        standbyPerCheck: rate.standbyPerCheck,
        onCallPerCheck: rate.onCallPerCheck,
        dailyCheck: rate.dailyCheck,
        preFlightCheck: rate.preFlightCheck,
        weeklyCheck: rate.weeklyCheck,
        additionalLaeMhHr: rate.additionalLaeMhHr,
        additionalMechMhHr: rate.additionalMechMhHr,
        lhOrRhNoseWheelRpl: rate.lhOrRhNoseWheelRpl,
        lhAndRhNoseWheelRpl: rate.lhAndRhNoseWheelRpl,
        mainWheelRpl: rate.mainWheelRpl,
        twoMwRplNoReposition: rate.twoMwRplNoReposition,
        twoMwRplReposition: rate.twoMwRplReposition,
        brakeRpl: rate.brakeRpl,
        towingPerService: rate.towingPerService,
        storageFeeMonth: rate.storageFeeMonth,
        storageHandlingFee: rate.storageHandlingFee,
        maintStepHr: rate.maintStepHr,
        marshalling: rate.marshalling,
        engineOilQuad: rate.engineOilQuad,
        hydraulicFluidQuad: rate.hydraulicFluidQuad,
        lowPressureN2: rate.lowPressureN2,
        highPressureN2: rate.highPressureN2,
        defectRectificationTools: rate.defectRectificationTools,
        materialHandlingFee: rate.materialHandlingFee,
    }));

    return {
        contractId: formData.contractId,
        contractNo: formData.contractCode,
        airlineId: formData.airlineId || parseInt(formData.carrierName) || 0,
        contractTypeId: formData.contractTypeId,
        effectiveFrom: formData.effectiveFrom,
        validFrom: formData.validFrom,
        expiresOn: formData.expiresOn,
        isNoExpiryDate: formData.isNoExpiryDate,
        creditTerms: formData.creditTerms,
        contractStatusId: formData.contractStatusId || parseInt(formData.status) || 0,
        attachContractList: formData.contractDocumentPath ? {
            storagePath: formData.contractDocumentPath,
            realName: formData.contractDocumentName || formData.contractDocumentPath.split('/').pop() || "",
            fileType: "contract",
        } : null,
        pricingDataList,
        userName,
    };
};

export const ContractDialog = ({
    open,
    onOpenChange,
    mode = "create",
    contractId
}: ContractDialogProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<ContractFormData>(defaultFormData);
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Get user info for userName field
    const { getUserName } = useReduxAuth();
    const userName = getUserName() || "";

    // API hooks
    const upsertMutation = useUpsertContract();
    const { data: contractData, isLoading: isLoadingContract } = useContractById(
        contractId || 0,
        open && !!contractId && (mode === "edit" || mode === "view")
    );

    // Load contract data for edit/view mode
    useEffect(() => {
        if (contractData?.responseData && (mode === "edit" || mode === "view")) {
            const transformedData = transformApiToFormData(contractData.responseData);
            setFormData(transformedData);
            // If there's an attachment, mark as uploaded
            if (contractData.responseData.attachContractObj?.storagePath) {
                setUploadStatus("uploaded");
            }
        }
    }, [contractData, mode]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setCurrentStep(1);
            setFormData(defaultFormData);
            setFile(null);
            setUploadStatus("idle");
        }
    }, [open]);

    const handleFormChange = (field: keyof ContractFormData, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePricingRatesChange = (pricingRates: PricingRate[]) => {
        setFormData((prev) => ({ ...prev, pricingRates }));
    };

    const handleStepClick = (stepId: number) => {
        if (mode === "view") {
            setCurrentStep(stepId);
            return;
        }
        if (stepId <= currentStep + 1) {
            if (currentStep === 1 && stepId > 1) {
                if (file && uploadStatus !== "uploaded") {
                    alert("Please upload the selected file before proceeding.");
                    return;
                }
            }
            setCurrentStep(stepId);
        }
    };

    // Validation for Step 1 (Contract Info)
    const validateStep1 = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (!formData.contractCode.trim()) {
            errors.contractCode = "Contract No. is required";
        }
        if (!formData.carrierName) {
            errors.carrierName = "Customer Airline is required";
        }
        if (!formData.effectiveFrom) {
            errors.effectiveFrom = "Effective From date is required";
        }
        if (!formData.isNoExpiryDate && !formData.expiresOn) {
            errors.expiresOn = "Expires On date is required";
        }
        return errors;
    };

    // Validation for Step 2 (Service Rates)
    const validateStep2 = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (formData.pricingRates.length > 0) {
            formData.pricingRates.forEach((rate, index) => {
                if (rate.serviceLocation.length === 0) {
                    errors[`rate_${rate.id}_serviceLocation`] = "Service Location is required";
                }
                if (rate.aircraftTypes.length === 0) {
                    errors[`rate_${rate.id}_aircraftTypes`] = "Aircraft Types is required";
                }
            });
        }
        return errors;
    };

    const handleNext = () => {
        if (currentStep < FORM_STEPS.length) {
            // File upload check
            if (currentStep === 1 && file && uploadStatus !== "uploaded") {
                alert("Please upload the selected file before proceeding.");
                return;
            }

            // Validate Step 1
            if (currentStep === 1) {
                const errors = validateStep1();
                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    return;
                }
            }

            setFieldErrors({});
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            // Validate Step 2 before submit
            const step2Errors = validateStep2();
            if (Object.keys(step2Errors).length > 0) {
                setFieldErrors(step2Errors);
                return;
            }

            // Pass isCreate = true when mode is "create" to set pricingDataList id = 0
            const isCreate = mode === "create";
            const requestData = transformFormDataToRequest(formData, userName, isCreate);
            console.log("Submitting contract:", requestData);

            await upsertMutation.mutateAsync(requestData);

            handleClose();
        } catch (error) {
            console.error("Failed to save contract:", error);
            alert("Failed to save contract. Please try again.");
        }
    };

    const handleClose = () => {
        setCurrentStep(1);
        setFormData(defaultFormData);
        setFile(null);
        setUploadStatus("idle");
        setFieldErrors({});
        onOpenChange(false);
    };

    const getDialogTitle = () => {
        switch (mode) {
            case "edit": return "Edit Contract";
            case "view": return "View Contract";
            default: return "New Contract";
        }
    };

    const getDialogSubtitle = () => {
        switch (mode) {
            case "edit": return "Edit contract details";
            case "view": return "Contract information";
            default: return "Contract creation wizard";
        }
    };

    const isViewMode = mode === "view";
    const isSubmitting = upsertMutation.isPending;

    const renderStepContent = () => {
        if (isLoadingContract) {
            return (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        switch (currentStep) {
            case 1:
                return (
                    <GeneralInfoStep
                        formData={formData}
                        onFormChange={handleFormChange}
                        file={file}
                        onFileChange={setFile}
                        uploadStatus={uploadStatus}
                        onUploadStatusChange={setUploadStatus}
                        fieldErrors={fieldErrors}
                    />
                );
            case 2:
                return <ServicePricingStep formData={formData} onPricingRatesChange={handlePricingRatesChange} mode={mode} fieldErrors={fieldErrors} />;
            default:
                return null;
        }
    };

    // Render A4 view for view mode
    if (isViewMode) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent size="lg" className="max-h-[95vh] overflow-hidden p-0">
                    <div className="h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
                            <div>
                                <h2 className="text-lg font-semibold">View Contract</h2>
                                <p className="text-sm text-muted-foreground">Contract details and pricing information</p>
                            </div>
                            {/* <Button variant="ghost" size="icon" onClick={handleClose}>
                                <X className="h-4 w-4" />
                            </Button> */}
                        </div>

                        {/* A4 Content */}
                        <div className="flex-1 overflow-y-auto">
                            <ContractViewA4 formData={formData} isLoading={isLoadingContract} />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t bg-background flex justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Render step wizard for create/edit mode
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent size="md" className="max-h-[90vh] overflow-hidden p-0">
                <div className="flex h-[80vh]">
                    {/* Left Sidebar - Vertical Stepper */}
                    <div className="w-64 bg-primary text-primary-foreground p-6 flex flex-col">
                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-primary-foreground text-lg">
                                {getDialogTitle()}
                            </DialogTitle>
                            <p className="text-primary-foreground/70 text-sm">
                                {getDialogSubtitle()}
                            </p>
                        </DialogHeader>

                        {/* Steps */}
                        <div className="flex-1 relative">
                            <div className="space-y-2">
                                {FORM_STEPS.map((step) => {
                                    const isCompleted = currentStep > step.id;
                                    const isActive = currentStep === step.id;
                                    const isClickable = step.id <= currentStep + 1;

                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => handleStepClick(step.id)}
                                            disabled={!isClickable}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-lg transition-all text-left",
                                                isActive && "bg-white/20",
                                                isClickable && !isActive && "hover:bg-white/10",
                                                !isClickable && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                                                    isCompleted
                                                        ? "bg-white text-primary border-white"
                                                        : isActive
                                                            ? "bg-white text-primary border-white"
                                                            : "bg-transparent border-primary-foreground/40 text-primary-foreground/70"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    step.id
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <span
                                                    className={cn(
                                                        "font-medium",
                                                        isActive || isCompleted
                                                            ? "text-primary-foreground"
                                                            : "text-primary-foreground/70"
                                                    )}
                                                >
                                                    {step.title}
                                                </span>
                                            </div>
                                            {isActive && (
                                                <ChevronRight className="h-5 w-5 text-primary-foreground" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 flex flex-col bg-background">
                        {/* Content Header */}
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold">
                                {FORM_STEPS[currentStep - 1].title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {FORM_STEPS[currentStep - 1].titleEn}
                            </p>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {renderStepContent()}
                        </div>

                        {/* Footer */}
                        <DialogFooter className="p-6 border-t flex justify-between">
                            <div>
                                {currentStep > 1 && (
                                    <Button onClick={handlePrev}>
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                {currentStep < FORM_STEPS.length ? (
                                    <Button onClick={handleNext}>
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            mode === "edit" ? "Update Contract" : "Save Contract"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

