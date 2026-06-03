"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
    Plus,
    RefreshCw,
    Pencil,
    Trash2,
    ShieldCheck,
    Users,
    Eye,
    FilePlus2,
    SquarePen,
    Eraser,
    Download,
    Check,
    X,
} from "lucide-react";
import { toast } from "sonner";
import {
    useInfiniteRoleList,
    useUpsertRole,
    useDeleteRole,
    useRolePermissions,
} from "@/lib/api/hooks/useRoleOperations";
import { useBatchUpsertPermissions } from "@/lib/api/hooks/useBatchUpsertPermissions";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import type { RoleItem } from "@/lib/api/master/roles/roles.interface";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";

type DialogMode = "closed" | "add" | "edit" | "confirm-delete";

// ──────────────────────────────────────────────
// Role Form Dialog
// ──────────────────────────────────────────────
function RoleFormDialog({
    mode,
    role,
    onClose,
    onSubmit,
    isPending,
}: {
    mode: "add" | "edit";
    role?: RoleItem | null;
    onClose: () => void;
    onSubmit: (data: { code: string; name: string; description: string; isdelete: boolean }) => void;
    isPending: boolean;
}) {
    const [code, setCode] = useState(role?.code ?? "");
    const [name, setName] = useState(role?.name ?? "");
    const [description, setDescription] = useState(role?.description ?? "");
    // isdelete=false means active; the form toggle maps to !isdelete
    const [isActive, setIsActive] = useState(!(role?.isdelete ?? false));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
            toast.error("Code and Name are required");
            return;
        }
        onSubmit({ code: code.trim(), name: name.trim(), description: description.trim(), isdelete: !isActive });
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{mode === "add" ? "Add New Role" : "Edit Role"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-1">
                    <Label htmlFor="role-code">
                        Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="role-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. ADMIN"
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="role-name">
                        Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="role-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Administrator"
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="role-desc">Description</Label>
                    <Input
                        id="role-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional description"
                        disabled={isPending}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Switch
                        id="role-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={isPending}
                    />
                    <Label htmlFor="role-active">Active</Label>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : mode === "add" ? "Create Role" : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ──────────────────────────────────────────────
// Permission toggle cell
// ──────────────────────────────────────────────
const PermCell = ({
    value,
    onChange,
    icon: Icon,
    label,
    color,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
    icon: React.ElementType;
    label: string;
    color: string;
}) => (
    <button
        type="button"
        onClick={() => onChange(!value)}
        title={label}
        className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 border ${value
            ? `${color} border-transparent text-white shadow-sm`
            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
            }`}
    >
        <Icon className="w-3.5 h-3.5" />
    </button>
);

// Permission field keys for the toggle columns
type PermField = "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport";
const PERM_FIELDS: PermField[] = ["canView", "canCreate", "canEdit", "canDelete", "canExport"];

// Helper: flatten nested MenuPermissionItem[] → flat array with depth/parent info
type FlatPerm = MenuPermissionItem & { _depth: number; _isParent: boolean; _parentId: number | null };

function flattenPerms(items: MenuPermissionItem[], depth = 0, parentId: number | null = null): FlatPerm[] {
    const result: FlatPerm[] = [];
    for (const item of items) {
        const hasChildren = !!(item.children && item.children.length > 0);
        result.push({ ...item, _depth: depth, _isParent: hasChildren, _parentId: parentId });
        if (hasChildren) {
            result.push(...flattenPerms(item.children!, depth + 1, item.menuId));
        }
    }
    return result;
}

/** Recalculate parent permission values from their children */
function recalcParents(perms: FlatPerm[]): FlatPerm[] {
    // Collect parent menuIds
    const parentIds = new Set(perms.filter((p) => p._isParent).map((p) => p.menuId));
    if (parentIds.size === 0) return perms;

    // For each parent, compute each field from its children
    return perms.map((p) => {
        if (!p._isParent) return p;
        const children = perms.filter((c) => c._parentId === p.menuId);
        const updated = { ...p };
        for (const field of PERM_FIELDS) {
            updated[field] = children.some((c) => c[field] === true);
        }
        return updated;
    });
}

// ──────────────────────────────────────────────
// Permission Panel — uses /permission/menus/{roleId}
// ──────────────────────────────────────────────
function PermissionPanel({ role }: { role: RoleItem }) {
    const { data, isLoading } = useRolePermissions(role.id);
    const { mutate: savePermissions, isPending: isSaving } = useBatchUpsertPermissions();

    const serverPerms = data?.responseData ?? [];
    const [permissions, setPermissions] = useState<FlatPerm[]>([]);

    // Sync when server data arrives — flatten nested structure
    const [synced, setSynced] = useState(false);
    if (!isLoading && !synced && serverPerms.length > 0) {
        setSynced(true);
        setPermissions(recalcParents(flattenPerms(serverPerms)));
    }

    const toggleField = (menuId: number, field: PermField) => {
        setPermissions((prev) => {
            const toggled = prev.map((p) =>
                p.menuId === menuId ? { ...p, [field]: !p[field] } : p
            );
            return recalcParents(toggled);
        });
    };

    // Toggle all for a column (children only — parents auto-compute)
    const toggleAll = (field: PermField) => {
        setPermissions((prev) => {
            const childrenOnly = prev.filter((p) => !p._isParent);
            const allOn = childrenOnly.every((p) => p[field]);
            const toggled = prev.map((p) =>
                p._isParent ? p : { ...p, [field]: !allOn }
            );
            return recalcParents(toggled);
        });
    };

    // Save permissions via batch-upsert API
    const handleSave = () => {
        const storedUser = localStorage.getItem('user');
        const userName = storedUser ? (JSON.parse(storedUser).userName || 'system') : 'system';

        // Recalc parents before save to ensure consistency
        const final = recalcParents(permissions);

        savePermissions(
            {
                roleId: role.id,
                permissions: final.map((p) => ({
                    menuId: p.menuId,
                    canView: p.canView,
                    canCreate: p.canCreate,
                    canEdit: p.canEdit,
                    canDelete: p.canDelete,
                    canExport: p.canExport,
                })),
                updatedBy: userName,
            },
            {
                onSuccess: (res) => {
                    if (res.message === 'success') {
                        toast.success('Permissions saved successfully!');
                    } else {
                        toast.error(res.error || 'Failed to save permissions');
                    }
                },
                onError: (err) => toast.error(err.message || 'Failed to save permissions'),
            }
        );
    };

    const cols: {
        field: PermField;
        icon: React.ElementType;
        label: string;
        color: string;
    }[] = [
            { field: "canView", icon: Eye, label: "View", color: "bg-primary" },
            { field: "canCreate", icon: FilePlus2, label: "Create", color: "bg-primary" },
            { field: "canEdit", icon: SquarePen, label: "Edit", color: "bg-primary" },
            { field: "canDelete", icon: Eraser, label: "Delete", color: "bg-primary" },
            { field: "canExport", icon: Download, label: "Export", color: "bg-primary" },
        ];

    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-40" />
                        <div className="flex gap-2 ml-auto">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <Skeleton key={j} className="h-8 w-8 rounded-md" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Permissions for</span>
                    <Badge color="secondary" className="font-mono text-xs">
                        {role.name}
                    </Badge>
                </div>

                <PermissionActionGuard menuCode="MASTER_DATA_ROLE" action="canEdit">
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Permissions"}
                    </Button>
                </PermissionActionGuard>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/10 text-xs text-muted-foreground">
                <span className="flex-1 font-medium">Menu</span>
                {cols.map((col) => (
                    <div key={col.field} className="w-8 text-center">
                        <button
                            type="button"
                            onClick={() => toggleAll(col.field)}
                            title={`Toggle all ${col.label}`}
                            className={`w-8 h-6 rounded text-[10px] font-bold transition-colors ${permissions.filter((p) => !p._isParent).every((p) => p[col.field])
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {col.label.slice(0, 3)}
                        </button>
                    </div>
                ))}
            </div>

            {/* Permission rows */}
            <div className="flex-1 overflow-y-auto">
                {permissions.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No permission data available for this role.
                    </div>
                ) : (
                    permissions.map((perm, idx) => (
                        <div
                            key={perm.menuId}
                            className={`flex items-center gap-2 px-4 py-2.5 border-b border-border/50 transition-colors hover:bg-muted/10 ${perm._isParent ? "bg-muted/15" : idx % 2 === 0 ? "" : "bg-muted/5"
                                }`}
                        >
                            <span
                                className={`flex-1 text-sm ${perm._depth === 0 ? "font-semibold" : "font-normal text-muted-foreground"}`}
                                style={{ paddingLeft: `${perm._depth * 20}px` }}
                            >
                                {perm._depth > 0 && <span className="mr-1.5 text-muted-foreground/50">└</span>}
                                {perm.name}
                            </span>
                            {perm._isParent ? (
                                /* Parent row: read-only indicators auto-computed from children */
                                cols.map((col) => (
                                    <div
                                        key={col.field}
                                        className={`flex items-center justify-center w-8 h-8 rounded-md ${perm[col.field]
                                            ? "text-primary"
                                            : "text-muted-foreground/30"
                                            }`}
                                        title={`${col.label}: ${perm[col.field] ? "Yes (from children)" : "No"}`}
                                    >
                                        {perm[col.field] ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : (
                                            <X className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                /* Child row: clickable toggle buttons */
                                cols.map((col) => (
                                    <PermCell
                                        key={col.field}
                                        value={perm[col.field] as boolean}
                                        onChange={() => toggleField(perm.menuId, col.field)}
                                        icon={col.icon}
                                        label={col.label}
                                        color={col.color}
                                    />
                                ))
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const RolePermissionPage = () => {
    const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
    const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
    const [editTarget, setEditTarget] = useState<RoleItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);

    const {
        data: infiniteData,
        isLoading,
        error,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
        isFetching,
    } = useInfiniteRoleList(true);
    const { mutate: upsertRole, isPending: isUpserting } = useUpsertRole();
    const { mutate: deleteRoleMutation, isPending: isDeleting } = useDeleteRole();

    // Flatten all pages into a single list
    const roles = infiniteData?.pages.flatMap((p) => p.responseData ?? []) ?? [];
    const totalAll = infiniteData?.pages[0]?.totalAll ?? 0;

    // Scroll sentinel — triggers next page fetch
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Auto-select first role
    const displayedRole = selectedRole ?? roles[0] ?? null;

    const handleAdd = (formData: { code: string; name: string; description: string; isdelete: boolean }) => {
        upsertRole(
            { id: 0, code: formData.code, name: formData.name, description: formData.description, isdelete: formData.isdelete, userName: "system" },
            {
                onSuccess: (res) => {
                    if (res.message === "success") {
                        toast.success("Role created successfully!");
                        setDialogMode("closed");
                        refetch();
                    } else {
                        toast.error(res.error || "Failed to create role");
                    }
                },
                onError: (err) => toast.error(err.message || "Failed to create role"),
            }
        );
    };

    const handleEdit = (formData: { code: string; name: string; description: string; isdelete: boolean }) => {
        if (!editTarget) return;
        upsertRole(
            { id: editTarget.id, code: formData.code, name: formData.name, description: formData.description, isdelete: formData.isdelete, userName: "system" },
            {
                onSuccess: (res) => {
                    if (res.message === "success") {
                        toast.success("Role updated successfully!");
                        setDialogMode("closed");
                        setEditTarget(null);
                        refetch();
                    } else {
                        toast.error(res.error || "Failed to update role");
                    }
                },
                onError: (err) => toast.error(err.message || "Failed to update role"),
            }
        );
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteRoleMutation(
            { id: deleteTarget.id, userName: "system" },
            {
                onSuccess: (res) => {
                    if (res.message === "success") {
                        toast.success("Role deleted successfully!");
                        if (selectedRole?.id === deleteTarget.id) setSelectedRole(null);
                        setDeleteTarget(null);
                        refetch();
                    } else {
                        toast.error(res.error || "Failed to delete role");
                    }
                },
                onError: (err) => toast.error(err.message || "Failed to delete role"),
            }
        );
    };

    return (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Role &amp; Permission</h1>
                    <p className="text-sm text-muted-foreground">Manage roles and their menu permissions</p>
                </div>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-[300px_1fr] gap-4 flex-1 min-h-0">
                {/* ── LEFT: Role list ── */}
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-semibold">Roles</CardTitle>
                            <Badge color="secondary" className="text-xs">
                                {totalAll > 0 ? `${roles.length} / ${totalAll}` : roles.length}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => refetch()}
                                disabled={isFetching}
                                title="Refresh"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                            </Button>
                            <PermissionActionGuard menuCode="MASTER_DATA_ROLE" action="canCreate">
                                <Button
                                    size="sm"
                                    className="h-7 text-xs px-2"
                                    onClick={() => setDialogMode("add")}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add
                                </Button>
                            </PermissionActionGuard>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {error ? (
                            <div className="p-4 text-center text-sm text-destructive">
                                Failed to load roles.{" "}
                                <button className="underline" onClick={() => refetch()}>Retry</button>
                            </div>
                        ) : isLoading ? (
                            <div className="space-y-1 p-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                                ))}
                            </div>
                        ) : roles.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No roles found. Click Add to create one.
                            </div>
                        ) : (
                            <div className="p-2 space-y-0.5">
                                {roles.map((role) => {
                                    const isSelected = displayedRole?.id === role.id;
                                    return (
                                        <div
                                            key={role.id}
                                            onClick={() => setSelectedRole(role)}
                                            className={`group flex items-center gap-2 rounded-md px-3 py-2.5 cursor-pointer transition-all ${isSelected
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "hover:bg-muted"
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{role.name}</p>
                                                <p
                                                    className={`text-xs font-mono truncate ${isSelected
                                                        ? "text-primary-foreground/70"
                                                        : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {role.code}
                                                </p>
                                            </div>
                                            {/* Action buttons — visible on hover or selected */}
                                            <div
                                                className={`flex items-center gap-0.5 transition-opacity ${isSelected
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                                    }`}
                                            >
                                                <PermissionActionGuard menuCode="MASTER_DATA_ROLE" action="canEdit">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditTarget(role);
                                                            setDialogMode("edit");
                                                        }}
                                                        className={`p-1 rounded transition-colors ${isSelected
                                                            ? "hover:bg-primary-foreground/20 text-primary-foreground"
                                                            : "hover:bg-muted-foreground/10 text-muted-foreground"
                                                            }`}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </PermissionActionGuard>
                                                <PermissionActionGuard menuCode="MASTER_DATA_ROLE" action="canDelete">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget(role);
                                                            setDialogMode("confirm-delete");
                                                        }}
                                                        className={`p-1 rounded transition-colors ${isSelected
                                                            ? "hover:bg-red-400/30 text-primary-foreground"
                                                            : "hover:bg-destructive/10 text-destructive"
                                                            }`}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </PermissionActionGuard>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Scroll sentinel */}
                                <div ref={sentinelRef} className="py-1">
                                    {isFetchingNextPage && (
                                        <div className="flex justify-center py-2">
                                            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                    {!hasNextPage && roles.length > 0 && (
                                        <p className="text-center text-[10px] text-muted-foreground py-1">
                                            All {totalAll} roles loaded
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── RIGHT: Permission panel ── */}
                <Card className="flex flex-col overflow-hidden">
                    {displayedRole ? (
                        <PermissionPanel key={displayedRole.id} role={displayedRole} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <ShieldCheck className="h-12 w-12 opacity-20" />
                            <p className="text-sm">Select a role to manage its permissions</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* ── Add Dialog ── */}
            <Dialog open={dialogMode === "add"} onOpenChange={(o) => !o && setDialogMode("closed")}>
                <DialogContent className="max-w-md">
                    <RoleFormDialog
                        mode="add"
                        onClose={() => setDialogMode("closed")}
                        onSubmit={handleAdd}
                        isPending={isUpserting}
                    />
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ── */}
            <Dialog
                open={dialogMode === "edit"}
                onOpenChange={(o) => {
                    if (!o) {
                        setDialogMode("closed");
                        setEditTarget(null);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <RoleFormDialog
                        mode="edit"
                        role={editTarget}
                        onClose={() => {
                            setDialogMode("closed");
                            setEditTarget(null);
                        }}
                        onSubmit={handleEdit}
                        isPending={isUpserting}
                    />
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <AlertDialog
                open={dialogMode === "confirm-delete"}
                onOpenChange={(o) => {
                    if (!o) {
                        setDialogMode("closed");
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">"{deleteTarget?.name}"</span>? This action cannot be
                            undone and will remove all associated permissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setDialogMode("closed");
                                setDeleteTarget(null);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RolePermissionPage;
