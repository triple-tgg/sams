"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MapPin } from "lucide-react";
import type { TrainingVenueItem } from "@/lib/api/master/training-venues";

export type VenueFormValues = {
  code: string;
  name: string;
  description: string;
};

type Props = {
  mode: "add" | "edit" | "view";
  venue?: TrainingVenueItem | null;
  /** Detail is still loading (edit / view) */
  isLoading?: boolean;
  /** Save request is in flight */
  isSaving?: boolean;
  /** Codes already used by other venues (upper-case), for the duplicate check */
  existingCodes?: string[];
  onClose: () => void;
  onSubmit?: (values: VenueFormValues) => void;
};

const CODE_MAX = 20;
const NAME_MAX = 200;
const DESCRIPTION_MAX = 500;

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const TrainingVenueFormDialog = ({
  mode,
  venue,
  isLoading = false,
  isSaving = false,
  existingCodes = [],
  onClose,
  onSubmit,
}: Props) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  const isView = mode === "view";
  const disabled = isView || isLoading || isSaving;

  useEffect(() => {
    setCode(venue?.code ?? "");
    setName(venue?.name ?? "");
    setDescription(venue?.description ?? "");
    setTouched(false);
  }, [venue]);

  const trimmedCode = code.trim();
  const trimmedName = name.trim();
  const codeError = !trimmedCode
    ? "Code is required"
    : existingCodes.includes(trimmedCode.toUpperCase())
      ? "This code is already in use"
      : "";
  const nameError = !trimmedName ? "Name is required" : "";
  const isValid = !codeError && !nameError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || !onSubmit) return;
    onSubmit({ code: trimmedCode, name: trimmedName, description: description.trim() });
  };

  const title = mode === "add" ? "Add Training Venue" : mode === "edit" ? "Edit Training Venue" : "Training Venue";
  const subtitle =
    mode === "add"
      ? "Fill in the details to add a new training venue."
      : mode === "edit"
        ? "Update the training venue information."
        : "Training venue details.";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {title}
        </DialogTitle>
        <DialogDescription>{subtitle}</DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="venue-code">
              Code {!isView && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="venue-code"
              placeholder="e.g. BKK-TR01"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={disabled}
              maxLength={CODE_MAX}
              aria-invalid={touched && !!codeError}
              autoFocus={!isView}
            />
            {touched && codeError && <p className="text-xs text-destructive">{codeError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-name">
              Name {!isView && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="venue-name"
              placeholder="e.g. Training Room 1, Hangar 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              maxLength={NAME_MAX}
              aria-invalid={touched && !!nameError}
            />
            {touched && nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="venue-description">Description</Label>
              {!isView && (
                <span className="text-xs text-muted-foreground">
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              )}
            </div>
            <Textarea
              id="venue-description"
              placeholder={isView ? "-" : "Address, building, capacity or other notes..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled}
              maxLength={DESCRIPTION_MAX}
              rows={3}
            />
          </div>

          {isView && venue && (
            <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created By</span>
                <p className="font-medium">{venue.createdby || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created Date</span>
                <p className="font-medium">{formatDateTime(venue.createddate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Updated By</span>
                <p className="font-medium">{venue.updatedby || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Updated Date</span>
                <p className="font-medium">{formatDateTime(venue.updateddate)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          {isView ? "Close" : "Cancel"}
        </Button>
        {!isView && (
          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "add" ? "Add Venue" : "Save Changes"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
};

export default TrainingVenueFormDialog;
