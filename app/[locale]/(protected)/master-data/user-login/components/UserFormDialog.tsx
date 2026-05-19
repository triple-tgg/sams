"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Eye, FilePlus2, SquarePen, Eraser, Download, ShieldCheck, User } from "lucide-react";
import React, { useState, useEffect } from "react";
import type { UserItem } from "@/lib/api/master/users/users.interface";
import { useRolesOptions } from "@/lib/api/hooks/useRoles";
import { useRolePermissions } from "@/lib/api/hooks/useRoleOperations";
import type { MenuPermission } from "@/lib/api/master/roles/roles.interface";

// ─── Default menu list (fallback when server has no permission data) ───────────
const DEFAULT_MENUS: Omit<MenuPermission, "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport">[] = [
    { menuId: "flight", menuName: "Flight Management", menuKey: "flight" },
    { menuId: "contract", menuName: "Contract", menuKey: "contract" },
    { menuId: "invoice", menuName: "Invoice", menuKey: "invoice" },
    { menuId: "report", menuName: "Report", menuKey: "report" },
    { menuId: "qa-staff", menuName: "QA Staff", menuKey: "qa-staff" },
    { menuId: "qa-monitoring", menuName: "Training Monitoring", menuKey: "qa-monitoring" },
    { menuId: "qa-course", menuName: "Course Management", menuKey: "qa-course" },
    { menuId: "qa-scheduler", menuName: "Training Scheduler", menuKey: "qa-scheduler" },
    { menuId: "qa-authorization", menuName: "Authorization", menuKey: "qa-authorization" },
    { menuId: "master-customer", menuName: "Customer Airline", menuKey: "master-customer" },
    { menuId: "master-staff", menuName: "Staff", menuKey: "master-staff" },
    { menuId: "master-station", menuName: "Station", menuKey: "master-station" },
    { menuId: "master-user", menuName: "User Login", menuKey: "master-user" },
    { menuId: "master-role", menuName: "Role & Permission", menuKey: "master-role" },
];

const buildDefaultPermissions = (): MenuPermission[] =>
    DEFAULT_MENUS.map((m) => ({
        ...m,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
    }));

// ─── Permission toggle cell ────────────────────────────────────────────────────
const PermCell = ({
    value,
    onChange,
    icon: Icon,
    label,
    disabled,
}: {
    value: boolean;
    onChange?: (v: boolean) => void;
    icon: React.ElementType;
    label: string;
    disabled?: boolean;
}) => (
    <button
        type="button"
        onClick={() => !disabled && onChange?.(!value)}
        title={label}
        disabled={disabled}
        className={`flex items-center justify-center w-7 h-7 rounded transition-all duration-150 border ${
            value
                ? "bg-primary border-transparent text-primary-foreground shadow-sm"
                : "border-border bg-muted/30 text-muted-foreground"
        } ${disabled ? "cursor-default opacity-70" : "cursor-pointer hover:opacity-80"}`}
    >
        <Icon className="w-3 h-3" />
    </button>
);

// ─── Permission panel rendered inside the dialog ───────────────────────────────
const PermissionSection = ({
    roleId,
    isViewMode,
    permissions,
    onPermissionsChange,
}: {
    roleId: number;
    isViewMode: boolean;
    permissions: MenuPermission[];
    onPermissionsChange: (perms: MenuPermission[]) => void;
}) => {
    const { isLoading } = useRolePermissions(roleId, roleId > 0);

    const cols: {
        field: keyof Omit<MenuPermission, "menuId" | "menuName" | "menuKey">;
        icon: React.ElementType;
        label: string;
    }[] = [
        { field: "canView", icon: Eye, label: "View" },
        { field: "canCreate", icon: FilePlus2, label: "Create" },
        { field: "canEdit", icon: SquarePen, label: "Edit" },
        { field: "canDelete", icon: Eraser, label: "Delete" },
        { field: "canExport", icon: Download, label: "Export" },
    ];

    const toggleField = (idx: number, field: keyof MenuPermission) => {
        if (isViewMode) return;
        const next = permissions.map((p, i) =>
            i === idx ? { ...p, [field]: !p[field as keyof MenuPermission] } : p
        );
        onPermissionsChange(next);
    };

    const toggleAll = (field: keyof Omit<MenuPermission, "menuId" | "menuName" | "menuKey">) => {
        if (isViewMode) return;
        const allOn = permissions.every((p) => p[field]);
        onPermissionsChange(permissions.map((p) => ({ ...p, [field]: !allOn })));
    };

    if (isLoading) {
        return (
            <div className="space-y-2 pt-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-28" />
                        <div className="flex gap-1.5 ml-auto">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <Skeleton key={j} className="h-7 w-7 rounded" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Column header row */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/20 rounded-t border border-b-0 text-xs text-muted-foreground">
                <span className="flex-1 font-medium text-foreground">Menu</span>
                {cols.map((col) => (
                    <div key={col.field} className="w-7 text-center">
                        <button
                            type="button"
                            disabled={isViewMode}
                            onClick={() => toggleAll(col.field)}
                            title={`Toggle all ${col.label}`}
                            className={`w-7 h-5 rounded text-[9px] font-bold transition-colors ${
                                permissions.every((p) => p[col.field])
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            } ${isViewMode ? "cursor-default" : "hover:opacity-80 cursor-pointer"}`}
                        >
                            {col.label.slice(0, 3)}
                        </button>
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div className="border border-t-0 rounded-b overflow-hidden">
                {permissions.map((perm, idx) => (
                    <div
                        key={perm.menuId}
                        className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-border/40 last:border-0 ${
                            idx % 2 === 0 ? "" : "bg-muted/5"
                        }`}
                    >
                        <span className="flex-1 text-xs font-medium truncate">{perm.menuName}</span>
                        {cols.map((col) => (
                            <PermCell
                                key={col.field}
                                value={perm[col.field] as boolean}
                                onChange={() => toggleField(idx, col.field)}
                                icon={col.icon}
                                label={col.label}
                                disabled={isViewMode}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main component props ──────────────────────────────────────────────────────
type Props = {
    mode: "add" | "edit" | "view";
    user?: UserItem | null;
    isPending?: boolean;
    onClose: () => void;
    onSubmit?: (data: {
        username: string;
        email: string;
        passwordData: string;
        fullName: string;
        role: string;
        isActive: boolean;
        permissions: MenuPermission[];
    }) => void;
};

// ─── Main UserFormDialog ───────────────────────────────────────────────────────
const UserFormDialog = ({ mode, user, isPending = false, onClose, onSubmit }: Props) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [passwordData, setPasswordData] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [permissions, setPermissions] = useState<MenuPermission[]>(buildDefaultPermissions);

    const { options: roleOptions, isLoading: loadingRoles } = useRolesOptions();
    const selectedRoleId = role ? parseInt(role, 10) : 0;

    // Fetch default permissions for selected role (used in add/edit)
    const { data: rolePermData } = useRolePermissions(selectedRoleId, selectedRoleId > 0 && mode !== "view");

    const isViewMode = mode === "view";
    const isAddMode = mode === "add";
    const dialogTitle = mode === "add" ? "Add New User" : mode === "edit" ? "Edit User" : "View User";
    const dialogDesc = {
        add: "Fill in the details to create a new user account.",
        edit: "Update user information. Leave password blank to keep current.",
        view: "Viewing user details and assigned role permissions.",
    }[mode];

    // Populate form when editing/viewing
    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setEmail(user.email || "");
            setFullName(user.fullName || "");
            setRole(user.roleObj?.id?.toString() || "");
            setIsActive(user.isActive ?? true);
            setPasswordData("");
        } else {
            setUsername("");
            setEmail("");
            setPasswordData("");
            setFullName("");
            setRole("");
            setIsActive(true);
        }
    }, [user]);

    // When role permissions load, populate permission panel
    useEffect(() => {
        if (rolePermData?.responseData && rolePermData.responseData.length > 0) {
            const mappedPermissions: MenuPermission[] = rolePermData.responseData.map((item) => ({
                menuId: String(item.menuId),
                menuName: item.name || "",
                menuKey: item.menuCode || "",
                canView: item.canView || false,
                canCreate: item.canCreate || false,
                canEdit: item.canEdit || false,
                canDelete: item.canDelete || false,
                canExport: item.canExport || false,
            }));
            setPermissions(mappedPermissions);
        } else if (selectedRoleId === 0) {
            setPermissions(buildDefaultPermissions());
        }
    }, [rolePermData, selectedRoleId]);

    const isFormValid = () => {
        if (isAddMode) return username.trim() && email.trim() && passwordData.trim() && role;
        return username.trim() && email.trim() && role;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.({
            username: username.trim(),
            email: email.trim(),
            passwordData: passwordData.trim(),
            fullName: fullName.trim(),
            role,
            isActive,
            permissions,
        });
    };

    return (
        <div className="flex flex-col max-h-[85vh]">
            {/* ── Header ── */}
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDesc}</DialogDescription>
            </DialogHeader>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-6">
                <form id="user-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ── LEFT: General Info ── */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold">General Information</h3>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="user-username">
                                    Username <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="user-username"
                                    placeholder="e.g. johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isViewMode || isPending}
                                    required={!isViewMode}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="user-email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="user-email"
                                    type="email"
                                    placeholder="e.g. john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isViewMode || isPending}
                                    required={!isViewMode}
                                />
                            </div>

                            {!isViewMode && (
                                <div className="space-y-1">
                                    <Label htmlFor="user-password">
                                        Password{" "}
                                        {isAddMode ? (
                                            <span className="text-destructive">*</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>
                                        )}
                                    </Label>
                                    <Input
                                        id="user-password"
                                        type="password"
                                        placeholder={isAddMode ? "Enter password" : "New password (optional)"}
                                        value={passwordData}
                                        onChange={(e) => setPasswordData(e.target.value)}
                                        disabled={isPending}
                                        required={isAddMode}
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label htmlFor="user-fullname">Full Name</Label>
                                <Input
                                    id="user-fullname"
                                    placeholder="e.g. John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={isViewMode || isPending}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="user-role">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    key={`role-${role}-${loadingRoles}`}
                                    value={role}
                                    onValueChange={setRole}
                                    disabled={isViewMode || isPending || loadingRoles}
                                >
                                    <SelectTrigger id="user-role">
                                        <SelectValue placeholder={loadingRoles ? "Loading..." : "Select role"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((opt) => (
                                            <SelectItem key={opt.id} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="user-active" className="text-sm">
                                        Active Status
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {isActive ? "User is active" : "User is inactive"}
                                    </p>
                                </div>
                                <Switch
                                    id="user-active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={isViewMode || isPending}
                                />
                            </div>

                            {/* View-mode extra metadata */}
                            {isViewMode && user && (
                                <div className="space-y-2 pt-3 border-t">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Metadata</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        {[
                                            ["Role", user.roleObj?.name || "-"],
                                            ["Role Code", user.roleObj?.code || "-"],
                                            ["Created By", user.createdBy || "-"],
                                            [
                                                "Created",
                                                user.createdDate
                                                    ? new Date(user.createdDate).toLocaleDateString("en-GB", {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                      })
                                                    : "-",
                                            ],
                                            ["Updated By", user.updatedBy || "-"],
                                            [
                                                "Updated",
                                                user.updatedDate
                                                    ? new Date(user.updatedDate).toLocaleDateString("en-GB", {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                      })
                                                    : "-",
                                            ],
                                        ].map(([label, val]) => (
                                            <div key={label}>
                                                <span className="text-muted-foreground">{label}:</span>
                                                <p className="font-medium">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT: Role Permissions ── */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold">Role Permissions</h3>
                                {!selectedRoleId && (
                                    <span className="text-xs text-muted-foreground">(select a role to load)</span>
                                )}
                            </div>

                            {selectedRoleId > 0 ? (
                                <PermissionSection
                                    roleId={selectedRoleId}
                                    isViewMode={isViewMode}
                                    permissions={permissions}
                                    onPermissionsChange={setPermissions}
                                />
                            ) : (
                                <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground min-h-[200px]">
                                    <ShieldCheck className="h-8 w-8 opacity-20" />
                                    <p className="text-xs">Select a role on the left to preview its permissions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Footer ── */}
            <DialogFooter className="px-6 py-4 border-t shrink-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                    {isViewMode ? "Close" : "Cancel"}
                </Button>
                {!isViewMode && (
                    <Button
                        type="submit"
                        form="user-form"
                        disabled={isPending || !isFormValid()}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : mode === "add" ? (
                            "Add User"
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                )}
            </DialogFooter>
        </div>
    );
};

export default UserFormDialog;
