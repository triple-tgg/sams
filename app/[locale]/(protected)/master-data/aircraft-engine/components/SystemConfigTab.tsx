"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, RotateCw, AlertTriangle, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import {
  useSystemConfigs, useFamilies, useUpsertSystemConfig, useDeleteSystemConfig,
} from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import type { AircraftSystemConfig, ClassicNeo, AircraftFamily } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";
import { AE_MENU, UpdatedMeta, th } from "./shared";

interface FormState {
  icaoCode: string;
  familyCode: string;
  modelVariant: string;
  classicNeo: ClassicNeo;
  engineCount: number;
  generatorCount: number;
  hydraulicCount: number;
  hasApu: boolean;
}

const emptyForm: FormState = {
  icaoCode: "", familyCode: "", modelVariant: "", classicNeo: "CLASSIC",
  engineCount: 2, generatorCount: 2, hydraulicCount: 3, hasApu: true,
};

const CountField = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600">{label}</Label>
    <Input type="number" min={0} max={8} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className="mt-1 h-9 text-sm" />
  </div>
);

const YesNo = ({ value }: { value: boolean }) =>
  value
    ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-3 w-3" /></span>
    : <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Minus className="h-3 w-3" /></span>;

export function SystemConfigTab() {
  const { data: configs = [], isFetching } = useSystemConfigs();
  const { data: families = [] } = useFamilies();
  const upsert = useUpsertSystemConfig();
  const del = useDeleteSystemConfig();

  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AircraftSystemConfig | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return configs.filter((c: AircraftSystemConfig) => `${c.icaoCode} ${c.familyCode} ${c.modelVariant} ${c.classicNeo}`.toLowerCase().includes(q));
  }, [configs, search]);

  const openAdd = () => { setForm(emptyForm); setModalMode("add"); };
  const openEdit = (c: AircraftSystemConfig) => {
    setForm({
      icaoCode: c.icaoCode, familyCode: c.familyCode, modelVariant: c.modelVariant, classicNeo: c.classicNeo,
      engineCount: c.engineCount, generatorCount: c.generatorCount, hydraulicCount: c.hydraulicCount, hasApu: c.hasApu,
    });
    setModalMode("edit");
  };
  const closeModal = () => { setModalMode("closed"); setForm(emptyForm); };

  const canSave = !!form.icaoCode.trim() && !!form.familyCode && !!form.modelVariant.trim();

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({ ...form, icaoCode: form.icaoCode.trim().toUpperCase(), isNew: modalMode === "add" });
      toast.success(modalMode === "add" ? "Added system config successfully" : "Updated system config successfully");
      closeModal();
    } catch (e) {
      toast.error(e instanceof Error && e.message === "DUPLICATE" ? "This ICAO code already exists" : e instanceof Error ? e.message : "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.icaoCode);
      toast.success("Deleted system config successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ICAO code, model..." className="h-9 pl-9 text-sm" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items</span>
        <PermissionActionGuard menuCode={AE_MENU} action="canCreate">
          <Button onClick={openAdd} className="ml-auto gap-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </PermissionActionGuard>
      </div>

      <div className={cn("overflow-hidden rounded-xl border border-border bg-white transition-opacity", isFetching && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-slate-50">
                <th className={th}>Family</th>
                <th className={th}>Model</th>
                <th className={th}>Type</th>
                <th className={th}>ICAO</th>
                <th className={cn(th, "text-center")}>Eng</th>
                <th className={cn(th, "text-center")}>Gen</th>
                <th className={cn(th, "text-center")}>Hyd</th>
                <th className={cn(th, "text-center")}>APU</th>
                <th className={th}>Updated</th>
                <th className={cn(th, "text-center")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: AircraftSystemConfig, i: number) => (
                <tr key={c.icaoCode} className={cn("border-b border-border/50 hover:bg-blue-50/50", i % 2 && "bg-slate-50/50")}>
                  <td className="px-3 py-2.5  font-semibold text-slate-800">{c.familyCode}</td>
                  <td className="px-3 py-2.5 text-slate-700">{c.modelVariant}</td>
                  <td className="px-3 py-2.5">
                    <Badge color={c.classicNeo === "NEO" ? "info" : "secondary"} className=" text-[10px]">{c.classicNeo}</Badge>
                  </td>
                  <td className="px-3 py-2.5  text-slate-700">{c.icaoCode}</td>
                  <td className="px-3 py-2.5 text-center  text-slate-600">{c.engineCount}</td>
                  <td className="px-3 py-2.5 text-center  text-slate-600">{c.generatorCount}</td>
                  <td className="px-3 py-2.5 text-center  text-slate-600">{c.hydraulicCount}</td>
                  <td className="px-3 py-2.5 text-center"><YesNo value={c.hasApu} /></td>
                  <td className="px-3 py-2.5"><UpdatedMeta by={c.updatedBy} atUtc={c.updatedAtUtc} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
                        <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-blue-100 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                      <PermissionActionGuard menuCode={AE_MENU} action="canDelete">
                        <button onClick={() => setDeleteTarget(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </PermissionActionGuard>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isFetching && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit */}
      <Dialog open={modalMode !== "closed"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-[480px] bg-white">
          <DialogTitle className="text-base font-bold text-slate-800">
            {modalMode === "add" ? "Add Aircraft system config" : `Edit ${form.icaoCode}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">Tied to ICAO code — 1 row per variant</DialogDescription>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">ICAO code *</Label>
                <Input value={form.icaoCode} disabled={modalMode === "edit"} onChange={(e) => setForm((f) => ({ ...f, icaoCode: e.target.value }))} placeholder="e.g. A20N" className="mt-1 h-9  text-sm disabled:opacity-60" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Aircraft family *</Label>
                <Select value={form.familyCode} onValueChange={(v) => setForm((f) => ({ ...f, familyCode: v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {families.map((fam: AircraftFamily) => <SelectItem key={fam.familyCode} value={fam.familyCode}>{fam.familyCode}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Model variant *</Label>
                <Input value={form.modelVariant} onChange={(e) => setForm((f) => ({ ...f, modelVariant: e.target.value }))} placeholder="e.g. A320neo" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Classic / NEO</Label>
                <Select value={form.classicNeo} onValueChange={(v) => setForm((f) => ({ ...f, classicNeo: v as ClassicNeo }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASSIC">CLASSIC</SelectItem>
                    <SelectItem value="NEO">NEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CountField label="Engine count" value={form.engineCount} onChange={(n) => setForm((f) => ({ ...f, engineCount: n }))} />
              <CountField label="Generator count" value={form.generatorCount} onChange={(n) => setForm((f) => ({ ...f, generatorCount: n }))} />
              <CountField label="Hydraulic count" value={form.hydraulicCount} onChange={(n) => setForm((f) => ({ ...f, hydraulicCount: n }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2.5">
              <Label className="text-sm font-medium text-slate-700">Has APU</Label>
              <Switch checked={form.hasApu} onCheckedChange={(v) => setForm((f) => ({ ...f, hasApu: v }))} />
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
          <h3 className="text-base font-bold text-slate-800">Confirm Delete</h3>
          <p className="text-sm text-muted-foreground">Delete system config <b className="">{deleteTarget?.icaoCode}</b>?</p>
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
