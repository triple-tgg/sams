"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RefreshCw, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import type {
  DepartmentItem,
  PositionItem,
  SelectedNode,
  OrgNodeType,
} from "@/lib/api/master/department/department.interface";
import {
  MOCK_DEPARTMENTS,
  MOCK_POSITIONS,
  generateId,
} from "@/lib/api/master/department/department.mock";

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
  // Data state (mock — replace with API hooks when ready)
  const [departments, setDepartments] = useState<DepartmentItem[]>([
    ...MOCK_DEPARTMENTS,
  ]);
  const [positions, setPositions] = useState<PositionItem[]>([
    ...MOCK_POSITIONS,
  ]);

  // UI state
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const closeDialog = useCallback(() => {
    setDialog({ type: "closed" });
  }, []);

  // ─── CRUD Handlers ───

  // Department
  const handleAddDepartment = useCallback(
    (data: { code: string; name: string }) => {
      const newDept: DepartmentItem = {
        id: generateId("D", departments),
        code: data.code,
        name: data.name,
        isdelete: false,
        createddate: new Date().toISOString(),
        createdby: "system",
      };
      setDepartments((prev) => [...prev, newDept]);
      setSelectedNode({ type: "department", id: newDept.id });
      toast.success(`Department "${data.name}" added successfully`);
      closeDialog();
    },
    [departments, closeDialog]
  );

  const handleEditDepartment = useCallback(
    (data: { code: string; name: string }) => {
      if (dialog.type !== "edit-department") return;
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === dialog.department.id
            ? {
                ...d,
                code: data.code,
                name: data.name,
                updateddate: new Date().toISOString(),
                updatedby: "system",
              }
            : d
        )
      );
      toast.success(`Department "${data.name}" updated`);
      closeDialog();
    },
    [dialog, closeDialog]
  );

  // Position
  const handleAddPosition = useCallback(
    (data: { positionCode: string; positionName: string; departmentId: string }) => {
      const newPos: PositionItem = {
        id: generateId("P", positions),
        departmentId: data.departmentId,
        positionCode: data.positionCode,
        positionName: data.positionName,
        isdelete: false,
        createddate: new Date().toISOString(),
        createdby: "system",
      };
      setPositions((prev) => [...prev, newPos]);
      setSelectedNode({ type: "position", id: newPos.id });
      toast.success(`Position "${data.positionName}" added successfully`);
      closeDialog();
    },
    [positions, closeDialog]
  );

  const handleEditPosition = useCallback(
    (data: { positionCode: string; positionName: string; departmentId: string }) => {
      if (dialog.type !== "edit-position") return;
      setPositions((prev) =>
        prev.map((p) =>
          p.id === dialog.position.id
            ? {
                ...p,
                positionCode: data.positionCode,
                positionName: data.positionName,
                updateddate: new Date().toISOString(),
                updatedby: "system",
              }
            : p
        )
      );
      toast.success(`Position "${data.positionName}" updated`);
      closeDialog();
    },
    [dialog, closeDialog]
  );

  // Delete (cascading)
  const handleConfirmDelete = useCallback(() => {
    if (dialog.type !== "delete") return;
    const { nodeType, nodeId } = dialog;

    if (nodeType === "department") {
      setPositions((prev) => prev.filter((p) => p.departmentId !== nodeId));
      setDepartments((prev) => prev.filter((d) => d.id !== nodeId));
      toast.success("Department deleted");
    } else if (nodeType === "position") {
      setPositions((prev) => prev.filter((p) => p.id !== nodeId));
      toast.success("Position deleted");
    }

    // Clear selection if deleted node was selected
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    closeDialog();
  }, [dialog, selectedNode, closeDialog]);

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
    setDepartments([...MOCK_DEPARTMENTS]);
    setPositions([...MOCK_POSITIONS]);
    setSelectedNode(null);
    toast.info("Data refreshed");
  }, []);

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
              <OrganizationTree
                departments={departments}
                positions={positions}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
              />
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
