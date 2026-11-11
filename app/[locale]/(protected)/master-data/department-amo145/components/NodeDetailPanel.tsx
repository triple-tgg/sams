"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  User,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  UserCircle,
  FileText,
  Loader2,
} from "lucide-react";
import type {
  DepartmentItem,
  PositionItem,
  SelectedNode,
  OrgNodeType,
} from "@/lib/api/master/department/department.interface";
import {
  useStaffDepartmentAmo145ById,
  useStaffDepartmentPositionAmo145ById,
} from "@/lib/api/master/organization-amo145.hooks";
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

interface Props {
  selectedNode: SelectedNode | null;
  departments: DepartmentItem[];
  positions: PositionItem[];
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: (type: OrgNodeType) => void;
}

const nodeIcon: Record<OrgNodeType, React.ReactNode> = {
  department: <Building2 className="h-5 w-5 text-primary" />,
  position: <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />,
};

const nodeLabel: Record<OrgNodeType, string> = {
  department: "Department",
  position: "Position",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const NodeDetailPanel = ({
  selectedNode,
  departments,
  positions,
  onEdit,
  onDelete,
  onAddChild,
}: Props) => {
  const perm = useMenuPermission(MENU.MASTER_DATA_DEPARTMENT_AMO145);
  // Only server records have numeric IDs; locally-added items (e.g. "D001")
  // are not fetched and fall back to the list data.
  const numericDeptId =
    selectedNode?.type === "department" ? Number(selectedNode.id) : NaN;
  const deptId = Number.isInteger(numericDeptId) ? numericDeptId : null;

  const numericPosId =
    selectedNode?.type === "position" ? Number(selectedNode.id) : NaN;
  const posId = Number.isInteger(numericPosId) ? numericPosId : null;

  const { data: deptDetailResp, isLoading: isLoadingDept } =
    useStaffDepartmentAmo145ById(deptId);
  const { data: posDetailResp, isLoading: isLoadingPos } =
    useStaffDepartmentPositionAmo145ById(posId);

  // Empty state
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Building2 className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          No item selected
        </p>
        <p className="text-xs text-muted-foreground/70 max-w-[240px]">
          Select a department or position from the tree to view its details
        </p>
      </div>
    );
  }

  const { type, id } = selectedNode;

  // ─── Department detail ───
  if (type === "department") {
    if (deptId !== null && isLoadingDept) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      );
    }

    const listDept = departments.find((d) => d.id === id);
    const detail = deptDetailResp?.responseData;
    const dept = detail
      ? {
          id: String(detail.id),
          code: detail.code,
          name: detail.name,
          description: detail.description,
          createddate: detail.createddate,
          createdby: detail.createdby,
          updateddate: detail.updateddate,
          updatedby: detail.updatedby,
        }
      : listDept
        ? { ...listDept, description: null as string | null }
        : null;
    if (!dept) return null;

    const childPositions = positions.filter((p) => p.departmentId === id);

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {nodeIcon.department}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{dept.name}</h3>
                <span className="text-xs font-mono border bg-transparent rounded-md px-2 py-0.5">
                  {dept.code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {nodeLabel.department} · ID: {dept.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {perm.canEdit && (<Button variant="outline" size="icon" color="primary" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>)}
            {perm.canDelete && (<Button
              variant="outline"
              size="icon"
              color="destructive"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>)}
          </div>
        </div>

        <Separator />

        {/* Detail fields */}
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Created"
            value={formatDate(dept.createddate)}
          />
          <DetailField
            icon={<UserCircle className="h-3.5 w-3.5" />}
            label="Created By"
            value={dept.createdby || "-"}
          />
          <DetailField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Updated"
            value={formatDate(dept.updateddate)}
          />
          <DetailField
            icon={<UserCircle className="h-3.5 w-3.5" />}
            label="Updated By"
            value={dept.updatedby || "-"}
          />
          <div className="col-span-2">
            <DetailField
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Description"
              value={dept.description || "-"}
            />
          </div>
        </div>

        <Separator />

        {/* Positions list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">
              Positions ({childPositions.length})
            </h4>
            {perm.canCreate && (<Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onAddChild("position")}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Position
            </Button>)}
          </div>
          {childPositions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No positions in this department yet
            </p>
          ) : (
            <div className="space-y-1">
              {childPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 text-sm"
                >
                  <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {pos.positionCode}
                  </span>
                  <span className="flex-1 truncate">{pos.positionName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Position detail ───
  if (type === "position") {
    if (posId !== null && isLoadingPos) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      );
    }

    const listPos = positions.find((p) => p.id === id);
    const detail = posDetailResp?.responseData;
    const pos = detail
      ? {
          id: String(detail.id),
          departmentId:
            detail.staffDepartmentAmo145Id != null
              ? String(detail.staffDepartmentAmo145Id)
              : "",
          positionCode: detail.code,
          positionName: detail.name,
          description: detail.description,
          createddate: detail.createddate,
          createdby: detail.createdby,
          updateddate: detail.updateddate,
          updatedby: detail.updatedby,
        }
      : listPos
        ? { ...listPos, description: null as string | null }
        : null;
    if (!pos) return null;

    const parentDept =
      departments.find((d) => d.id === pos.departmentId) || null;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {nodeIcon.position}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{pos.positionName}</h3>
                <span className="text-xs font-mono border bg-transparent rounded-md px-2 py-0.5">
                  {pos.positionCode}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {nodeLabel.position} · ID: {pos.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {perm.canEdit && (<Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>)}
            {perm.canDelete && (<Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>)}
          </div>
        </div>

        <Separator />

        {/* Detail fields */}
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Department"
            value={parentDept ? `${parentDept.code} — ${parentDept.name}` : pos.departmentId ? `ID: ${pos.departmentId}` : "-"}
          />
          <DetailField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Created"
            value={formatDate(pos.createddate)}
          />
          <DetailField
            icon={<UserCircle className="h-3.5 w-3.5" />}
            label="Created By"
            value={pos.createdby || "-"}
          />
          <DetailField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Updated"
            value={formatDate(pos.updateddate)}
          />
          <div className="col-span-2">
            <DetailField
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Description"
              value={pos.description || "-"}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Reusable detail field
function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium pl-5">{value}</p>
    </div>
  );
}

export default NodeDetailPanel;

