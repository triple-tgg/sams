"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { ContractFormData, PricingRate, OperationalContact } from "./types";
import { defaultFormData, FORM_STEPS } from "./data";
import { GeneralInfoStep } from "./GeneralInfoStep";
import { ServicePricingStep } from "./ServicePricingStep";
import { OperationalContactStep } from "./OperationalContactStep";
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
        domicileCountry: data.domicileCountry || "",
        currency: data.currencyType?.trim().toLowerCase() || "",
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
            nightStop: p.nightStop || 0,
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
            disbursement: p.disbursement || 0,
            escalation: p.escalation || 0,
            latePenalty: p.latePenalty || 0,
        })) || [],
        yearlyIncreaseRate: "",
        billingAttn: "",
        billingEmail: "",
        billingPhone: "",
        billingAddress: "",
        paymentTerms: "",
        latePenalty: "",
        creditTerms: data.creditTerms || "",
        operationalContacts: data.personnelList?.map((p) => ({
            id: p.id || crypto.randomUUID(),
            title: p.title || "",
            name: p.name || "",
            phoneNo: p.phoneNo || "",
            email: p.email || "",
        })) || [],
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
        // For create mode, always set id = 0
        // For edit mode, existing rates keep their real API id, but newly added rates
        // (which use Date.now() as a temporary id, resulting in very large numbers) get id = 0
        id: isCreate ? 0 : (typeof rate.id === 'number' && rate.id > 1_000_000 ? 0 : rate.id),
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
        nightStop: rate.nightStop,
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
        disbursement: rate.disbursement,
        escalation: rate.escalation,
        latePenalty: rate.latePenalty,
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
        personnelList: formData.operationalContacts.map((contact) => ({
            title: contact.title,
            name: contact.name,
            phoneNo: contact.phoneNo,
            email: contact.email,
        })),
        domicileCountry: formData.domicileCountry || "",
        currencyType: formData.currency || "",
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

    const handleContactsChange = (operationalContacts: OperationalContact[]) => {
        setFormData((prev) => ({ ...prev, operationalContacts }));
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
        if (!formData.status) {
            errors.status = "Status is required";
        }
        if (!formData.currency) {
            errors.currency = "Currency is required";
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
                    // Focus first errored field
                    const firstErrorKey = Object.keys(errors)[0];
                    setTimeout(() => {
                        const el = document.getElementById(firstErrorKey) || document.querySelector(`[name="${firstErrorKey}"]`);
                        if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
                                el.focus();
                            }
                        }
                    }, 100);
                    return;
                }
            }

            // Validate Step 2 (Pricing)
            if (currentStep === 2) {
                const errors = validateStep2();
                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    // Find the first errored rate and scroll to it
                    const firstErrorKey = Object.keys(errors)[0];
                    const rateIdMatch = firstErrorKey.match(/^rate_(.+?)_/);
                    if (rateIdMatch) {
                        setTimeout(() => {
                            const rateEl = document.querySelector(`[data-rate-id="${rateIdMatch[1]}"]`);
                            if (rateEl) {
                                rateEl.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }, 150); // Slightly longer delay to allow card to expand first
                    }
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
        setViewTab("info");
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
            case 3:
                return <OperationalContactStep formData={formData} onContactsChange={handleContactsChange} />;
            default:
                return null;
        }
    };

    // View tab state
    const [viewTab, setViewTab] = useState<"info" | "contacts">("info");

    // Render A4 view for view mode
    if (isViewMode) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent size="lg" className="grid-cols-1 w-screen max-w-none h-dvh max-h-dvh rounded-none border-0 md:w-[90%] md:max-w-[90%] md:h-auto md:max-h-[95vh] md:rounded-lg md:border overflow-hidden p-0">
                    <div className="h-full min-h-0 min-w-0 md:h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 pr-12 md:px-6 md:py-4 border-b bg-background">
                            <div className="min-w-0">
                                <DialogTitle className="text-sm md:text-lg font-semibold">View Contract</DialogTitle>
                                <DialogDescription className="hidden md:block text-sm text-muted-foreground">Contract details and pricing information</DialogDescription>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b bg-background px-2 md:px-6">
                            <button
                                onClick={() => setViewTab("info")}
                                className={cn(
                                    "px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                    viewTab === "info"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Contract Info
                            </button>
                            <button
                                onClick={() => setViewTab("contacts")}
                                className={cn(
                                    "px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                    viewTab === "contacts"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Operational Contacts
                                {formData.operationalContacts.length > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {formData.operationalContacts.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 min-h-0 min-w-0 overflow-auto">
                            {viewTab === "info" ? (
                                <ContractViewA4 formData={formData} isLoading={isLoadingContract} />
                            ) : (
                                <div className="p-4 md:p-6 space-y-4">
                                    {isLoadingContract ? (
                                        <div className="flex items-center justify-center h-32">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : formData.operationalContacts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                            <div className="rounded-full bg-muted p-4 mb-4">
                                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium">No Operational Contacts</p>
                                            <p className="text-xs mt-1">No contacts have been assigned to this contract.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {formData.operationalContacts.map((contact, index) => (
                                                <div key={contact.id} className="border rounded-lg p-4 bg-muted/20">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                            {contact.name?.charAt(0)?.toUpperCase() || "#"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {contact.title && `${contact.title} `}{contact.name || "-"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Contact #{index + 1}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                                                            <p className="font-medium">{contact.phoneNo || "-"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                                                            <p className="font-medium break-all">{contact.email || "-"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:px-6 md:py-4 border-t bg-background flex justify-end">
                            <Button variant="outline" size="sm" className="h-8 md:h-10 md:px-4 md:text-sm" onClick={handleClose}>
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
            <DialogContent size="md" className="w-screen max-w-none h-dvh max-h-dvh rounded-none border-0 md:w-[90%] md:max-w-[996px] md:h-auto md:max-h-[90vh] md:rounded-lg md:border overflow-hidden p-0">
                <div className="flex h-full min-h-0 flex-col md:h-[80vh] md:flex-row">
                    {/* Left Sidebar - Vertical Stepper (horizontal bar on mobile) */}
                    <div className="w-full shrink-0 bg-primary text-primary-foreground px-3 pt-2.5 pb-2 md:w-64 md:p-6 flex flex-col">
                        <DialogHeader className="mb-1.5 pr-8 space-y-0 text-left md:mb-8 md:pr-0 md:space-y-1.5">
                            <DialogTitle className="text-primary-foreground text-sm md:text-lg">
                                {getDialogTitle()}
                            </DialogTitle>
                            <p className="hidden text-primary-foreground/70 text-sm md:block">
                                {getDialogSubtitle()}
                            </p>
                        </DialogHeader>

                        {/* Steps */}
                        <div className="relative md:flex-1">
                            <div className="flex gap-1 md:flex-col md:gap-2">
                                {FORM_STEPS.map((step) => {
                                    const isCompleted = currentStep > step.id;
                                    const isActive = currentStep === step.id;
                                    // In create mode: only allow clicking on completed steps (going back)
                                    // In edit mode: allow clicking on any step up to currentStep + 1
                                    const isClickable = mode === "create"
                                        ? step.id < currentStep  // Only go back in create mode
                                        : step.id <= currentStep + 1;

                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => handleStepClick(step.id)}
                                            disabled={!isClickable}
                                            className={cn(
                                                "flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1.5 py-1 rounded-md transition-all md:w-full md:flex-none md:justify-start md:gap-4 md:p-3 md:rounded-lg md:text-left",
                                                isActive && "bg-white/20",
                                                isClickable && !isActive && "hover:bg-white/10",
                                                !isClickable && !isActive && "opacity-50 cursor-not-allowed",
                                                isActive && "cursor-default"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "relative z-10 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold border md:border-2 transition-all md:w-10 md:h-10 md:text-sm",
                                                    isCompleted
                                                        ? "bg-white text-primary border-white"
                                                        : isActive
                                                            ? "bg-white text-primary border-white"
                                                            : "bg-transparent border-primary-foreground/40 text-primary-foreground/70"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <Check className="h-3 w-3 md:h-5 md:w-5" />
                                                ) : (
                                                    step.id
                                                )}
                                            </div>
                                            <div className="min-w-0 md:flex-1">
                                                <span
                                                    className={cn(
                                                        "block truncate text-[11px] leading-tight font-medium md:whitespace-normal md:text-base md:leading-normal",
                                                        isActive || isCompleted
                                                            ? "text-primary-foreground"
                                                            : "text-primary-foreground/70"
                                                    )}
                                                >
                                                    {step.title}
                                                </span>
                                            </div>
                                            {isActive && (
                                                <ChevronRight className="hidden h-5 w-5 shrink-0 text-primary-foreground md:block" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-background">
                        {/* Content Header */}
                        <div className="hidden md:block md:p-6 border-b">
                            <h3 className="text-base md:text-lg font-semibold">
                                {FORM_STEPS[currentStep - 1].title}
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                {FORM_STEPS[currentStep - 1].titleEn}
                            </p>
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
                            {renderStepContent()}
                        </div>

                        {/* Footer */}
                        <DialogFooter className="flex-row items-center justify-between gap-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:p-6 border-t">
                            <div>
                                {currentStep > 1 && (
                                    <Button size="sm" className="h-8 md:h-10 md:px-4 md:text-sm" onClick={handlePrev}>
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="h-8 md:h-10 md:px-4 md:text-sm" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                {currentStep < FORM_STEPS.length ? (
                                    <Button size="sm" className="h-8 md:h-10 md:px-4 md:text-sm" onClick={handleNext}>
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button size="sm" className="h-8 md:h-10 md:px-4 md:text-sm" onClick={handleSubmit} disabled={isSubmitting}>
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

