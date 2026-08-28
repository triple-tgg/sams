"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, RotateCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import {
  useAircraftFamilyCodes,
  useUpsertAircraftFamilyCode,
  useDeleteAircraftFamilyCode,
} from "@/lib/api/master/aircraft-family/aircraft-family.hooks";
import type { AircraftFamilyCode } from "@/lib/api/master/aircraft-family/aircraft-family";
import { AE_MENU, UpdatedMeta, th } from "./shared";

interface FormState {
  id?: number;
  code: string;
  name: string;
  description: string;
}

const emptyForm: FormState = { code: "", name: "", description: "" };

export function AircraftFamilyTab() {
  const { data: families = [], isFetching } = useAircraftFamilyCodes();
  const upsert = useUpsertAircraftFamilyCode();
  const del = useDeleteAircraftFamilyCode();

  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AircraftFamilyCode | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return families.filter((f: AircraftFamilyCode) =>
      `${f.code} ${f.name}`.toLowerCase().includes(q),
    );
  }, [families, search]);

  const openAdd = () => { setForm(emptyForm); setModalMode("add"); };
  const openEdit = (f: AircraftFamilyCode) => {
    setForm({ id: f.id, code: f.code, name: f.name, description: (f as any).description ?? "" });
    setModalMode("edit");
  };
  const closeModal = () => { setModalMode("closed"); setForm(emptyForm); };

  const isDuplicate = modalMode === "add" && families.some(
    (f: AircraftFamilyCode) => f.code.toUpperCase() === (form.code ?? "").trim().toUpperCase(),
  ) && (form.code ?? "").trim().length > 0;

  const canSave = !!(form.code ?? "").trim() && !isDuplicate;

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        id: form.id,
        code: (form.code ?? "").trim().toUpperCase(),
        name: (form.name ?? "").trim() || (form.code ?? "").trim().toUpperCase(),
        description: (form.description ?? "").trim(),
      });
      toast.success(modalMode === "add" ? "Added family successfully" : "Updated family successfully");
      closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (e instanceof Error ? e.message : "An error occurred"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      toast.success("Deleted family successfully");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (e instanceof Error ? e.message : "An error occurred"));
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search family code, name..." className="h-9 pl-9 text-sm" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
        <PermissionActionGuard menuCode={AE_MENU} action="canCreate">
          <Button onClick={openAdd} className="ml-auto gap-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900">
            <Plus className="h-4 w-4" /> Add Family
          </Button>
        </PermissionActionGuard>
      </div>

      {/* Table */}
      <div className={cn("overflow-hidden rounded-xl border border-border bg-white transition-opacity", isFetching && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-slate-50">
                <th className={th}>Family Code</th>
                <th className={th}>Family Name</th>
                <th className={th}>Description</th>
                <th className={th}>Updated</th>
                <th className={cn(th, "text-center")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f: AircraftFamilyCode, i: number) => (
                <tr key={f.id} className={cn("border-b border-border/50 hover:bg-blue-50/50", i % 2 && "bg-slate-50/50")}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{f.code}</td>
                  <td className="px-3 py-2.5 text-slate-600">{f.name || <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-slate-500">{f.description || <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5"><UpdatedMeta by={f.updatedBy ?? f.createdBy} atUtc={f.updatedDate ?? f.createdDate} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
                        <button onClick={() => openEdit(f)} className="rounded-md p-1.5 text-muted-foreground hover:bg-blue-100 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                      <PermissionActionGuard menuCode={AE_MENU} action="canDelete">
                        <button onClick={() => setDeleteTarget(f)} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isFetching && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalMode !== "closed"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-[420px] bg-white">
          <DialogTitle className="text-base font-bold text-slate-800">
            {modalMode === "add" ? "Add Aircraft Family" : "Edit Aircraft Family"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Define an aircraft family code used across combinations.
          </DialogDescription>

          <div className="space-y-4 py-1">
            <div>
              <Label className="text-xs font-medium text-slate-600">Family Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. A320, B737"
                className={cn("mt-1 h-9 text-sm uppercase", isDuplicate && "border-red-400 focus-visible:ring-red-400")}
                disabled={modalMode === "edit"}
              />
              {isDuplicate && (
                <p className="mt-1 text-xs text-red-500">Family Code "{(form.code ?? "").trim().toUpperCase()}" already exists</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Family Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Airbus A320 Family"
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Airbus A320 family description"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closeModal} className="h-9 text-sm">Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || upsert.isPending} className="h-9 gap-2 bg-slate-800 text-sm text-white hover:bg-slate-900">
              {upsert.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-white text-center">
          <DialogTitle className="sr-only">Confirm Delete</DialogTitle>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
          <h3 className="text-base font-bold text-slate-800">Confirm Delete</h3>
          <p className="text-sm text-muted-foreground">Delete <b>{deleteTarget?.code}</b>? This cannot be undone.</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={del.isPending} className="gap-2 bg-red-600 text-white hover:bg-red-700">
              {del.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
