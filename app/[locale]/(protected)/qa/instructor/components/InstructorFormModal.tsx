"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadFile } from "@/lib/api/uploadFile/fileUpload";

export interface InstructorFormData {
  id: number;
  title: string;
  code: string;
  name: string;
  description: string;
  licenseLink: string;
  email: string;
}

interface InstructorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InstructorFormData) => void;
  isPending?: boolean;
  /** Pass existing data to edit; leave undefined for "add" mode */
  instructor?: InstructorFormData | null;
}

const TITLE_OPTIONS = ["Mr.", "Ms.", "Mrs.", "Capt.", "Eng.", "Dr."];

const initialForm: InstructorFormData = {
  id: 0,
  title: "Mr.",
  code: "",
  name: "",
  description: "",
  licenseLink: "",
  email: "",
};

export function InstructorFormModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
  instructor,
}: InstructorFormModalProps) {
  const [form, setForm] = useState<InstructorFormData>(initialForm);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!instructor && instructor.id > 0;

  useEffect(() => {
    if (instructor) {
      setForm({
        id: instructor.id ?? 0,
        title: instructor.title || "Mr.",
        code: instructor.code || "",
        name: instructor.name || "",
        description: instructor.description || "",
        licenseLink: instructor.licenseLink || "",
        email: instructor.email || "",
      });
      setSignaturePreview(instructor.licenseLink || null);
    } else {
      setForm(initialForm);
      setSignaturePreview(null);
    }
  }, [instructor, isOpen]);

  const handleChange = (
    field: keyof InstructorFormData,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setSignaturePreview(localPreview);

    // Upload file to server
    setIsUploading(true);
    try {
      const res = await uploadFile(file, "training_materials", `signature_${form.code || "instructor"}`);
      const uploadedPath = res.responseData?.[0]?.filePath ?? "";
      handleChange("licenseLink", uploadedPath);
      // Replace local blob preview with server URL
      if (uploadedPath) {
        setSignaturePreview(uploadedPath);
      }
    } catch (err) {
      console.error("Signature upload failed:", err);
      setSignaturePreview(null);
      handleChange("licenseLink", "");
    } finally {
      setIsUploading(false);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveSignature = () => {
    setSignaturePreview(null);
    handleChange("licenseLink", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      licenseLink: form.licenseLink.trim(),
      email: form.email.trim(),
    });
  };

  const canSubmit =
    form.code.trim() !== "" &&
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    !isPending &&
    !isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {isEditMode ? "Edit Instructor" : "Add Instructor"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the instructor information below."
              : "Fill in the details to register a new instructor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title + Code row */}
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="instructor-title">Title *</Label>
              <Select
                value={form.title}
                onValueChange={(v) => handleChange("title", v)}
              >
                <SelectTrigger id="instructor-title" className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TITLE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor-code">Code *</Label>
              <Input
                id="instructor-code"
                placeholder="e.g. INS001"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                disabled={isPending}
                className="h-9"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="instructor-name">Full Name *</Label>
            <Input
              id="instructor-name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={isPending}
              className="h-9"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="instructor-email">Email *</Label>
            <Input
              id="instructor-email"
              type="email"
              placeholder="e.g. instructor@sams.aero"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={isPending}
              className="h-9"
            />
          </div>

          {/* Upload Signature */}
          <div className="space-y-2">
            <Label>Signature</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleSignatureUpload}
              className="hidden"
              id="signature-upload"
            />

            {signaturePreview ? (
              <div className="relative group rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-[120px] h-[60px] rounded-md border border-border bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      Signature uploaded
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Click × to remove and re-upload
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    disabled={isPending || isUploading}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
                    title="Remove signature"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || isUploading}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer bg-transparent"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    {isUploading ? "Uploading..." : "Click to upload signature"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    PNG, JPG or WebP (max 5MB)
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="instructor-desc">Description</Label>
            <Textarea
              id="instructor-desc"
              placeholder="Additional notes about the instructor..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isPending}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="px-5 gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? "Update" : "Add Instructor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
