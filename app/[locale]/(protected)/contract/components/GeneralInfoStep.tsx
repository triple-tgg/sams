"use client";

import { useState, useRef } from "react";
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
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepProps } from "./types";
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines";
import { Checkbox } from "@/components/ui/checkbox";

interface GeneralInfoStepProps extends StepProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export const GeneralInfoStep = ({ formData, onFormChange, files, onFilesChange }: GeneralInfoStepProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { options: airlineOptions, isLoading: isLoadingAirlines } = useAirlineOptions();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            onFilesChange([...files, ...newFiles]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files);
            onFilesChange([...files, ...newFiles]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Contract Info */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold text-primary">Contract Info</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contractCode">Contract No.</Label>
                        <Input
                            id="contractCode"
                            placeholder="SAMS-SM-AIRLINE CODE-000-2024"
                            value={formData.contractCode}
                            onChange={(e) => onFormChange("contractCode", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="carrierName">Customer Airline</Label>
                        <Select
                            value={formData.carrierName}
                            onValueChange={(value) => onFormChange("carrierName", value)}
                            disabled={isLoadingAirlines}
                        >
                            <SelectTrigger>
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
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="effectiveFrom">Effective From</Label>
                        <Input
                            id="effectiveFrom"
                            type="date"
                            value={formData.effectiveFrom}
                            onChange={(e) => onFormChange("effectiveFrom", e.target.value)}
                        />
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
                    <Label htmlFor="expiresOn">Expires On</Label>
                    <Input
                        id="expiresOn"
                        type="date"
                        value={formData.expiresOn === "never" ? "" : formData.expiresOn}
                        onChange={(e) => onFormChange("expiresOn", e.target.value)}
                        disabled={formData.expiresOn === "never"}
                    />
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="neverExpires"
                            checked={formData.expiresOn === "never"}
                            onCheckedChange={(checked) => onFormChange("expiresOn", checked ? "never" : "")}
                        />
                        <Label htmlFor="neverExpires" className="text-sm cursor-pointer">No expiry date</Label>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type</Label>
                    <Select
                        value={formData.contractType}
                        onValueChange={(value) => onFormChange("contractType", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Contract Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MSA">MSA</SelectItem>
                            <SelectItem value="SGHA">SGHA</SelectItem>
                            <SelectItem value="Reciprocal Contract">Reciprocal Contract</SelectItem>
                            <SelectItem value="MOU">MOU</SelectItem>
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
                        onValueChange={(value) => onFormChange("status", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Attachment */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-primary">Contract Documents</h4>

                {/* Drop Zone */}
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
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                        Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supports: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                    </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        <Label>Uploaded Files ({files.length})</Label>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-2 bg-background rounded-lg border"
                                >
                                    <FileText className="h-6 w-6 text-primary shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
