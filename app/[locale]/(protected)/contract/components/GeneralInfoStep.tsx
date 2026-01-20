"use client";

import { useState, useRef, useCallback } from "react";
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
import { Upload, FileText, X, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepProps } from "./types";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { useContractStatusOptions } from "@/lib/api/hooks/useContractStatus";
import { useContractTypesOptions } from "@/lib/api/hooks/useContractTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadContractDocument } from "@/lib/api/contract/uploadContractFile";

// Upload status type
type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

interface GeneralInfoStepProps extends StepProps {
    file: File | null;
    onFileChange: (file: File | null) => void;
    uploadStatus: UploadStatus;
    onUploadStatusChange: (status: UploadStatus) => void;
    fieldErrors?: Record<string, string>;
}

export const GeneralInfoStep = ({
    formData,
    onFormChange,
    file,
    onFileChange,
    uploadStatus,
    onUploadStatusChange,
    fieldErrors = {}
}: GeneralInfoStepProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { options: airlineOptions, isLoading: isLoadingAirlines } = useAirlineOptions();
    const { options: statusOptions, isLoading: isLoadingStatus } = useContractStatusOptions();
    const { options: contractTypeOptions, isLoading: isLoadingContractTypes } = useContractTypesOptions();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            onFileChange(selectedFile);
            onUploadStatusChange("idle");
            // Reset the uploaded path when a new file is selected
            onFormChange("contractDocumentPath", "");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            onFileChange(droppedFile);
            onUploadStatusChange("idle");
            onFormChange("contractDocumentPath", "");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const removeFile = () => {
        onFileChange(null);
        onUploadStatusChange("idle");
        onFormChange("contractDocumentPath", "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = useCallback(async () => {
        if (!file) return;

        try {
            onUploadStatusChange("uploading");
            const response = await uploadContractDocument(file);

            if (response.responseData && response.responseData.length > 0) {
                const filePath = response.responseData[0].filePath;
                onFormChange("contractDocumentPath", filePath);
                onUploadStatusChange("uploaded");
            } else {
                throw new Error("Upload failed: No file path returned");
            }
        } catch (error) {
            console.error("Upload error:", error);
            onUploadStatusChange("error");
        }
    }, [file, onFormChange, onUploadStatusChange]);

    const handleOpenFile = () => {
        if (formData.contractDocumentPath) {
            window.open(formData.contractDocumentPath, "_blank");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const isUploading = uploadStatus === "uploading";
    const isUploaded = uploadStatus === "uploaded";

    return (
        <div className="space-y-6">
            {/* Contract Info */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold text-primary">Contract Info</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contractCode">Contract No. <span className="text-destructive">*</span></Label>
                        <Input
                            id="contractCode"
                            placeholder="SAMS-SM-AIRLINE CODE-000-2024"
                            value={formData.contractCode}
                            onChange={(e) => onFormChange("contractCode", e.target.value)}
                            className={fieldErrors.contractCode ? "border-destructive" : ""}
                        />
                        {fieldErrors.contractCode && (
                            <p className="text-xs text-destructive">{fieldErrors.contractCode}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="carrierName">Customer Airline <span className="text-destructive">*</span></Label>
                        <Select
                            value={formData.carrierName}
                            onValueChange={(value) => {
                                onFormChange("carrierName", value);
                                // Also set airlineId for API submission
                                const selectedAirline = airlineOptions.find(a => a.value === value);
                                if (selectedAirline) {
                                    onFormChange("airlineId", selectedAirline.id);
                                }
                            }}
                            disabled={isLoadingAirlines}
                        >
                            <SelectTrigger className={fieldErrors.carrierName ? "border-destructive" : ""}>
                                <SelectValue placeholder={isLoadingAirlines ? "Loading..." : "Select Airline"} />
                            </SelectTrigger>
                            <SelectContent>
                                {airlineOptions.map((airline) => (
                                    <SelectItem key={airline.value} value={airline.value}>
                                        {airline.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldErrors.carrierName && (
                            <p className="text-xs text-destructive">{fieldErrors.carrierName}</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="effectiveFrom">Effective From <span className="text-destructive">*</span></Label>
                        <Input
                            id="effectiveFrom"
                            type="date"
                            value={formData.effectiveFrom}
                            onChange={(e) => onFormChange("effectiveFrom", e.target.value)}
                            className={fieldErrors.effectiveFrom ? "border-destructive" : ""}
                        />
                        {fieldErrors.effectiveFrom && (
                            <p className="text-xs text-destructive">{fieldErrors.effectiveFrom}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="validFrom">Valid From</Label>
                        <Input
                            id="validFrom"
                            type="date"
                            value={formData.validFrom}
                            onChange={(e) => onFormChange("validFrom", e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expiresOn">Expires On <span className="text-destructive">*</span></Label>
                    <Input
                        id="expiresOn"
                        type="date"
                        value={formData.isNoExpiryDate ? "" : formData.expiresOn}
                        onChange={(e) => onFormChange("expiresOn", e.target.value)}
                        disabled={formData.isNoExpiryDate}
                        className={fieldErrors.expiresOn && !formData.isNoExpiryDate ? "border-destructive" : ""}
                    />
                    {fieldErrors.expiresOn && !formData.isNoExpiryDate && (
                        <p className="text-xs text-destructive">{fieldErrors.expiresOn}</p>
                    )}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="neverExpires"
                            checked={formData.isNoExpiryDate}
                            onCheckedChange={(checked) => {
                                const isNoExpiry = checked as boolean;
                                onFormChange("isNoExpiryDate", isNoExpiry);
                                onFormChange("expiresOn", isNoExpiry ? "2999-01-01" : "");
                            }}
                        />
                        <Label htmlFor="neverExpires" className="text-sm cursor-pointer">No expiry date</Label>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type</Label>
                    <Select
                        value={formData.contractType}
                        onValueChange={(value) => {
                            onFormChange("contractType", value);
                            // Also set contractStatusId for API submission
                            const selectedType = contractTypeOptions.find(s => s.value === value);
                            if (selectedType) {
                                onFormChange("contractTypeId", selectedType.id);
                            }
                        }}
                        disabled={isLoadingContractTypes}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingContractTypes ? "Loading..." : "Select Contract Type"} />
                        </SelectTrigger>
                        <SelectContent>
                            {contractTypeOptions.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="creditTerms">Credit Terms</Label>
                    <Input
                        id="creditTerms"
                        placeholder="Enter credit terms"
                        value={formData.creditTerms}
                        onChange={(e) => onFormChange("creditTerms", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => {
                            onFormChange("status", value);
                            // Also set contractStatusId for API submission
                            const selectedStatus = statusOptions.find(s => s.value === value);
                            if (selectedStatus) {
                                onFormChange("contractStatusId", selectedStatus.id);
                            }
                        }}
                        disabled={isLoadingStatus}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingStatus ? "Loading..." : "Select Status"} />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Attachment */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-primary">Contract Document</h4>

                {/* Show drop zone only if no file selected */}
                {!file && !formData.contractDocumentPath && (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                            isDragOver
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25 hover:border-primary/50"
                        )}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                            Drag and drop file here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Supports: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (1 file only)
                        </p>
                    </div>
                )}

                {/* File Display */}
                {file && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                            <FileText className="h-6 w-6 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>

                            {/* Upload Status Badge */}
                            {isUploaded && (
                                <div className="flex items-center gap-1 text-green-600 text-xs">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Uploaded</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                                {/* Open File Button (only show when uploaded) */}
                                {isUploaded && formData.contractDocumentPath && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary hover:text-primary"
                                        onClick={handleOpenFile}
                                        title="Open file"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Upload Button (only show when not uploaded) */}
                                {!isUploaded && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="h-8"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-1" />
                                                Upload
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* Remove File Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={removeFile}
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {uploadStatus === "error" && (
                            <p className="text-xs text-destructive">
                                Upload failed. Please try again.
                            </p>
                        )}
                    </div>
                )}

                {/* Already uploaded file (for editing mode) */}
                {!file && formData.contractDocumentPath && (
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                        <FileText className="h-6 w-6 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {formData.contractDocumentPath.split('/').pop()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Uploaded
                            </p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Uploaded</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary"
                            onClick={handleOpenFile}
                            title="Open file"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                                onFormChange("contractDocumentPath", "");
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
