"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, RotateCw, AlertTriangle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import {
  useCombinations, useEngines, useFamilies, useUpsertCombination, useDeleteCombination, useAddFamily,
  checkCombinationReferences,
} from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import { buildDisplayLabel } from "@/lib/api/master/aircraft-engine/aircraftEngine.mock";
import type { AircraftEngineCombination, EngineMaster, AircraftFamily } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";
import { AE_MENU, Chip, UpdatedMeta, th } from "./shared";

const NEW_FAMILY = "__new";

interface FormState {
  id?: number;
  familyCode: string;
  series: string;
  engineCode: string;
  newFamilyCode: string;
  newFamilyName: string;
}

const emptyForm: FormState = { familyCode: "", series: "", engineCode: "", newFamilyCode: "", newFamilyName: "" };

export function CombinationsTab() {
  const { data: combinations = [], isFetching } = useCombinations();
  const { data: engines = [] } = useEngines();
  const { data: families = [] } = useFamilies();
  const upsert = useUpsertCombination();
  const del = useDeleteCombination();
  const addFamily = useAddFamily();

  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AircraftEngineCombination | null>(null);
  const [blockInfo, setBlockInfo] = useState<{ label: string; references: string[] } | null>(null);

  const engineName = (code: string) => engines.find((e: EngineMaster) => e.engineCode === code)?.engineName ?? code;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return combinations.filter((c: AircraftEngineCombination) =>
      `${c.familyCode} ${c.series} ${engineName(c.engineCode)} ${c.displayLabel}`.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinations, engines, search]);

  const isNewFamily = form.familyCode === NEW_FAMILY;
  const previewLabel = (() => {
    const fam = isNewFamily ? form.newFamilyCode.trim() : form.familyCode;
    if (!fam || !form.engineCode) return "—";
    return buildDisplayLabel(fam, form.series.trim(), engineName(form.engineCode));
  })();

  const openAdd = () => { setForm(emptyForm); setModalMode("add"); };
  const openEdit = (c: AircraftEngineCombination) => {
    setForm({ id: c.id, familyCode: c.familyCode, series: c.series, engineCode: c.engineCode, newFamilyCode: "", newFamilyName: "" });
    setModalMode("edit");
  };
  const closeModal = () => { setModalMode("closed"); setForm(emptyForm); };

  const canSave =
    !!form.engineCode &&
    (isNewFamily ? !!form.newFamilyCode.trim() : !!form.familyCode);

  const handleSave = async () => {
    try {
      let familyCode = form.familyCode;
      if (isNewFamily) {
        familyCode = form.newFamilyCode.trim().toUpperCase();
        await addFamily.mutateAsync({ familyCode, familyName: form.newFamilyName.trim() || familyCode });
      }
      await upsert.mutateAsync({ id: form.id, familyCode, series: form.series.trim(), engineCode: form.engineCode });
      toast.success(modalMode === "add" ? "Added combination successfully" : "Updated combination successfully");
      closeModal();
    } catch (e) {
      toast.error(e instanceof Error && e.message === "DUPLICATE" ? "This Family code already exists" : "An error occurred");
    }
  };

  const requestDelete = (c: AircraftEngineCombination) => {
    const ref = checkCombinationReferences(c.id);
    if (ref.blocked) setBlockInfo({ label: c.displayLabel, references: ref.references });
    else setDeleteTarget(c);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      toast.success("Deleted combination successfully");
      setDeleteTarget(null);
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search aircraft model, engine..." className="h-9 pl-9 text-sm" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items · source of truth</span>
        <PermissionActionGuard menuCode={AE_MENU} action="canCreate">
          <Button onClick={openAdd} className="ml-auto gap-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </PermissionActionGuard>
      </div>

      {/* Table */}
      <div className={cn("overflow-hidden rounded-xl border border-border bg-white transition-opacity", isFetching && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-slate-50">
                <th className={th}>Family</th>
                <th className={th}>Series</th>
                <th className={th}>Engine</th>
                <th className={th}>Display label</th>
                <th className={th}>Updated</th>
                <th className={cn(th, "text-center")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: AircraftEngineCombination, i: number) => (
                <tr key={c.id} className={cn("border-b border-border/50 hover:bg-blue-50/50", i % 2 && "bg-slate-50/50")}>
                  <td className="px-3 py-2.5  font-semibold text-slate-800">{c.familyCode}</td>
                  <td className="px-3 py-2.5  text-slate-600">{c.series || <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5"><Chip>{engineName(c.engineCode)}</Chip></td>
                  <td className="px-3 py-2.5  text-slate-700">{c.displayLabel}</td>
                  <td className="px-3 py-2.5"><UpdatedMeta by={c.updatedBy} atUtc={c.updatedAtUtc} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
                        <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-blue-100 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                      <PermissionActionGuard menuCode={AE_MENU} action="canDelete">
                        <button onClick={() => requestDelete(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
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

      {/* Add / Edit modal */}
      <Dialog open={modalMode !== "closed"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-[460px] bg-white">
          <DialogTitle className="text-base font-bold text-slate-800">
            {modalMode === "add" ? "Add Aircraft-Engine combination" : "Edit combination"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            1 row = 1 Aircraft family + Series + Engine pair (Atomic level)
          </DialogDescription>

          <div className="space-y-4 py-1">
            <div>
              <Label className="text-xs font-medium text-slate-600">Aircraft family *</Label>
              <Select value={form.familyCode} onValueChange={(v) => setForm((f) => ({ ...f, familyCode: v }))}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select family" /></SelectTrigger>
                <SelectContent>
                  {families.map((fam: AircraftFamily) => (
                    <SelectItem key={fam.familyCode} value={fam.familyCode}>
                      {fam.familyCode} — {fam.familyName}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_FAMILY} className="font-medium text-blue-600">+ Add new family...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isNewFamily && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Family code *</Label>
                  <Input value={form.newFamilyCode} onChange={(e) => setForm((f) => ({ ...f, newFamilyCode: e.target.value }))} placeholder="e.g. A220" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Family name</Label>
                  <Input value={form.newFamilyName} onChange={(e) => setForm((f) => ({ ...f, newFamilyName: e.target.value }))} placeholder="e.g. Airbus A220" className="mt-1 h-9 text-sm" />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-medium text-slate-600">Series / variant</Label>
              <Input value={form.series} onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))} placeholder="e.g. 600, 8200, 300ER" className="mt-1 h-9 text-sm" />
              <p className="mt-1 text-[11px] text-muted-foreground">Can be empty if the family has no series, e.g. A318</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600">Engine *</Label>
              <Select value={form.engineCode} onValueChange={(v) => setForm((f) => ({ ...f, engineCode: v }))}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select engine" /></SelectTrigger>
                <SelectContent>
                  {engines.map((e: EngineMaster) => (
                    <SelectItem key={e.engineCode} value={e.engineCode}>{e.engineName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">Pulled from Engine master only, preventing mismatching engine names.</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600">Display label (auto-generated)</Label>
              <div className="mt-1 rounded-lg border border-dashed border-border bg-slate-50 px-3 py-2  text-sm text-slate-700">{previewLabel}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closeModal} className="h-9 text-sm">Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || upsert.isPending || addFamily.isPending} className="h-9 gap-2 bg-slate-800 text-sm text-white hover:bg-slate-900">
              {(upsert.isPending || addFamily.isPending) && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-white text-center">
          <DialogTitle className="sr-only">Confirm Delete</DialogTitle>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
          <h3 className="text-base font-bold text-slate-800">Confirm Delete</h3>
          <p className="text-sm text-muted-foreground">Delete <b className="">{deleteTarget?.displayLabel}</b>? This cannot be undone.</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={del.isPending} className="gap-2 bg-red-600 text-white hover:bg-red-700">
              {del.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Soft-block (referenced) */}
      <Dialog open={!!blockInfo} onOpenChange={(o) => !o && setBlockInfo(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Ban className="h-5 w-5 text-amber-500" /> Cannot Delete
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <b className="">{blockInfo?.label}</b> is still referenced. Please remove from the following items first:
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
