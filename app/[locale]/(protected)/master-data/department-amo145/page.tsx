"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RefreshCw, Plus, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type {
  DepartmentItem,
  PositionItem,
  SelectedNode,
  OrgNodeType,
} from "@/lib/api/master/department/department.interface";
import {
  useStaffDepartmentAmo145s,
  useUpsertStaffDepartmentAmo145,
  useStaffDepartmentPositionAmo145s,
  useUpsertStaffDepartmentPositionAmo145,
} from "@/lib/api/master/organization-amo145.hooks";

import OrganizationTree from "../department/components/OrganizationTree";
import DepartmentFormDialog from "../department/components/DepartmentFormDialog";
import PositionFormDialog from "../department/components/PositionFormDialog";
import ConfirmDeleteDialog from "../department/components/ConfirmDeleteDialog";
import NodeDetailPanel from "./components/NodeDetailPanel";

// Dialog state union
type DialogState =
  | { type: "closed" }
  | { type: "add-department" }
  | { type: "edit-department"; department: DepartmentItem }
  | { type: "add-position"; parentDepartmentId: string }
  | { type: "edit-position"; position: PositionItem }
  | { type: "delete"; nodeType: OrgNodeType; nodeId: string };

const DepartmentAmo145Page = () => {
  // ── API Data ──────────────────────────────────────────────
  const {
    data: deptResp,
    isLoading: isLoadingDepts,
    isError: isDeptError,
    refetch: refetchDepts,
  } = useStaffDepartmentAmo145s();
  const {
    data: posResp,
    isLoading: isLoadingPos,
    isError: isPosError,
    refetch: refetchPos,
  } = useStaffDepartmentPositionAmo145s();
  const upsertDeptMutation = useUpsertStaffDepartmentAmo145();
  const upsertPosMutation = useUpsertStaffDepartmentPositionAmo145();

  const isLoading = isLoadingDepts || isLoadingPos;

  // Departments are seeded from the API (Add/Edit go through upsert).
  // Delete still updates local state only — there is no delete endpoint yet.
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  useEffect(() => {
    const raw = deptResp?.responseData ?? [];
    setDepartments(
      raw
        .filter((d) => !d.isdelete)
        .map((d) => ({
          id: String(d.id),
          code: d.code,
          name: d.name,
          isdelete: d.isdelete,
          createddate: d.createddate,
          createdby: d.createdby ?? undefined,
          updateddate: d.updateddate ?? undefined,
          updatedby: d.updatedby ?? undefined,
        }))
    );
  }, [deptResp]);

  useEffect(() => {
    if (isDeptError) toast.error("Failed to load departments");
  }, [isDeptError]);

  // Positions are seeded from the API (Add/Edit go through upsert).
  // Delete still updates local state only — there is no delete endpoint yet.
  const [positions, setPositions] = useState<PositionItem[]>([]);

  useEffect(() => {
    const raw = posResp?.responseData ?? [];
    setPositions(
      raw
        .filter((p) => !p.isdelete)
        .map((p) => ({
          id: String(p.id),
          departmentId:
            p.staffDepartmentAmo145Id != null
              ? String(p.staffDepartmentAmo145Id)
              : "",
          positionCode: p.code,
          positionName: p.name,
          isdelete: p.isdelete,
          createddate: p.createddate,
          createdby: p.createdby ?? undefined,
          updateddate: p.updateddate ?? undefined,
          updatedby: p.updatedby ?? undefined,
        }))
    );
  }, [posResp]);

  useEffect(() => {
    if (isPosError) toast.error("Failed to load positions");
  }, [isPosError]);

  // UI state
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const closeDialog = useCallback(() => {
    setDialog({ type: "closed" });
  }, []);

  // ─── CRUD Handlers ───

  // Department
  const handleAddDepartment = useCallback(
    async (data: { code: string; name: string }) => {
      try {
        const res = await upsertDeptMutation.mutateAsync({
          id: 0,
          code: data.code,
          name: data.name,
          description: "",
        });
        const newId = res?.responseData?.id;
        if (newId) setSelectedNode({ type: "department", id: String(newId) });
        toast.success(`Department "${data.name}" created successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to create department");
      }
    },
    [closeDialog, upsertDeptMutation]
  );

  const handleEditDepartment = useCallback(
    async (data: { code: string; name: string }) => {
      if (dialog.type !== "edit-department") return;
      const id = Number(dialog.department.id);
      if (!Number.isInteger(id)) {
        toast.error("This department has not been saved yet");
        return;
      }
      // The form has no description field — keep the existing value
      // so an edit does not wipe it.
      const existingDescription =
        deptResp?.responseData?.find((d) => d.id === id)?.description ?? "";
      try {
        await upsertDeptMutation.mutateAsync({
          id,
          code: data.code,
          name: data.name,
          description: existingDescription,
        });
        toast.success(`Department "${data.name}" updated successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to update department");
      }
    },
    [dialog, closeDialog, upsertDeptMutation, deptResp]
  );

  // Position
  const handleAddPosition = useCallback(
    async (data: {
      positionCode: string;
      positionName: string;
      departmentId: string;
    }) => {
      const departmentId = Number(data.departmentId);
      if (!Number.isInteger(departmentId)) {
        toast.error("Please select a valid department");
        return;
      }
      try {
        const res = await upsertPosMutation.mutateAsync({
          id: 0,
          code: data.positionCode,
          name: data.positionName,
          description: "",
          staffDepartmentAmo145Id: departmentId,
        });
        const newId = res?.responseData?.id;
        if (newId) setSelectedNode({ type: "position", id: String(newId) });
        toast.success(`Position "${data.positionName}" created successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to create position");
      }
    },
    [closeDialog, upsertPosMutation]
  );

  const handleEditPosition = useCallback(
    async (data: {
      positionCode: string;
      positionName: string;
      departmentId: string;
    }) => {
      if (dialog.type !== "edit-position") return;
      const id = Number(dialog.position.id);
      const departmentId = Number(data.departmentId);
      if (!Number.isInteger(id)) {
        toast.error("This position has not been saved yet");
        return;
      }
      if (!Number.isInteger(departmentId)) {
        toast.error("Please select a valid department");
        return;
      }
      // The form has no description field — keep the existing value
      // so an edit does not wipe it.
      const existingDescription =
        posResp?.responseData?.find((p) => p.id === id)?.description ?? "";
      try {
        await upsertPosMutation.mutateAsync({
          id,
          code: data.positionCode,
          name: data.positionName,
          description: existingDescription,
          staffDepartmentAmo145Id: departmentId,
        });
        toast.success(`Position "${data.positionName}" updated successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to update position");
      }
    },
    [dialog, closeDialog, upsertPosMutation, posResp]
  );

  // Delete
  const handleConfirmDelete = useCallback(() => {
    if (dialog.type !== "delete") return;
    const { nodeType, nodeId } = dialog;

    if (nodeType === "department") {
      setDepartments((prev) => prev.filter((d) => d.id !== nodeId));
      setPositions((prev) => prev.filter((p) => p.departmentId !== nodeId));
      toast.success("Department deleted successfully");
    } else if (nodeType === "position") {
      setPositions((prev) => prev.filter((p) => p.id !== nodeId));
      toast.success("Position deleted successfully");
    }

    setSelectedNode(null);
    closeDialog();
  }, [dialog, closeDialog]);

  // ─── Detail panel action handlers ───

  const handleEdit = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.type === "department") {
      const dept = departments.find((d) => d.id === selectedNode.id);
      if (dept) setDialog({ type: "edit-department", department: dept });
    } else if (selectedNode.type === "position") {
      const pos = positions.find((p) => p.id === selectedNode.id);
      if (pos) setDialog({ type: "edit-position", position: pos });
    }
  }, [selectedNode, departments, positions]);

  const handleDelete = useCallback(() => {
    if (!selectedNode) return;
    setDialog({
      type: "delete",
      nodeType: selectedNode.type,
      nodeId: selectedNode.id,
    });
  }, [selectedNode]);

  const handleAddChild = useCallback(
    (childType: OrgNodeType) => {
      if (childType === "position" && selectedNode?.type === "department") {
        setDialog({
          type: "add-position",
          parentDepartmentId: selectedNode.id,
        });
      }
    },
    [selectedNode]
  );

  const handleRefresh = useCallback(async () => {
    setSelectedNode(null);
    const [deptResult, posResult] = await Promise.all([
      refetchDepts(),
      refetchPos(),
    ]);
    if (deptResult.isError || posResult.isError) return;
    toast.info("Data refreshed");
  }, [refetchDepts, refetchPos]);

  // ─── Delete dialog context ───

  const deleteContext = useMemo(() => {
    if (dialog.type !== "delete")
      return {
        nodeName: "",
        childCount: 0,
        nodeType: "department" as OrgNodeType,
      };

    const { nodeType, nodeId } = dialog;
    let nodeName = "";
    let childCount = 0;

    if (nodeType === "department") {
      const dept = departments.find((d) => d.id === nodeId);
      nodeName = dept ? `${dept.code} — ${dept.name}` : "";
      childCount = positions.filter((p) => p.departmentId === nodeId).length;
    } else if (nodeType === "position") {
      const pos = positions.find((p) => p.id === nodeId);
      nodeName = pos?.positionName || "";
    }

    return { nodeName, childCount, nodeType };
  }, [dialog, departments, positions]);

  // ─── Dialog parent context for Position form ───

  const dialogParentDept = useMemo(() => {
    if (dialog.type === "add-position") {
      return (
        departments.find((d) => d.id === dialog.parentDepartmentId) || null
      );
    }
    if (dialog.type === "edit-position") {
      return (
        departments.find((d) => d.id === dialog.position.departmentId) || null
      );
    }
    return null;
  }, [dialog, departments]);

  // ─── Render ───

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Organization (AMO145) Setup</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              color="primary"
              onClick={() => setDialog({ type: "add-department" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-0 min-h-[500px] rounded-lg border overflow-hidden">
            {/* Left: Tree Panel */}
            <div className="w-full lg:w-[340px] shrink-0 p-4 bg-muted/20 border-b lg:border-b-0 lg:border-r">
              {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <OrganizationTree
                  departments={departments}
                  positions={positions}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                />
              )}
            </div>

            {/* Right: Detail Panel */}
            <div className="flex-1 p-6">
              <NodeDetailPanel
                selectedNode={selectedNode}
                departments={departments}
                positions={positions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Dialogs ─── */}

      {/* Add Department */}
      <Dialog
        open={dialog.type === "add-department"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg">
          <DepartmentFormDialog
            mode="add"
            isPending={upsertDeptMutation.isPending}
            onClose={closeDialog}
            onSubmit={handleAddDepartment}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Department */}
      <Dialog
        open={dialog.type === "edit-department"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg">
          <DepartmentFormDialog
            mode="edit"
            department={
              dialog.type === "edit-department" ? dialog.department : null
            }
            isPending={upsertDeptMutation.isPending}
            onClose={closeDialog}
            onSubmit={handleEditDepartment}
          />
        </DialogContent>
      </Dialog>

      {/* Add Position */}
      <Dialog
        open={dialog.type === "add-position"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg">
          <PositionFormDialog
            mode="add"
            parentDepartment={dialogParentDept}
            isPending={upsertPosMutation.isPending}
            onClose={closeDialog}
            onSubmit={handleAddPosition}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Position */}
      <Dialog
        open={dialog.type === "edit-position"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg">
          <PositionFormDialog
            mode="edit"
            position={
              dialog.type === "edit-position" ? dialog.position : null
            }
            parentDepartment={dialogParentDept}
            isPending={upsertPosMutation.isPending}
            onClose={closeDialog}
            onSubmit={handleEditPosition}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-lg">
          <ConfirmDeleteDialog
            nodeType={deleteContext.nodeType}
            nodeName={deleteContext.nodeName}
            childCount={deleteContext.childCount}
            onClose={closeDialog}
            onConfirm={handleConfirmDelete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentAmo145Page;

