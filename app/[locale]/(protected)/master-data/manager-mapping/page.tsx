"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  Building2,
  User,
  Briefcase,
  Search,
  X,
  UserPlus,
  Pencil,
  Trash2,
  AlertTriangle,
  Phone,
  Mail,
  Globe,
  CalendarDays,
  BadgeCheck,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type {
  StaffOption,
  ManagerMappingItem,
} from "@/lib/api/master/manager-mapping/managerMapping.interface";
import type { DepartmentItem } from "@/lib/api/master/department/department.interface";
import { useStaffDepartments, useStaffDepartmentChiefs, useUpsertStaffDepartmentChief } from "@/lib/api/master/organization.hooks";
import type { StaffDepartment, StaffDepartmentChief } from "@/lib/api/master/organization";
import { useStaffList } from "@/lib/api/hooks/useStaffOperations";
import { useStaffById } from "@/lib/api/hooks/useQAStaffManagement";

import StaffPickerDialog from "./components/StaffPickerDialog";

const ManagerMappingPage = () => {
  // Data — departments from API
  const { data: deptResp, isLoading: isLoadingDepts } = useStaffDepartments();
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

  // Data — manager mappings from API
  const { data: chiefsResp } = useStaffDepartmentChiefs();
  const mappings: ManagerMappingItem[] = useMemo(() => {
    const raw: StaffDepartmentChief[] = chiefsResp?.responseData ?? [];
    return raw
      .filter((c) => c.staffDepartmentId !== null)
      .map((c) => ({
        chiefId: c.id,
        departmentId: String(c.staffDepartmentId),
        staffId: c.staffId,
      }));
  }, [chiefsResp]);

  // Data — staff list for picker dialog
  const { data: staffResp } = useStaffList({ page: 1, perPage: 9999 });
  const staffList: StaffOption[] = useMemo(() => {
    const raw = staffResp?.responseData ?? [];
    return raw.map((s) => ({
      id: s.id,
      employeeId: s.code,
      fullNameTh: s.name,
      fullNameEn: s.name,
      nationality: "",
      phone: "",
      email: s.email ?? "",
      department: "",
      position: s.jobTitle ?? "",
      startDate: s.createddate,
    }));
  }, [staffResp]);

  // UI
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mapped staff IDs (for 1:1 exclusion in picker)
  const mappedStaffIds = useMemo(
    () => new Set(mappings.map((m) => m.staffId)),
    [mappings]
  );

  // Current mapping for selected dept
  const currentMapping = useMemo(
    () => mappings.find((m) => m.departmentId === selectedDeptId) || null,
    [mappings, selectedDeptId]
  );

  // Fetch staff detail by ID when a mapping is found
  const { data: staffDetailResp, isLoading: isLoadingStaffDetail } = useStaffById(
    currentMapping?.staffId ?? 0,
    !!currentMapping
  );

  // Map staff detail to StaffOption for display
  const currentStaff: StaffOption | null = useMemo(() => {
    const s = staffDetailResp?.responseData;
    if (!s) return null;
    return {
      id: s.id,
      employeeId: s.employeeId ?? s.code,
      fullNameTh: s.name,
      fullNameEn: s.fullNameEn ?? s.name,
      nationality: s.nationality ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      department: s.departmentObj?.name ?? "",
      position: s.jobTitle ?? s.positionObj?.name ?? "",
      startDate: s.startDate ?? s.createddate,
    };
  }, [staffDetailResp]);

  // Selected department object
  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedDeptId) || null,
    [departments, selectedDeptId]
  );

  // Filtered departments
  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const lower = searchTerm.toLowerCase();
    return departments.filter(
      (d) =>
        d.code.toLowerCase().includes(lower) ||
        d.name.toLowerCase().includes(lower)
    );
  }, [departments, searchTerm]);

  // ─── Mutations ───
  const upsertChiefMutation = useUpsertStaffDepartmentChief();

  // ─── Handlers ───

  const handleAssign = useCallback(
    async (staff: StaffOption) => {
      if (!selectedDeptId) return;
      try {
        await upsertChiefMutation.mutateAsync({
          id: 0,
          staffId: staff.id,
          staffDepartmentId: Number(selectedDeptId),
          isdelete: false,
        });
        toast.success(`Assigned "${staff.fullNameEn}" as manager`);
        setShowPicker(false);
      } catch {
        toast.error("Failed to assign manager");
      }
    },
    [selectedDeptId, upsertChiefMutation]
  );

  const handleRemove = useCallback(() => {
    if (!selectedDeptId) return;
    // TODO: connect remove chief API
    toast.info("Remove manager — API not connected yet");
    setShowDeleteConfirm(false);
  }, [selectedDeptId]);

  // Check if dept has mapping (for indicator dot)
  const hasMappingFor = useCallback(
    (deptId: string) => mappings.some((m) => m.departmentId === deptId),
    [mappings]
  );

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Department Manager Mapping</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-0 min-h-[560px] rounded-lg border overflow-hidden">
            {/* ─── Left: Department List ─── */}
            <div className="w-full lg:w-[300px] shrink-0 bg-muted/20 border-b lg:border-b-0 lg:border-r flex flex-col">
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search department..."
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
              </div>

              {/* Department items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {isLoadingDepts ? (
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : filteredDepts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No departments found
                  </div>
                ) : (
                  filteredDepts.map((dept) => {
                    const isSelected = selectedDeptId === dept.id;
                    const isMapped = hasMappingFor(dept.id);

                    return (
                      <div
                        key={dept.id}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/60"
                        )}
                        onClick={() => setSelectedDeptId(dept.id)}
                      >
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{dept.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {dept.code}
                          </p>
                        </div>
                        {/* Mapping indicator */}
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            isMapped
                              ? "bg-emerald-500"
                              : "bg-amber-400"
                          )}
                          title={isMapped ? "Manager assigned" : "Not assigned"}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer summary */}
              <div className="p-3 border-t text-[11px] text-muted-foreground">
                {mappings.length} of {departments.length} mapped
              </div>
            </div>

            {/* ─── Right: Manager Detail ─── */}
            <div className="flex-1 p-6 overflow-y-auto">
              {!selectedDeptId ? (
                /* No department selected */
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Building2 className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No department selected
                  </p>
                  <p className="text-xs text-muted-foreground/70 max-w-[240px]">
                    Select a department from the list to view or assign a manager
                  </p>
                </div>
              ) : currentMapping && isLoadingStaffDetail ? (
                /* Loading staff detail */
                <div className="flex items-center justify-center h-full py-16">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : !currentStaff ? (
                /* Department selected but no mapping */
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                    <UserPlus className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    No manager assigned
                  </p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[280px]">
                    Department{" "}
                    <span className="font-medium text-foreground">
                      {selectedDept?.name}
                    </span>{" "}
                    does not have a manager assigned yet.
                  </p>
                  <Button color="primary" onClick={() => setShowPicker(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Manager
                  </Button>
                </div>
              ) : (
                /* Manager info display */
                <div className="space-y-6">
                  {/* Header with department name and actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedDept?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Department Manager
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        color="primary"
                        onClick={() => setShowPicker(true)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Change
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        color="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Personal Info Section */}
                  <div className="rounded-lg border bg-card">
                    <div className="flex items-center gap-3 px-5 py-4 border-b">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <User className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-sm font-semibold">Personal Info</h4>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6">
                      <InfoField
                        label="Full Name (Thai)"
                        value={currentStaff.fullNameTh}
                      />
                      <InfoField
                        label="Full Name (English)"
                        value={currentStaff.fullNameEn}
                      />
                      <InfoField
                        label="Nationality"
                        value={currentStaff.nationality}
                        icon={<Globe className="h-3.5 w-3.5" />}
                      />
                      <InfoField
                        label="Phone"
                        value={currentStaff.phone}
                        icon={<Phone className="h-3.5 w-3.5" />}
                      />
                      <InfoField
                        label="Email"
                        value={currentStaff.email}
                        icon={<Mail className="h-3.5 w-3.5" />}
                      />
                    </div>
                  </div>

                  {/* Employment Section */}
                  <div className="rounded-lg border bg-card">
                    <div className="flex items-center gap-3 px-5 py-4 border-b">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Briefcase className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="text-sm font-semibold">Employment</h4>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6">
                      <InfoField
                        label="Employee ID"
                        value={currentStaff.employeeId}
                        icon={<Hash className="h-3.5 w-3.5" />}
                        mono
                      />
                      <InfoField
                        label="Department"
                        value={currentStaff.department}
                        icon={<Building2 className="h-3.5 w-3.5" />}
                      />
                      <InfoField
                        label="Position"
                        value={currentStaff.position}
                        icon={<BadgeCheck className="h-3.5 w-3.5" />}
                      />
                      <InfoField
                        label="Start Date"
                        value={formatDate(currentStaff.startDate)}
                        icon={<CalendarDays className="h-3.5 w-3.5" />}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Staff Picker Dialog ─── */}
      <Dialog
        open={showPicker}
        onOpenChange={(open) => !open && setShowPicker(false)}
      >
        <DialogContent className="max-w-2xl" size="md">
          <StaffPickerDialog
            staffList={staffList}
            excludeIds={
              // Exclude staff mapped to OTHER departments (allow reassigning current)
              new Set(
                mappings
                  .filter((m) => m.departmentId !== selectedDeptId)
                  .map((m) => m.staffId)
              )
            }
            onClose={() => setShowPicker(false)}
            onSelect={handleAssign}
          />
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Manager
            </DialogTitle>
            <DialogDescription className="mt-2">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {currentStaff?.fullNameEn}
              </span>{" "}
              as manager of{" "}
              <span className="font-semibold text-foreground">
                {selectedDept?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button color="destructive" onClick={handleRemove}>
              Remove Manager
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Reusable info field ───
function InfoField({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-primary/70 font-medium">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && (
          <span className="text-muted-foreground shrink-0">{icon}</span>
        )}
        <p
          className={cn(
            "text-sm font-medium",
            mono && "font-mono"
          )}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default ManagerMappingPage;
