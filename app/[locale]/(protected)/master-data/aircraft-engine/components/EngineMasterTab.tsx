"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, RotateCw, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import {
  useCombinations, useEngines, useUpsertEngine, useDeleteEngine,
} from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import { checkEngineReferences } from "@/lib/api/master/aircraft-engine/aircraftEngine.validation";
import type { EngineMaster } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";
import { AE_MENU, UpdatedMeta, th } from "./shared";

interface FormState {
  engineCode: string;
  engineName: string;
  manufacturer: string;
  notes: string;
}

const emptyForm: FormState = { engineCode: "", engineName: "", manufacturer: "", notes: "" };

export function EngineMasterTab() {
  const { data: engines = [], isFetching } = useEngines();
  const { data: combinations = [] } = useCombinations();
  const upsert = useUpsertEngine();
  const del = useDeleteEngine();

  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<EngineMaster | null>(null);
  const [blockInfo, setBlockInfo] = useState<{ label: string; references: string[] } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return engines.filter((e: EngineMaster) => `${e.engineCode} ${e.engineName} ${e.manufacturer} ${e.notes}`.toLowerCase().includes(q));
  }, [engines, search]);

  const openAdd = () => { setForm(emptyForm); setModalMode("add"); };
  const openEdit = (e: EngineMaster) => {
    setForm({ engineCode: e.engineCode, engineName: e.engineName, manufacturer: e.manufacturer, notes: e.notes });
    setModalMode("edit");
  };
  const closeModal = () => { setModalMode("closed"); setForm(emptyForm); };

  const canSave = !!form.engineCode.trim() && !!form.engineName.trim();

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        engineCode: form.engineCode.trim().toUpperCase(),
        engineName: form.engineName.trim(),
        manufacturer: form.manufacturer.trim(),
        notes: form.notes.trim(),
      });
      toast.success(modalMode === "add" ? "Added engine successfully" : "Updated engine successfully");
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error && error.message === "DUPLICATE" ? "This engine code already exists" : error instanceof Error ? error.message : "An error occurred");
    }
  };

  const requestDelete = (e: EngineMaster) => {
    const ref = checkEngineReferences(e.engineCode, combinations);
    if (ref.blocked) setBlockInfo({ label: e.engineName, references: ref.references });
    else setDeleteTarget(e);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.engineCode);
      toast.success("Deleted engine successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error && error.message === "REFERENCED" ? "This engine is still referenced and cannot be deleted" : error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search engine name, manufacturer..." className="h-9 pl-9 text-sm" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items · controlled vocabulary</span>
        <PermissionActionGuard menuCode={AE_MENU} action="canCreate">
          <Button onClick={openAdd} className="ml-auto gap-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900">
            <Plus className="h-4 w-4" /> Add engine
          </Button>
        </PermissionActionGuard>
      </div>

      <div className={cn("overflow-hidden rounded-xl border border-border bg-white transition-opacity", isFetching && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-slate-50">
                <th className={th}>Engine code</th>
                <th className={th}>Engine name</th>
                <th className={th}>Manufacturer</th>
                <th className={th}>Typically used on</th>
                <th className={th}>Updated</th>
                <th className={cn(th, "text-center")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: EngineMaster, i: number) => (
                <tr key={e.engineCode} className={cn("border-b border-border/50 hover:bg-blue-50/50", i % 2 && "bg-slate-50/50")}>
                  <td className="px-3 py-2.5  font-semibold text-slate-800">{e.engineCode}</td>
                  <td className="px-3 py-2.5  text-slate-700">{e.engineName}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.manufacturer}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{e.notes}</td>
                  <td className="px-3 py-2.5"><UpdatedMeta by={e.updatedBy} atUtc={e.updatedAtUtc} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
                        <button onClick={() => openEdit(e)} className="rounded-md p-1.5 text-muted-foreground hover:bg-blue-100 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                      <PermissionActionGuard menuCode={AE_MENU} action="canDelete">
                        <button onClick={() => requestDelete(e)} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isFetching && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit */}
      <Dialog open={modalMode !== "closed"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-[440px] bg-white">
          <DialogTitle className="text-base font-bold text-slate-800">
            {modalMode === "add" ? "Add Engine" : `Edit ${form.engineCode}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This is a controlled vocabulary used by dropdowns in all tabs.
          </DialogDescription>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Engine code *</Label>
                <Input value={form.engineCode} disabled={modalMode === "edit"} onChange={(e) => setForm((f) => ({ ...f, engineCode: e.target.value }))} placeholder="e.g. LEAP1A" className="mt-1 h-9  text-sm disabled:opacity-60" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Engine name *</Label>
                <Input value={form.engineName} onChange={(e) => setForm((f) => ({ ...f, engineName: e.target.value }))} placeholder="e.g. CFM LEAP-1A" className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Manufacturer</Label>
              <Input value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. CFM International" className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Notes / typically used on</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. A320neo family" className="mt-1 text-sm" rows={2} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closeModal} className="h-9 text-sm">Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || upsert.isPending} className="h-9 gap-2 bg-slate-800 text-sm text-white hover:bg-slate-900">
              {upsert.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-white text-center">
          <DialogTitle className="sr-only">Confirm Delete</DialogTitle>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><Trash2 className="h-6 w-6 text-red-500" /></div>
          <h3 className="text-base font-bold text-slate-800">Confirm Delete</h3>
          <p className="text-sm text-muted-foreground">Delete engine <b className="">{deleteTarget?.engineName}</b>?</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={del.isPending} className="gap-2 bg-red-600 text-white hover:bg-red-700">
              {del.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Soft-block */}
      <Dialog open={!!blockInfo} onOpenChange={(o) => !o && setBlockInfo(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Ban className="h-5 w-5 text-amber-500" /> Cannot Delete
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <b className="">{blockInfo?.label}</b> is still used in {blockInfo?.references.length} combinations. Change or delete these items first:
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs">
            {blockInfo?.references.map((r, i) => <li key={i} className=" text-slate-600">• {r}</li>)}
          </ul>
          <div className="flex justify-end pt-1"><Button size="sm" onClick={() => setBlockInfo(null)}>Understood</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
