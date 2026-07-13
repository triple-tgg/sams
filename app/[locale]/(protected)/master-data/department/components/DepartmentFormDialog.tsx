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
import { Loader2 } from "lucide-react";
import type { DepartmentItem } from "@/lib/api/master/department/department.interface";

interface Props {
  mode: "add" | "edit";
  department?: DepartmentItem | null;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (data: { code: string; name: string }) => void;
}

const DepartmentFormDialog = ({
  mode,
  department,
  isPending = false,
  onClose,
  onSubmit,
}: Props) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const dialogTitle =
    mode === "add" ? "Add New Department" : "Edit Department";

  useEffect(() => {
    if (department && mode === "edit") {
      setCode(department.code || "");
      setName(department.name || "");
    } else {
      setCode("");
      setName("");
    }
  }, [department, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code: code.trim().toUpperCase(),
      name: name.trim(),
    });
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          {mode === "add"
            ? "Fill in the details to add a new department."
            : "Update the department information."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="dept-code">Department Code *</Label>
          <Input
            id="dept-code"
            placeholder="e.g. MNT"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isPending}
            maxLength={10}
            required
          />
          <p className="text-xs text-muted-foreground">
            Short code for the department (max 10 characters)
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="dept-name">Department Name *</Label>
          <Input
            id="dept-name"
            placeholder="e.g. Maintenance"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            disabled={isPending || !code.trim() || !name.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : mode === "add" ? (
              "Add Department"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentFormDialog;
