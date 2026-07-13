"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";
import type {
  PositionItem,
  DepartmentItem,
} from "@/lib/api/master/department/department.interface";

interface Props {
  mode: "add" | "edit";
  position?: PositionItem | null;
  parentDepartment: DepartmentItem | null;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    positionCode: string;
    positionName: string;
    departmentId: string;
  }) => void;
}

const PositionFormDialog = ({
  mode,
  position,
  parentDepartment,
  isPending = false,
  onClose,
  onSubmit,
}: Props) => {
  const [positionCode, setPositionCode] = useState("");
  const [positionName, setPositionName] = useState("");

  const dialogTitle = mode === "add" ? "Add New Position" : "Edit Position";

  useEffect(() => {
    if (position && mode === "edit") {
      setPositionCode(position.positionCode || "");
      setPositionName(position.positionName || "");
    } else {
      setPositionCode("");
      setPositionName("");
    }
  }, [position, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentDepartment) return;
    onSubmit({
      positionCode: positionCode.trim().toUpperCase(),
      positionName: positionName.trim(),
      departmentId: parentDepartment.id,
    });
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          {mode === "add"
            ? "Fill in the details to add a new position."
            : "Update the position information."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Parent Department (read-only) */}
        <div className="space-y-2">
          <Label>Department</Label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border text-sm">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span className="font-mono text-xs text-muted-foreground mr-1">
              {parentDepartment?.code}
            </span>
            <span>{parentDepartment?.name || "—"}</span>
          </div>
        </div>

        {/* Position Code */}
        <div className="space-y-2">
          <Label htmlFor="pos-code">Position Code *</Label>
          <Input
            id="pos-code"
            placeholder="e.g. CSE"
            value={positionCode}
            onChange={(e) => setPositionCode(e.target.value.toUpperCase())}
            disabled={isPending}
            maxLength={10}
            required
          />
          <p className="text-xs text-muted-foreground">
            Short code for the position (max 10 characters)
          </p>
        </div>

        {/* Position Name */}
        <div className="space-y-2">
          <Label htmlFor="pos-name">Position Name *</Label>
          <Input
            id="pos-name"
            placeholder="e.g. Chief Station Engineer"
            value={positionName}
            onChange={(e) => setPositionName(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            disabled={isPending || !positionCode.trim() || !positionName.trim() || !parentDepartment}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : mode === "add" ? (
              "Add Position"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PositionFormDialog;
