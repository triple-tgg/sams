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
import { Loader2, UserPlus, Upload, X, Image as ImageIcon, Check, ChevronsUpDown, FileText, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { uploadStaffFile, type QAStaffItem } from "@/lib/api/qa/staff-management";
import { useStaffListForImport } from "@/lib/api/hooks/useStaffListForImport";
import { useInstructorList } from "@/lib/api/qa/instructor.hooks";
import { convertFileToBase64, getFileExtension } from "@/lib/api/uploadFile/fileUpload";
import { cn } from "@/lib/utils";

export interface InstructorFormData {
  id: number;
  title: string;
  code: string;
  name: string;
  description: string;
  licenseLink: string;
  email: string;
  /** true = Internal (linked to a staff record), false = External */
  flagInternal: boolean;
  /** Linked staff id when Internal; 0 otherwise */
  staffId: number;
  /** Kept from the loaded record so saving doesn't wipe it */
  approvalLetterLink: string;
}

const staffDisplayName = (s: QAStaffItem) =>
  s.fullNameEn?.trim() || s.name?.trim() || s.code || `Staff #${s.id}`;

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
  flagInternal: false,
  staffId: 0,
  approvalLetterLink: "",
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
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);

  // Instructor Authorization / Approval Letter document
  const approvalInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingApproval, setIsUploadingApproval] = useState(false);
  const [approvalFileName, setApprovalFileName] = useState("");
  const [approvalError, setApprovalError] = useState("");

  // Staff list is only needed for Internal instructors (cached 5 min by the hook)
  const { rawStaff, isLoading: isStaffLoading } = useStaffListForImport(isOpen && form.flagInternal);
  const selectedStaff = rawStaff.find((s) => s.id === form.staffId);

  // Staff already linked to another Internal instructor can't be picked again.
  // The instructor being edited is excluded so its own linked staff stays selectable.
  const { data: instructors = [] } = useInstructorList();
  const availableStaff = React.useMemo(() => {
    const takenStaffIds = new Set(
      instructors
        .filter((inst) => inst.flagInternal && inst.staffId && inst.id !== form.id && !inst.isDelete)
        .map((inst) => inst.staffId)
    );
    return rawStaff.filter((s) => !takenStaffIds.has(s.id));
  }, [instructors, rawStaff, form.id]);
  // Internal instructors take Title / Full Name / Email from the linked staff record.
  const lockStaffFields = form.flagInternal;
  // Email stays editable if the linked staff has none on file (it's a required field).
  const lockEmail = lockStaffFields && !!(selectedStaff ? selectedStaff.email?.trim() : form.email.trim());

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
        flagInternal: !!instructor.flagInternal,
        staffId: instructor.staffId || 0,
        approvalLetterLink: instructor.approvalLetterLink || "",
      });
      setSignaturePreview(instructor.licenseLink || null);
    } else {
      setForm(initialForm);
      setSignaturePreview(null);
    }
    setApprovalFileName("");
    setApprovalError("");
  }, [instructor, isOpen]);

  const handleChange = (
    field: keyof InstructorFormData,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (internal: boolean) => {
    // Switching to External drops the staff link; the typed name/email stay editable.
    setForm((prev) => ({ ...prev, flagInternal: internal, staffId: internal ? prev.staffId : 0 }));
  };

  /** Link a staff record and prefill the instructor fields from it (all remain editable). */
  const handleSelectStaff = (staff: QAStaffItem) => {
    const staffTitle = staff.title?.trim();
    setForm((prev) => ({
      ...prev,
      staffId: staff.id,
      name: staffDisplayName(staff),
      email: staff.email?.trim() || prev.email,
      title: staffTitle && TITLE_OPTIONS.includes(staffTitle) ? staffTitle : prev.title,
      // Instructor Code is the instructor's own code — never derived from the staff ID.
    }));
    setStaffPickerOpen(false);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Show local preview immediately (only for images)
    if (file.type.startsWith("image/")) {
      const localPreview = URL.createObjectURL(file);
      setSignaturePreview(localPreview);
    } else {
      setSignaturePreview("pdf"); // sentinel for non-image files
    }

    // Upload file to server via /master/staff-management/uploadfile
    setIsUploading(true);
    try {
      const base64 = await convertFileToBase64(file);
      const ext = getFileExtension(file.name);
      const fileName = file.name.replace(/\.[^.]+$/, ""); // strip extension

      const res = await uploadStaffFile({
        FileBase64: base64,
        FileType: "instructors_license",
        ExtensionFile: ext,
        FileName: fileName,
      });
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

  const APPROVAL_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
  const APPROVAL_MAX_BYTES = 5 * 1024 * 1024;

  const handleApprovalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (approvalInputRef.current) approvalInputRef.current.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!APPROVAL_TYPES.includes(file.type)) {
      setApprovalError("Only PDF, PNG, JPG or WebP files are allowed.");
      return;
    }
    if (file.size > APPROVAL_MAX_BYTES) {
      setApprovalError("File is larger than 5MB.");
      return;
    }

    setApprovalError("");
    setIsUploadingApproval(true);
    try {
      const res = await uploadStaffFile({
        FileBase64: await convertFileToBase64(file),
        FileType: "instructors_approval_letter",
        ExtensionFile: getFileExtension(file.name),
        FileName: file.name.replace(/\.[^.]+$/, ""),
      });
      const uploadedPath = res.responseData?.[0]?.filePath ?? "";
      if (!uploadedPath) throw new Error("No file path returned");
      setForm((prev) => ({ ...prev, approvalLetterLink: uploadedPath }));
      setApprovalFileName(file.name);
    } catch (err) {
      console.error("Approval letter upload failed:", err);
      setApprovalError("Upload failed. Please try again.");
    } finally {
      setIsUploadingApproval(false);
    }
  };

  const handleRemoveApproval = () => {
    setForm((prev) => ({ ...prev, approvalLetterLink: "" }));
    setApprovalFileName("");
    setApprovalError("");
  };

  /** Display name for an uploaded document: the original name if just uploaded, else the URL's last segment. */
  const approvalDisplayName =
    approvalFileName ||
    (() => {
      try {
        return decodeURIComponent(form.approvalLetterLink.split("?")[0].split("/").pop() || "") || "Approval letter";
      } catch {
        return "Approval letter";
      }
    })();

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
    (!form.flagInternal || form.staffId > 0) &&
    form.code.trim() !== "" &&
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    !isPending &&
    !isUploading &&
    !isUploadingApproval;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Header and action footer stay fixed; only the fields scroll */}
      <DialogContent className="sm:max-w-130 max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          {/* Instructor Type — first field */}
          <div className="space-y-2">
            <Label id="instructor-type-label">Instructor Type *</Label>
            <div
              role="radiogroup"
              aria-labelledby="instructor-type-label"
              className="grid grid-cols-2 gap-2"
            >
              {([
                { internal: true, label: "Internal", hint: "SAMS staff member" },
                { internal: false, label: "External", hint: "Outside instructor" },
              ] as const).map((opt) => {
                const active = form.flagInternal === opt.internal;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleTypeChange(opt.internal)}
                    disabled={isPending}
                    className={cn(
                      "flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staff link — only for Internal */}
          {form.flagInternal && (
            <div className="space-y-2">
              <Label htmlFor="instructor-staff">Staff *</Label>
              <Popover open={staffPickerOpen} onOpenChange={setStaffPickerOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    id="instructor-staff"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={staffPickerOpen}
                    disabled={isPending}
                    className="h-9 w-full justify-between font-normal"
                  >
                    <span className={cn("truncate", !selectedStaff && "text-muted-foreground")}>
                      {selectedStaff
                        ? `${selectedStaff.employeeId || selectedStaff.code} · ${staffDisplayName(selectedStaff)}`
                        : form.staffId > 0
                          ? isStaffLoading ? "Loading staff…" : `Staff #${form.staffId}`
                          : "Select a staff member"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or staff ID…" />
                    <CommandList>
                      {isStaffLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No staff found.</CommandEmpty>
                          <CommandGroup>
                            {availableStaff.map((staff) => (
                              <CommandItem
                                key={staff.id}
                                value={`${staff.employeeId ?? ""} ${staff.code ?? ""} ${staffDisplayName(staff)} ${staff.id}`}
                                onSelect={() => handleSelectStaff(staff)}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", form.staffId === staff.id ? "opacity-100" : "opacity-0")}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-sm">{staffDisplayName(staff)}</p>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {staff.employeeId || staff.code}
                                    {staff.positionObj?.name ? ` · ${staff.positionObj.name}` : ""}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-[11px] text-muted-foreground">
                Title, full name and email are taken from the selected staff record.
              </p>
            </div>
          )}

          {/* Title + Code row */}
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="instructor-title">Title *</Label>
              <Select
                value={form.title}
                onValueChange={(v) => handleChange("title", v)}
                disabled={isPending || lockStaffFields}
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
              <Label htmlFor="instructor-code">Instructor Code *</Label>
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
              disabled={isPending || lockStaffFields}
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
              disabled={isPending || lockEmail}
              className="h-9"
            />
          </div>

          {/* Upload Signature */}
          <div className="space-y-2">
            <Label>Signature</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
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
                    PNG, JPG, WebP or PDF (max 5MB)
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Instructor Authorization / Approval Letter */}
          <div className="space-y-2">
            <Label htmlFor="approval-upload">Instructor Authorization / Approval Letter</Label>
            <input
              ref={approvalInputRef}
              id="approval-upload"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleApprovalUpload}
              className="hidden"
            />

            {form.approvalLetterLink ? (
              <div className="relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate" title={approvalDisplayName}>
                    {approvalDisplayName}
                  </p>
                  <a
                    href={form.approvalLetterLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" /> View document
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => approvalInputRef.current?.click()}
                  disabled={isPending || isUploadingApproval}
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveApproval}
                  disabled={isPending || isUploadingApproval}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove document"
                  aria-label="Remove approval letter"
                >
                  <X className="w-4 h-4" />
                </button>
                {isUploadingApproval && (
                  <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => approvalInputRef.current?.click()}
                disabled={isPending || isUploadingApproval}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                {isUploadingApproval ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-primary" />
                )}
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">
                    {isUploadingApproval ? "Uploading..." : "Click to upload document"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">PDF, PNG, JPG or WebP (max 5MB)</p>
                </div>
              </button>
            )}
            {approvalError && <p className="text-[11px] text-red-600">{approvalError}</p>}
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

          </div>

          {/* Actions — fixed footer */}
          <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border bg-card">

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
