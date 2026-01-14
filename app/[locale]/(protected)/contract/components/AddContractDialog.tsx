"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import { ContractFormData } from "./types";
import { defaultFormData, FORM_STEPS } from "./data";
import { GeneralInfoStep } from "./GeneralInfoStep";
import { ServicePricingStep } from "./ServicePricingStep";

interface AddContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AddContractDialog = ({ open, onOpenChange }: AddContractDialogProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<ContractFormData>(defaultFormData);
    const [files, setFiles] = useState<File[]>([]);

    const handleFormChange = (field: keyof ContractFormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleStepClick = (stepId: number) => {
        // Allow clicking on completed steps or the next step
        if (stepId <= currentStep + 1) {
            setCurrentStep(stepId);
        }
    };

    const handleNext = () => {
        if (currentStep < FORM_STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        console.log("Saving contract:", formData);
        handleClose();
    };

    const handleClose = () => {
        setCurrentStep(1);
        setFormData(defaultFormData);
        setFiles([]);
        onOpenChange(false);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <GeneralInfoStep formData={formData} onFormChange={handleFormChange} files={files} onFilesChange={setFiles} />;
            case 2:
                return <ServicePricingStep formData={formData} onFormChange={handleFormChange} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent size="md" className="max-h-[90vh] overflow-hidden p-0">
                <div className="flex h-[80vh]">
                    {/* Left Sidebar - Vertical Stepper */}
                    <div className="w-64 bg-primary text-primary-foreground p-6 flex flex-col">
                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-primary-foreground text-lg">
                                New Contract
                            </DialogTitle>
                            <p className="text-primary-foreground/70 text-sm">
                                Contract creation wizard
                            </p>
                        </DialogHeader>

                        {/* Steps */}
                        <div className="flex-1 relative">
                            {/* Vertical Line */}
                            {/* <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-primary-foreground/20" /> */}

                            <div className="space-y-2">
                                {FORM_STEPS.map((step, index) => {
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
                                            {/* Step Circle */}
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

                                            {/* Step Title */}
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

                                            {/* Arrow for active step */}
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
                                    <Button variant="outline" onClick={handlePrev}>
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
                                    <Button onClick={handleSubmit}>
                                        Save Contract
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
