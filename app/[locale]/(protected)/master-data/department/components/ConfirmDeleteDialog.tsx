"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import type { OrgNodeType } from "@/lib/api/master/department/department.interface";

interface Props {
  nodeType: OrgNodeType;
  nodeName: string;
  childCount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

const nodeLabel: Record<OrgNodeType, string> = {
  department: "Department",
  position: "Position",
};

const ConfirmDeleteDialog = ({
  nodeType,
  nodeName,
  childCount = 0,
  onClose,
  onConfirm,
}: Props) => {
  return (
    <div className="w-full max-w-[500px] mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Delete {nodeLabel[nodeType]}
        </DialogTitle>
        <DialogDescription className="mt-2">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">&quot;{nodeName}&quot;</span>?
        </DialogDescription>
      </DialogHeader>

      {childCount > 0 && nodeType === "department" && (
        <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <p className="font-medium">Warning: This department has positions</p>
          <p className="text-xs mt-1 opacity-80">
            This department has {childCount} position(s). All positions will also
            be removed.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" color="destructive" onClick={onConfirm}>
          Delete {nodeLabel[nodeType]}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;
