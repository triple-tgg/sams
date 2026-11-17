"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import { useMenuPermission } from "@/hooks/use-menu-permission";
import { useRefreshPermissions } from "@/hooks/use-permission-hydration";
import { MENU } from "@/lib/permission-codes";
import { useMenuById, useMenuList, useSaveMenuOrder, useUpsertMenu } from "@/lib/api/master/menus.hooks";
import { isMenuUpsertSuccess, type MenuItem, type MenuUpsertRequest } from "@/lib/api/master/menus";
import {
  buildChildrenMap,
  effectiveOrder,
  flattenTree,
  nextSortOrder,
  parentKeyOf,
  reorderSiblings,
  subtreeIds,
  type OrderDraft,
  type ParentKey,
} from "@/lib/menu-tree";
import MenuFormDialog, { type MenuFormValues, type ParentOption } from "./components/MenuFormDialog";

// All actions on this page use the Role menu's permission: managing menus is part of
// Role & Permission, and a separate code would need its own DB row before anyone could open it.
const PERM_CODE = MENU.MASTER_DATA_ROLE;

type DialogState =
  | { mode: "closed" }
  | { mode: "add"; parentId: ParentKey }
  | { mode: "edit"; menu: MenuItem };

const toUpsert = (m: MenuItem, sortOrder = m.sortOrder): MenuUpsertRequest => ({
  id: m.id,
  menuCode: m.menuCode,
  name: m.name,
  icon: m.icon || null,
  route: m.route || null,
  parentId: parentKeyOf(m),
  sortOrder,
  isActive: m.isActive !== false,
});

// ──────────────────────────────────────────────
// One row (+ its children when expanded)
// ──────────────────────────────────────────────
interface TreeCtx {
  childrenMap: Map<ParentKey, MenuItem[]>;
  draft: OrderDraft;
  collapsed: Set<number>;
  canEdit: boolean;
  canCreate: boolean;
  dragEnabled: boolean;
  visibleIds: Set<number> | null; // null = no search filter
  matchIds: Set<number> | null;
  toggleCollapse: (id: number) => void;
  onReorder: (parent: ParentKey, orderedIds: number[]) => void;
  onEdit: (m: MenuItem) => void;
  onAddChild: (parent: number) => void;
}

function MenuRow({ menu, depth, ctx }: { menu: MenuItem; depth: number; ctx: TreeCtx }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.id,
    disabled: !ctx.dragEnabled,
  });

  const children = (ctx.childrenMap.get(menu.id) ?? []).filter((c) => !ctx.visibleIds || ctx.visibleIds.has(c.id));
  const hasChildren = children.length > 0;
  const isCollapsed = ctx.collapsed.has(menu.id) && !ctx.visibleIds; // search always expands
  const order = effectiveOrder(menu, ctx.draft);
  const dirty = ctx.draft[menu.id] !== undefined;
  const inactive = menu.isActive === false;
  const isMatch = ctx.matchIds?.has(menu.id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 rounded-md bg-background shadow-lg ring-1 ring-primary/40" : ""}
    >
      <div
        className={`grid grid-cols-[28px_minmax(220px,1fr)_minmax(160px,1fr)_88px_76px_72px] items-center gap-2 border-b border-border/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted/20 ${
          depth === 0 ? "bg-muted/10" : ""
        } ${dirty ? "bg-warning/5" : ""}`}
      >
        {/* Drag handle */}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={!ctx.dragEnabled}
          title={ctx.dragEnabled ? "Drag to reorder" : ctx.canEdit ? "Clear the search to reorder" : "No edit permission"}
          className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground ${
            ctx.dragEnabled ? "cursor-grab hover:bg-muted active:cursor-grabbing" : "cursor-not-allowed opacity-30"
          }`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Name */}
        <div className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => ctx.toggleCollapse(menu.id)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          {menu.icon ? (
            <Icon icon={menu.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span
            className={`truncate ${depth === 0 ? "font-semibold" : ""} ${inactive ? "text-muted-foreground line-through" : ""} ${
              isMatch ? "rounded bg-primary/10 px-1" : ""
            }`}
            title={menu.name}
          >
            {menu.name}
          </span>
          {hasChildren && (
            <span className="shrink-0 text-[10px] text-muted-foreground">({children.length})</span>
          )}
        </div>

        {/* Route */}
        <span className="truncate font-mono text-xs text-muted-foreground" title={menu.route ?? ""}>
          {menu.route || "—"}
        </span>

        {/* Sort order */}
        <span
          className={`mx-auto rounded px-2 py-0.5 text-center font-mono text-xs ${
            dirty ? "bg-warning/15 font-semibold text-warning ring-1 ring-warning/40" : "text-muted-foreground"
          }`}
          title={dirty ? `Saved: ${menu.sortOrder}` : undefined}
        >
          {order}
        </span>

        {/* Status */}
        <div>
          {inactive ? (
            <Badge color="secondary" className="text-[10px]">Inactive</Badge>
          ) : (
            <Badge color="success" className="text-[10px]">Active</Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5">
          {ctx.canCreate && (
            <button
              type="button"
              onClick={() => ctx.onAddChild(menu.id)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted"
              title="Add child menu"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {ctx.canEdit && (
            <button
              type="button"
              onClick={() => ctx.onEdit(menu)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {hasChildren && !isCollapsed && <SiblingList parent={menu.id} depth={depth + 1} items={children} ctx={ctx} />}
    </div>
  );
}

// ──────────────────────────────────────────────
// One sibling group — its own DndContext so a drag only reorders within the same parent
// ──────────────────────────────────────────────
function SiblingList({
  parent,
  depth,
  items,
  ctx,
}: {
  parent: ParentKey;
  depth: number;
  items: MenuItem[];
  ctx: TreeCtx;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map((m) => m.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(Number(active.id));
    const to = ids.indexOf(Number(over.id));
    if (from < 0 || to < 0) return;
    ctx.onReorder(parent, arrayMove(ids, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div>
          {items.map((m) => (
            <MenuRow key={m.id} menu={m} depth={depth} ctx={ctx} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const PermissionMenuPage = () => {
  const perm = useMenuPermission(PERM_CODE);
  // Sidebar order and names come from the user's permission data — refresh it after saving
  const refreshPermissions = useRefreshPermissions();

  const { data, isLoading, error, refetch, isFetching } = useMenuList();
  const upsertMutation = useUpsertMenu();
  const saveOrderMutation = useSaveMenuOrder();

  const [draft, setDraft] = useState<OrderDraft>({});
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const editId = dialog.mode === "edit" ? dialog.menu.id : 0;
  const { data: detailData, isLoading: isLoadingDetail } = useMenuById(editId, dialog.mode === "edit");

  const menus = useMemo(() => (data?.responseData ?? []).filter((m) => m.isdelete !== true), [data]);
  const byId = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);
  const childrenMap = useMemo(() => buildChildrenMap(menus, draft), [menus, draft]);
  // Saved order (no draft) — used for the parent picker and sortOrder suggestions
  const savedChildrenMap = useMemo(() => buildChildrenMap(menus, {}), [menus]);

  // Drop draft entries for rows that disappeared after a refetch
  useEffect(() => {
    setDraft((prev) => {
      const next: OrderDraft = {};
      let changed = false;
      for (const [k, v] of Object.entries(prev)) {
        const m = byId.get(Number(k));
        if (m && m.sortOrder !== v) next[m.id] = v;
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [byId]);

  const dirtyIds = useMemo(() => Object.keys(draft).map(Number), [draft]);
  const hasChanges = dirtyIds.length > 0;

  // ─── Search: show matches and their ancestors ───
  const q = search.trim().toLowerCase();
  const { visibleIds, matchIds } = useMemo(() => {
    if (!q) return { visibleIds: null, matchIds: null };
    const match = new Set<number>();
    const visible = new Set<number>();
    for (const m of menus) {
      const hit =
        m.name?.toLowerCase().includes(q) ||
        m.menuCode?.toLowerCase().includes(q) ||
        m.route?.toLowerCase().includes(q);
      if (!hit) continue;
      match.add(m.id);
      let cur: MenuItem | undefined = m;
      const guard = new Set<number>();
      while (cur && !guard.has(cur.id)) {
        guard.add(cur.id);
        visible.add(cur.id);
        const p = parentKeyOf(cur);
        cur = p === null ? undefined : byId.get(p);
      }
    }
    return { visibleIds: visible, matchIds: match };
  }, [q, menus, byId]);

  const rootItems = (childrenMap.get(null) ?? []).filter((m) => !visibleIds || visibleIds.has(m.id));

  // ─── Tree actions ───
  const toggleCollapse = useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () =>
    setCollapsed(new Set(menus.filter((m) => (childrenMap.get(m.id)?.length ?? 0) > 0).map((m) => m.id)));

  const onReorder = useCallback(
    (parent: ParentKey, orderedIds: number[]) => {
      if (!perm.canEdit) return;
      setDraft((prev) => reorderSiblings(childrenMap.get(parent) ?? [], orderedIds, prev, childrenMap));
    },
    [childrenMap, perm.canEdit]
  );

  const openAdd = (parentId: ParentKey) => {
    if (!perm.canCreate) return;
    setDialog({ mode: "add", parentId });
  };
  const openEdit = (menu: MenuItem) => {
    if (!perm.canEdit) return;
    setDialog({ mode: "edit", menu });
  };
  const closeDialog = () => setDialog({ mode: "closed" });

  // ─── Save order ───
  const handleSaveOrder = () => {
    if (!perm.canEdit || !hasChanges) return;
    const rows = dirtyIds
      .map((id) => byId.get(id))
      .filter((m): m is MenuItem => !!m)
      .map((m) => toUpsert(m, draft[m.id]));

    saveOrderMutation.mutate(rows, {
      onSuccess: ({ saved, failed }) => {
        // Keep only the rows that failed so the user can retry them
        setDraft((prev) => {
          const next: OrderDraft = {};
          for (const f of failed) if (prev[f.id] !== undefined) next[f.id] = prev[f.id];
          return next;
        });
        if (saved > 0) refreshPermissions();
        if (failed.length === 0) toast.success(`Sort order saved (${saved} menu${saved === 1 ? "" : "s"})`);
        else
          toast.error(
            `Saved ${saved}, failed ${failed.length}: ${failed.map((f) => f.name).join(", ")}. Click Save Order to retry.`
          );
      },
      onError: (err) => toast.error(err.message || "Failed to save sort order"),
    });
  };

  // ─── Add / Edit submit ───
  const editMenu = dialog.mode === "edit" ? detailData?.responseData ?? dialog.menu : null;

  const handleSubmit = (values: MenuFormValues) => {
    const isEdit = dialog.mode === "edit";
    if (isEdit ? !perm.canEdit : !perm.canCreate) return;
    const body: MenuUpsertRequest = {
      id: isEdit && editMenu ? editMenu.id : 0,
      menuCode: values.menuCode,
      name: values.name,
      icon: values.icon || null,
      route: values.route || null,
      parentId: values.parentId && values.parentId > 0 ? values.parentId : null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    };
    upsertMutation.mutate(body, {
      onSuccess: (res) => {
        if (isMenuUpsertSuccess(res)) {
          toast.success(isEdit ? "Menu updated successfully" : "Menu created successfully");
          refreshPermissions();
          // The form value wins over any unsaved drag for this row
          if (isEdit && editMenu)
            setDraft((prev) => {
              const next = { ...prev };
              delete next[editMenu.id];
              return next;
            });
          closeDialog();
        } else {
          toast.error(res?.error || "Failed to save menu");
        }
      },
      onError: (err) => toast.error(err.message || "Failed to save menu"),
    });
  };

  // Parent picker: every menu except the one being edited and its descendants
  const parentOptions: ParentOption[] = useMemo(() => {
    const excluded = editMenu ? subtreeIds(savedChildrenMap, editMenu.id) : new Set<number>();
    return flattenTree(savedChildrenMap)
      .filter(({ menu }) => !excluded.has(menu.id))
      .map(({ menu, depth }) => ({ id: menu.id, depth, name: menu.name, code: menu.menuCode }));
  }, [savedChildrenMap, editMenu]);

  const otherCodes = useMemo(
    () =>
      menus
        .filter((m) => !editMenu || m.id !== editMenu.id)
        .map((m) => m.menuCode?.trim().toUpperCase())
        .filter(Boolean),
    [menus, editMenu]
  );

  const suggestSortOrder = useCallback((parent: ParentKey) => nextSortOrder(savedChildrenMap, parent), [savedChildrenMap]);

  const handleRefresh = () => {
    if (hasChanges) setConfirmDiscard(true);
    else refetch();
  };

  const ctx: TreeCtx = {
    childrenMap,
    draft,
    collapsed,
    canEdit: perm.canEdit,
    canCreate: perm.canCreate,
    dragEnabled: perm.canEdit && !q && !saveOrderMutation.isPending,
    visibleIds,
    matchIds,
    toggleCollapse,
    onReorder,
    onEdit: openEdit,
    onAddChild: openAdd,
  };

  const activeCount = menus.filter((m) => m.isActive !== false).length;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Back to Role & Permission">
            <Link href="/master-data/role">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Permission Menus</h1>
            <p className="text-sm text-muted-foreground">
              Manage the menus used for role permissions. Drag rows to change the order — sub menus move with their parent. The sidebar follows this order after saving.
            </p>
          </div>
        </div>
        <PermissionActionGuard menuCode={PERM_CODE} action="canCreate">
          <Button size="sm" onClick={() => openAdd(null)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Menu
          </Button>
        </PermissionActionGuard>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Menus</CardTitle>
            <Badge color="secondary" className="text-xs">
              {activeCount} active / {menus.length}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu or route"
                className="h-8 w-64 pl-8 pr-7 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={expandAll} title="Expand all">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={collapseAll} title="Collapse all">
              <ChevronsDownUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        {/* Unsaved order bar */}
        {hasChanges && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-warning/10 px-4 py-2 text-sm">
            <span>
              <span className="font-semibold">{dirtyIds.length}</span> menu{dirtyIds.length === 1 ? "" : "s"} with unsaved
              sort order
            </span>
            <PermissionActionGuard menuCode={PERM_CODE} action="canEdit">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setDraft({})}
                  disabled={saveOrderMutation.isPending}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset
                </Button>
                <Button size="sm" className="h-8" onClick={handleSaveOrder} disabled={saveOrderMutation.isPending}>
                  {saveOrderMutation.isPending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-3.5 w-3.5" />
                  )}
                  {saveOrderMutation.isPending ? "Saving..." : "Save Order"}
                </Button>
              </div>
            </PermissionActionGuard>
          </div>
        )}

        <CardContent className="min-h-0 flex-1 overflow-auto p-0">
          <div className="min-w-[760px]">
            {/* Column headers */}
            <div className="sticky top-0 z-20 grid grid-cols-[28px_minmax(220px,1fr)_minmax(160px,1fr)_88px_76px_72px] items-center gap-2 border-b bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
              <span />
              <span>Menu</span>
              <span>Route</span>
              <span className="text-center">Sort Order</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {error ? (
              <div className="p-6 text-center text-sm text-destructive">
                {(error as Error).message || "Failed to load menus."}{" "}
                <button className="underline" onClick={() => refetch()}>
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : rootItems.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {q ? "No menus match your search." : "No menus found."}
              </div>
            ) : (
              <SiblingList parent={null} depth={0} items={rootItems} ctx={ctx} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialog.mode !== "closed"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent size="md" className="md:max-w-[860px]">
          {dialog.mode !== "closed" && (
            <MenuFormDialog
              key={dialog.mode === "edit" ? `edit-${dialog.menu.id}` : `add-${dialog.parentId ?? "root"}`}
              mode={dialog.mode}
              menu={editMenu}
              initialParentId={dialog.mode === "add" ? dialog.parentId : null}
              isLoading={dialog.mode === "edit" && isLoadingDetail}
              isPending={upsertMutation.isPending}
              parentOptions={parentOptions}
              otherCodes={otherCodes}
              suggestSortOrder={suggestSortOrder}
              onClose={closeDialog}
              onSubmit={handleSubmit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Discard unsaved order before refresh */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved sort order?</AlertDialogTitle>
            <AlertDialogDescription>
              {dirtyIds.length} menu{dirtyIds.length === 1 ? " has" : "s have"} a sort order that is not saved yet.
              Refreshing will discard these changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDraft({});
                setConfirmDiscard(false);
                refetch();
              }}
            >
              Discard &amp; Refresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PermissionMenuPage;
