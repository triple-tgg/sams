"use client";

import React, { useState, useCallback, useMemo } from "react";
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

import { useStaffDepartments, useStaffDepartmentPositions, useUpsertStaffDepartment, useUpsertStaffDepartmentPosition, useDeleteStaffDepartment, useDeleteStaffDepartmentPosition } from "@/lib/api/master/organization.hooks";
import type { StaffDepartment, StaffDepartmentPosition } from "@/lib/api/master/organization";
import { useQueryClient } from "@tanstack/react-query";
import { organizationKeys } from "@/lib/api/master/organization.hooks";

import OrganizationTree from "./components/OrganizationTree";
import NodeDetailPanel from "./components/NodeDetailPanel";
import DepartmentFormDialog from "./components/DepartmentFormDialog";
import PositionFormDialog from "./components/PositionFormDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

// Dialog state union
type DialogState =
  | { type: "closed" }
  | { type: "add-department" }
  | { type: "edit-department"; department: DepartmentItem }
  | { type: "add-position"; parentDepartmentId: string }
  | { type: "edit-position"; position: PositionItem }
  | { type: "delete"; nodeType: OrgNodeType; nodeId: string };

const DepartmentPage = () => {
  const queryClient = useQueryClient();

  // ── API Data ──────────────────────────────────────────────
  const { data: deptResp, isLoading: isLoadingDepts } = useStaffDepartments();
  const { data: posResp, isLoading: isLoadingPos } = useStaffDepartmentPositions();

  // Map API data → existing interface shapes
  const departments: DepartmentItem[] = useMemo(() => {
    const raw: StaffDepartment[] = deptResp?.responseData ?? [];
    return raw.map((d) => ({
      id: String(d.id),
      code: d.code,
      name: d.name,
      isdelete: d.isdelete,
      createddate: d.createddate,
      createdby: d.createdby ?? undefined,
      updateddate: d.updateddate ?? undefined,
      updatedby: d.updatedby ?? undefined,
    }));
  }, [deptResp]);

  const positions: PositionItem[] = useMemo(() => {
    const raw: StaffDepartmentPosition[] = posResp?.responseData ?? [];
    return raw.map((p) => ({
      id: String(p.id),
      departmentId: String(p.staffDepartmentId),
      positionCode: p.code,
      positionName: p.name,
      isdelete: p.isdelete,
      createddate: p.createddate,
      createdby: p.createdby ?? undefined,
      updateddate: p.updateddate ?? undefined,
      updatedby: p.updatedby ?? undefined,
    }));
  }, [posResp]);

  const isLoading = isLoadingDepts || isLoadingPos;

  // UI state
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const closeDialog = useCallback(() => {
    setDialog({ type: "closed" });
  }, []);

  // ─── Mutations ───
  const upsertDeptMutation = useUpsertStaffDepartment();
  const upsertPosMutation = useUpsertStaffDepartmentPosition();
  const deleteDeptMutation = useDeleteStaffDepartment();
  const deletePosMutation = useDeleteStaffDepartmentPosition();

  // ─── CRUD Handlers ───

  // Department
  const handleAddDepartment = useCallback(
    async (data: { code: string; name: string }) => {
      try {
        await upsertDeptMutation.mutateAsync({
          id: 0,
          code: data.code,
          name: data.name,
          description: "",
        });
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
      try {
        await upsertDeptMutation.mutateAsync({
          id: Number(dialog.department.id),
          code: data.code,
          name: data.name,
          description: "",
        });
        toast.success(`Department "${data.name}" updated successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to update department");
      }
    },
    [closeDialog, dialog, upsertDeptMutation]
  );

  // Position
  const handleAddPosition = useCallback(
    async (data: { positionCode: string; positionName: string; departmentId: string }) => {
      try {
        await upsertPosMutation.mutateAsync({
          id: 0,
          code: data.positionCode,
          name: data.positionName,
          description: "",
          staffDepartmentId: Number(data.departmentId),
        });
        toast.success(`Position "${data.positionName}" created successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to create position");
      }
    },
    [closeDialog, upsertPosMutation]
  );

  const handleEditPosition = useCallback(
    async (data: { positionCode: string; positionName: string; departmentId: string }) => {
      if (dialog.type !== "edit-position") return;
      try {
        await upsertPosMutation.mutateAsync({
          id: Number(dialog.position.id),
          code: data.positionCode,
          name: data.positionName,
          description: "",
          staffDepartmentId: Number(data.departmentId),
        });
        toast.success(`Position "${data.positionName}" updated successfully`);
        closeDialog();
      } catch {
        toast.error("Failed to update position");
      }
    },
    [closeDialog, dialog, upsertPosMutation]
  );

  // Delete
  const handleConfirmDelete = useCallback(async () => {
    if (dialog.type !== "delete") return;
    const { nodeType, nodeId } = dialog;
    try {
      if (nodeType === "department") {
        await deleteDeptMutation.mutateAsync(Number(nodeId));
        toast.success("Department deleted successfully");
      } else {
        await deletePosMutation.mutateAsync(Number(nodeId));
        toast.success("Position deleted successfully");
      }
      setSelectedNode(null);
      closeDialog();
    } catch {
      toast.error(`Failed to delete ${nodeType}`);
    }
  }, [dialog, closeDialog, deleteDeptMutation, deletePosMutation]);

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

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: organizationKeys.departments });
    queryClient.invalidateQueries({ queryKey: organizationKeys.positions });
    setSelectedNode(null);
    toast.info("Data refreshed");
  }, [queryClient]);

  // ─── Delete dialog context ───

  const deleteContext = useMemo(() => {
    if (dialog.type !== "delete")
      return { nodeName: "", childCount: 0, nodeType: "department" as OrgNodeType };

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
      return departments.find((d) => d.id === dialog.parentDepartmentId) || null;
    }
    if (dialog.type === "edit-position") {
      return departments.find((d) => d.id === dialog.position.departmentId) || null;
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
            <CardTitle>Organization Setup</CardTitle>
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

export default DepartmentPage;
