"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownUp, ImageOff, Loader2 } from "lucide-react";
import type { MenuItem } from "@/lib/api/master/menus";
import type { ParentKey } from "@/lib/menu-tree";
import IconPicker from "./IconPicker";

export interface MenuFormValues {
  menuCode: string;
  name: string;
  icon: string;
  route: string;
  parentId: ParentKey;
  sortOrder: number;
  isActive: boolean;
}

export interface ParentOption {
  id: number;
  name: string;
  code: string;
  depth: number;
}

const ROOT = "root";
const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

const normParent = (p: number | null | undefined): ParentKey => (p && p > 0 ? p : null);

export default function MenuFormDialog({
  mode,
  menu,
  initialParentId = null,
  isLoading = false,
  isPending,
  parentOptions,
  otherCodes,
  suggestSortOrder,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit";
  menu?: MenuItem | null;
  initialParentId?: ParentKey;
  isLoading?: boolean;
  isPending: boolean;
  /** Menus that can be chosen as parent (self and descendants already removed) */
  parentOptions: ParentOption[];
  /** Upper-cased codes of all other menus, for the duplicate check */
  otherCodes: string[];
  /** Next free sortOrder at the end of `parent`'s children */
  suggestSortOrder: (parent: ParentKey) => number;
  onClose: () => void;
  onSubmit: (values: MenuFormValues) => void;
}) {
  const [menuCode, setMenuCode] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [route, setRoute] = useState("");
  const [parentId, setParentId] = useState<ParentKey>(initialParentId);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fill the form once the record is available
  useEffect(() => {
    if (mode === "edit" && menu) {
      setMenuCode(menu.menuCode ?? "");
      setName(menu.name ?? "");
      setIcon(menu.icon ?? "");
      setRoute(menu.route ?? "");
      setParentId(normParent(menu.parentId));
      setIsActive(menu.isActive !== false);
    }
  }, [mode, menu]);

  // Sort order is not typed: it is kept when the parent stays the same, otherwise the
  // menu goes to the end of the new parent's list. Reorder by dragging in the list.
  const sameParent = mode === "edit" && !!menu && normParent(menu.parentId) === parentId;
  const sortOrder = sameParent && menu ? menu.sortOrder : suggestSortOrder(parentId);

  const codeSet = useMemo(() => new Set(otherCodes), [otherCodes]);
  const parentName = parentOptions.find((o) => o.id === parentId)?.name;

  const validate = (): MenuFormValues | null => {
    const e: Record<string, string> = {};
    const code = menuCode.trim().toUpperCase();
    if (!name.trim()) e.name = "Name is required";
    if (!code) e.menuCode = "Menu Code is required";
    else if (!CODE_PATTERN.test(code)) e.menuCode = "Use UPPER_SNAKE_CASE (A–Z, 0–9, _), starting with a letter";
    else if (codeSet.has(code)) e.menuCode = "This Menu Code is already used";
    const r = route.trim();
    if (r && !r.startsWith("/")) e.route = "Route must start with /";
    if (parentId !== null && !parentOptions.some((o) => o.id === parentId))
      e.parentId = "Choose a valid parent menu";
    setErrors(e);
    if (Object.keys(e).length) return null;
    return { menuCode: code, name: name.trim(), icon, route: r, parentId, sortOrder, isActive };
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const values = validate();
    if (values) onSubmit(values);
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-destructive">{errors[key]}</p> : null;

  const busy = isPending || isLoading;
  const title = mode === "add" ? "Add Menu" : "Edit Menu";
  const subtitle =
    mode === "add"
      ? parentName
        ? `New sub menu under ${parentName}`
        : "New top-level menu"
      : name || menu?.name || "";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-h-[85vh] flex-col">
      {/* Header with live preview */}
      <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon ? <Icon icon={icon} className="h-6 w-6" /> : <ImageOff className="h-5 w-5 opacity-50" />}
        </div>
        <div className="min-w-0 text-left">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="truncate">{subtitle}</DialogDescription>
        </div>
      </DialogHeader>

      {isLoading ? (
        <div className="grid gap-6 py-5 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto py-5 md:grid-cols-[1fr_320px]">
          {/* ── Left: details ── */}
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
              <div className="space-y-1">
                <Label htmlFor="menu-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="menu-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Role"
                  disabled={busy}
                  aria-invalid={!!errors.name}
                  autoFocus={mode === "add"}
                />
                {fieldError("name")}
              </div>
              <div className="space-y-1">
                <Label htmlFor="menu-code">
                  Menu Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="menu-code"
                  value={menuCode}
                  onChange={(e) => setMenuCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  placeholder="e.g. MASTER_DATA_ROLE"
                  className="font-mono"
                  disabled={busy}
                  aria-invalid={!!errors.menuCode}
                />
                {fieldError("menuCode") ?? (
                  <p className="text-xs text-muted-foreground">Must match the permission code used in the app.</p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Placement</h3>
              <div className="space-y-1">
                <Label>Parent Menu</Label>
                <Select
                  value={parentId === null ? ROOT : String(parentId)}
                  onValueChange={(v) => {
                    // Radix can emit "" (e.g. while items mount) — never turn that into parent 0
                    if (!v) return;
                    if (v === ROOT) return setParentId(null);
                    const id = Number(v);
                    if (Number.isInteger(id) && id > 0) setParentId(id);
                  }}
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Top level" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value={ROOT}>Top level</SelectItem>
                    {parentOptions.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        <span style={{ paddingLeft: `${o.depth * 14}px` }}>{o.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("parentId")}
                <p className="text-xs text-muted-foreground">
                  A parent is a group only — its permission comes from its sub menus.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="menu-route">Route</Label>
                <Input
                  id="menu-route"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  placeholder="e.g. /master-data/role"
                  className="font-mono"
                  disabled={busy}
                  aria-invalid={!!errors.route}
                />
                {fieldError("route")}
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <ArrowDownUp className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Sort Order <span className="font-mono font-semibold text-foreground">{sortOrder}</span>
                  {sameParent ? " — drag rows in the list to reorder" : " — added at the end of this group"}
                </span>
              </div>
            </section>
          </div>

          {/* ── Right: icon picker ── */}
          <section className="flex min-h-0 flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Icon</h3>
              <span className="truncate pl-2 text-xs text-muted-foreground">
                {icon ? icon.replace(/^[^:]+:/, "").replace(/-/g, " ") : "No icon"}
              </span>
            </div>
            <div className="h-[380px]">
              <IconPicker value={icon} onChange={setIcon} disabled={busy} />
            </div>
          </section>
        </div>
      )}

      <DialogFooter className="flex-row items-center border-t pt-4 sm:justify-between">
        <div className="mr-auto flex items-center gap-2">
          <Switch id="menu-active" checked={isActive} onCheckedChange={setIsActive} disabled={busy} />
          <Label htmlFor="menu-active" className="cursor-pointer">
            {isActive ? "Active" : "Inactive"}
          </Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Saving..." : mode === "add" ? "Create Menu" : "Save Changes"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
