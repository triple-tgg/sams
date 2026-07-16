"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  User,
  ChevronRight,
  ChevronDown,
  Search,
  ChevronsUpDown,
  X,
} from "lucide-react";
import type {
  DepartmentItem,
  PositionItem,
  SelectedNode,
} from "@/lib/api/master/department/department.interface";

interface Props {
  departments: DepartmentItem[];
  positions: PositionItem[];
  selectedNode: SelectedNode | null;
  onSelectNode: (node: SelectedNode) => void;
}

const OrganizationTree = ({
  departments,
  positions,
  selectedNode,
  onSelectNode,
}: Props) => {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Group positions by department
  const positionsByDept = useMemo(() => {
    const map = new Map<string, PositionItem[]>();
    positions.forEach((p) => {
      const list = map.get(p.departmentId) || [];
      list.push(p);
      map.set(p.departmentId, list);
    });
    return map;
  }, [positions]);

  // Filter departments/positions by search
  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const lower = searchTerm.toLowerCase();
    return departments.filter((dept) => {
      if (
        dept.code.toLowerCase().includes(lower) ||
        dept.name.toLowerCase().includes(lower)
      )
        return true;
      const deptPositions = positionsByDept.get(dept.id) || [];
      for (const pos of deptPositions) {
        if (
          pos.positionCode.toLowerCase().includes(lower) ||
          pos.positionName.toLowerCase().includes(lower)
        )
          return true;
      }
      return false;
    });
  }, [departments, searchTerm, positionsByDept]);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const toggleAll = () => {
    const allExpanded = expandedDepts.size === departments.length;
    if (allExpanded) {
      setExpandedDepts(new Set());
    } else {
      setExpandedDepts(new Set(departments.map((d) => d.id)));
    }
  };

  const isSelected = (type: SelectedNode["type"], id: string) =>
    selectedNode?.type === type && selectedNode?.id === id;



  return (
    <div className="flex flex-col h-full">
      {/* Search + Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggleAll}
          title="Expand/Collapse All"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {filteredDepts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            {searchTerm ? "No matching items found" : "No departments yet"}
          </div>
        ) : (
          filteredDepts.map((dept) => {
            const deptPositions = positionsByDept.get(dept.id) || [];
            const isDeptExpanded = expandedDepts.has(dept.id);
            const hasPositions = deptPositions.length > 0;

            return (
              <div key={dept.id}>
                {/* Department node */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group text-sm",
                    isSelected("department", dept.id)
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/60"
                  )}
                  onClick={() =>
                    onSelectNode({ type: "department", id: dept.id })
                  }
                >
                  <button
                    className="shrink-0 p-0.5 hover:bg-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDept(dept.id);
                    }}
                  >
                    {isDeptExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate flex-1">
                    <span className="font-mono text-xs text-muted-foreground mr-1.5">
                      {dept.code}
                    </span>
                    {dept.name}
                  </span>
                  {hasPositions && (
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {deptPositions.length}
                    </span>
                  )}
                </div>

                {/* Positions under department */}
                {isDeptExpanded && (
                  <div className="ml-4 pl-3 border-l border-border/50">
                    {deptPositions.map((pos) => (
                      <div
                        key={pos.id}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm",
                          isSelected("position", pos.id)
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/60"
                        )}
                        onClick={() =>
                          onSelectNode({
                            type: "position",
                            id: pos.id,
                          })
                        }
                      >
                        <span className="inline-block w-3.5 shrink-0" />
                        <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span className="truncate flex-1">
                          <span className="font-mono text-xs text-muted-foreground mr-1.5">
                            {pos.positionCode}
                          </span>
                          {pos.positionName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer summary */}
      <div className="pt-3 mt-2 border-t text-[11px] text-muted-foreground flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {departments.length} Departments
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {positions.length} Positions
        </span>
      </div>
    </div>
  );
};

export default OrganizationTree;
