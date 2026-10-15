"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, RotateCw, AlertTriangle, Check, Minus, ChevronsUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import {
  useAircraftTypes,
  useUpsertAircraftType,
  useDeleteAircraftType,
} from "@/lib/api/master/aircraft-types/aircraft-types.hooks";
import { fetchAircraftTypeById, type AircraftType } from "@/lib/api/master/aircraft-types/aircraft-types";
import { AE_MENU, UpdatedMeta, th } from "./shared";

// ── Form ─────────────────────────────────────────────────────────

interface FormState {
  id?: number;
  code: string;
  name: string;
  modelName: string;
  modelSubName: string;
  classicOrNeo: string;
  familyCode: string;
  flagEnging1: boolean;
  flagEnging2: boolean;
  flagEnging3: boolean;
  flagEnging4: boolean;
  flagCsd1: boolean;
  flagCsd2: boolean;
  flagCsd3: boolean;
  flagCsd4: boolean;
  flagHydrolicGreen: boolean;
  flagHydrolicBlue: boolean;
  flagHydrolicYellow: boolean;
  flagApu: boolean;
  colorForeground: string;
  colorBackground: string;
}

const DEFAULT_COLOR_FOREGROUND = "#FFFFFF";
const DEFAULT_COLOR_BACKGROUND = "#1F2937";
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

type FormGroupKey = "engine" | "csd" | "hydraulic" | "apu" | "color";

/** Only the first group is expanded when the modal opens. */
const initialOpenGroups: Record<FormGroupKey, boolean> = {
  engine: true, csd: false, hydraulic: false, apu: false, color: false,
};

const emptyForm: FormState = {
  code: "", name: "", modelName: "", modelSubName: "", classicOrNeo: "CLASSIC", familyCode: "",
  flagEnging1: true, flagEnging2: true, flagEnging3: false, flagEnging4: false,
  flagCsd1: true, flagCsd2: true, flagCsd3: false, flagCsd4: false,
  flagHydrolicGreen: true, flagHydrolicBlue: true, flagHydrolicYellow: true,
  flagApu: true,
  colorForeground: DEFAULT_COLOR_FOREGROUND,
  colorBackground: DEFAULT_COLOR_BACKGROUND,
};

// ── Helpers ──────────────────────────────────────────────────────

const FlagIcon = ({ value }: { value: boolean }) =>
  value
    ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/80 text-white/80 "><Check className="h-3 w-3" /></span>
    : <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Minus className="h-3 w-3" /></span>;

/** ICAO chip rendered with the configured text/background colors */
const ColorChip = ({ label, fg, bg }: { label: string; fg: string; bg: string }) => (
  <span
    className="inline-flex min-w-[48px] items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm"
    style={{ color: fg, backgroundColor: bg }}
  >
    {label || "ICAO"}
  </span>
);

/** Color picker + hex input pair */
const ColorField = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label htmlFor={id} className="text-xs font-medium text-slate-600">{label}</Label>
    <div className="mt-1 flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={HEX_COLOR_RE.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-white p-0.5"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={7}
        placeholder="#RRGGBB"
        className={cn("h-9 text-sm font-mono uppercase", !HEX_COLOR_RE.test(value) && "border-red-400 focus-visible:ring-red-400")}
      />
    </div>
  </div>
);

/** Sample label shown in the COLOR column */
const COLOR_SAMPLE_TEXT = "Text";

/** Static "Text" chip — dashed outline when no color is configured yet */
const ColorTextChip = ({ fg, bg, isSet, interactive }: { fg: string; bg: string; isSet: boolean; interactive?: boolean }) =>
  isSet ? (
    <span
      className={cn(
        "inline-flex min-w-[48px] items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm",
        interactive && "transition-transform group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/30",
      )}
      style={{ color: fg, backgroundColor: bg }}
    >
      {COLOR_SAMPLE_TEXT}
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex min-w-[48px] items-center justify-center rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-400",
        interactive && "transition-colors group-hover:border-primary/50 group-hover:text-primary",
      )}
    >
      {COLOR_SAMPLE_TEXT}
    </span>
  );

/** Click-to-edit color chip for a table row — saves through the upsert API */
const ColorQuickEdit = ({
  record, saving, onSave,
}: {
  record: AircraftType;
  saving: boolean;
  onSave: (fg: string, bg: string) => Promise<boolean>;
}) => {
  const isSet = !!(record.colorForeground || record.colorBackground);
  const currentFg = record.colorForeground || DEFAULT_COLOR_FOREGROUND;
  const currentBg = record.colorBackground || DEFAULT_COLOR_BACKGROUND;
  const [open, setOpen] = useState(false);
  const [fg, setFg] = useState(currentFg);
  const [bg, setBg] = useState(currentBg);

  const handleOpenChange = (o: boolean) => {
    if (saving) return;
    if (o) { setFg(currentFg); setBg(currentBg); }
    setOpen(o);
  };

  const valid = HEX_COLOR_RE.test(fg) && HEX_COLOR_RE.test(bg);
  const changed = fg !== currentFg || bg !== currentBg || !isSet;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="group rounded-md p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" title="Click to update color">
          <ColorTextChip fg={currentFg} bg={currentBg} isSet={isSet} interactive />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Color · {record.code}</span>
          <ColorTextChip fg={HEX_COLOR_RE.test(fg) ? fg : currentFg} bg={HEX_COLOR_RE.test(bg) ? bg : currentBg} isSet />
        </div>
        <ColorField id={`qc-fg-${record.id}`} label="Text color" value={fg} onChange={setFg} />
        <ColorField id={`qc-bg-${record.id}`} label="Background color" value={bg} onChange={setBg} />
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-[11px] font-medium text-slate-500 hover:text-primary"
            onClick={() => { setFg(DEFAULT_COLOR_FOREGROUND); setBg(DEFAULT_COLOR_BACKGROUND); }}
            disabled={saving}
          >
            Reset default
          </button>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-xs"
              disabled={!valid || !changed || saving}
              onClick={async () => { if (await onSave(fg, bg)) setOpen(false); }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Collapsible form group with a title and a compact summary shown in the header */
const FormGroup = ({
  title, summary, open, onOpenChange, children,
}: {
  title: string;
  summary?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => (
  <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border border-border">
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50",
          open && "rounded-b-none border-b border-border bg-slate-50/70",
        )}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</span>
        <span className="flex items-center gap-2">
          {summary != null && <span className="text-[11px] font-medium text-slate-500">{summary}</span>}
          <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform duration-200", open && "rotate-180")} />
        </span>
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent className="overflow-hidden">
      <div className="p-3">{children}</div>
    </CollapsibleContent>
  </Collapsible>
);

// ── Grouped header styles ────────────────────────────────────────

const groupHeaderClass = "px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-white bg-slate-700 border-x border-slate-600";
const subHeaderClass = "px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-slate-100 border-x border-border/50";
const subCellClass = "px-2 py-2 text-center border-x border-border/30";

// Sticky column styles (left-pinned on horizontal scroll)
const stickyBase = "sticky z-10";
const sticky0 = cn(stickyBase, "left-0");           // Family
const sticky1 = cn(stickyBase, "left-[80px]");       // Model
const sticky2 = cn(stickyBase, "left-[220px]");      // Type
const sticky3 = cn(stickyBase, "left-[310px]");      // ICAO
const stickyHeadBg = "bg-slate-50";
const stickyBodyBg = "bg-white";
const stickyBodyAltBg = "bg-slate-50";

// ── Component ────────────────────────────────────────────────────

export function SystemConfigTab() {
  const { data: configs = [], isFetching } = useAircraftTypes();
  const upsert = useUpsertAircraftType();
  const del = useDeleteAircraftType();

  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"closed" | "add" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AircraftType | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<FormGroupKey, boolean>>(initialOpenGroups);
  const toggleGroup = (key: FormGroupKey) => (open: boolean) => setOpenGroups((g) => ({ ...g, [key]: open }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return configs.filter((c: AircraftType) =>
      `${c.code} ${c.modelName} ${c.modelSubName} ${c.classicOrNeo} ${c.familyCode ?? ""}`.toLowerCase().includes(q),
    );
  }, [configs, search]);

  const uniqueFamilies = useMemo(() => Array.from(new Set(configs.map((c: AircraftType) => c.familyCode).filter(Boolean))) as string[], [configs]);
  const uniqueModels = useMemo(() => Array.from(new Set(configs.map((c: AircraftType) => c.modelName).filter(Boolean))) as string[], [configs]);
  const uniqueSubModels = useMemo(() => Array.from(new Set(configs.map((c: AircraftType) => c.modelSubName).filter(Boolean))) as string[], [configs]);

  const openAdd = () => { setForm(emptyForm); setOpenGroups(initialOpenGroups); setModalMode("add"); };
  const toFormState = (c: AircraftType): FormState => ({
    id: c.id,
    code: c.code ?? "", name: c.name ?? "",
    modelName: c.modelName ?? "", modelSubName: c.modelSubName ?? "",
    classicOrNeo: c.classicOrNeo ?? "CLASSIC", familyCode: c.familyCode ?? "",
    flagEnging1: c.flagEnging1, flagEnging2: c.flagEnging2,
    flagEnging3: c.flagEnging3, flagEnging4: c.flagEnging4,
    flagCsd1: c.flagCsd1, flagCsd2: c.flagCsd2,
    flagCsd3: c.flagCsd3, flagCsd4: c.flagCsd4,
    flagHydrolicGreen: c.flagHydrolicGreen, flagHydrolicBlue: c.flagHydrolicBlue,
    flagHydrolicYellow: c.flagHydrolicYellow,
    flagApu: c.flagApu,
    colorForeground: c.colorForeground || DEFAULT_COLOR_FOREGROUND,
    colorBackground: c.colorBackground || DEFAULT_COLOR_BACKGROUND,
  });
  const [loadingDetail, setLoadingDetail] = useState(false);
  const openEdit = async (c: AircraftType) => {
    setOpenGroups(initialOpenGroups);
    // Show row data immediately, then refresh from GET /master/aircraftTypes/byid/{id}
    setForm(toFormState(c));
    setModalMode("edit");
    setLoadingDetail(true);
    try {
      const detail = await fetchAircraftTypeById(c.id);
      // Only apply if the user is still editing the same record
      setForm((prev) => (prev.id === c.id ? toFormState(detail) : prev));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (e instanceof Error ? e.message : "Failed to load aircraft type"));
    } finally {
      setLoadingDetail(false);
    }
  };
  const closeModal = () => { setModalMode("closed"); setForm(emptyForm); };

  const isDuplicateIcao = false;

  const isColorValid = HEX_COLOR_RE.test(form.colorForeground) && HEX_COLOR_RE.test(form.colorBackground);
  const canSave = !loadingDetail && !!(form.code ?? "").trim() && !!(form.modelName ?? "").trim() && !!(form.familyCode ?? "").trim() && isColorValid;

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        id: form.id,
        code: (form.code ?? "").trim().toUpperCase(),
        name: (form.name ?? "").trim() || (form.code ?? "").trim().toUpperCase(),
        modelName: (form.modelName ?? "").trim(),
        modelSubName: (form.modelSubName ?? "").trim(),
        classicOrNeo: form.classicOrNeo,
        familyCode: form.familyCode || null,
        flagEnging1: form.flagEnging1, flagEnging2: form.flagEnging2,
        flagEnging3: form.flagEnging3, flagEnging4: form.flagEnging4,
        flagCsd1: form.flagCsd1, flagCsd2: form.flagCsd2,
        flagCsd3: form.flagCsd3, flagCsd4: form.flagCsd4,
        flagHydrolicGreen: form.flagHydrolicGreen, flagHydrolicBlue: form.flagHydrolicBlue,
        flagHydrolicYellow: form.flagHydrolicYellow,
        flagApu: form.flagApu,
        colorForeground: form.colorForeground,
        colorBackground: form.colorBackground,
      });
      toast.success(modalMode === "add" ? "Added successfully" : "Updated successfully");
      closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (e instanceof Error ? e.message : "An error occurred"));
    }
  };

  const [colorSavingId, setColorSavingId] = useState<number | null>(null);
  /** Inline COLOR column update — re-sends the full record with only the colors changed. */
  const handleQuickColorSave = async (c: AircraftType, fg: string, bg: string): Promise<boolean> => {
    setColorSavingId(c.id);
    try {
      await upsert.mutateAsync({
        id: c.id,
        code: c.code ?? "",
        name: c.name ?? "",
        modelName: c.modelName ?? "",
        modelSubName: c.modelSubName ?? "",
        classicOrNeo: c.classicOrNeo ?? "",
        familyCode: c.familyCode ?? "",
        colorForeground: fg,
        colorBackground: bg,
        flagEnging1: c.flagEnging1, flagEnging2: c.flagEnging2,
        flagEnging3: c.flagEnging3, flagEnging4: c.flagEnging4,
        flagCsd1: c.flagCsd1, flagCsd2: c.flagCsd2,
        flagCsd3: c.flagCsd3, flagCsd4: c.flagCsd4,
        flagHydrolicGreen: c.flagHydrolicGreen, flagHydrolicBlue: c.flagHydrolicBlue,
        flagHydrolicYellow: c.flagHydrolicYellow,
        flagApu: c.flagApu,
      });
      toast.success(`Color updated for ${c.code}`);
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (e instanceof Error ? e.message : "An error occurred"));
      return false;
    } finally {
      setColorSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      toast.success("Deleted successfully");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || (e instanceof Error ? e.message : "An error occurred"));
    }
  };

  const totalCols = 18;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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

      {/* Table */}
      <div className={cn("overflow-hidden rounded-xl border border-border bg-white transition-opacity", isFetching && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {/* Row 1: Group headers */}
              <tr className="border-b border-border">
                <th rowSpan={2} className={cn(th, sticky0, stickyHeadBg, "z-20 min-w-[80px]")}>Family</th>
                <th rowSpan={2} className={cn(th, sticky1, stickyHeadBg, "z-20 min-w-[140px]")}>Model</th>
                <th rowSpan={2} className={cn(th, sticky2, stickyHeadBg, "z-20 min-w-[90px]")}>Type</th>
                <th rowSpan={2} className={cn(th, sticky3, stickyHeadBg, "z-20 min-w-[70px] border-r border-border")}>ICAO</th>
                <th colSpan={4} className={groupHeaderClass}>ENG (Engine)</th>
                <th colSpan={4} className={groupHeaderClass}>GEN (CSD)</th>
                <th colSpan={3} className={groupHeaderClass}>HYD (Hydraulic)</th>
                <th rowSpan={2} className={cn(th, groupHeaderClass, "text-center")}>APU</th>
                <th rowSpan={2} className={cn(th, groupHeaderClass, "text-center")}>Color</th>
                <th rowSpan={2} className={cn(th, groupHeaderClass)}>Updated</th>
                <th rowSpan={2} className={cn(th, "text-center", groupHeaderClass)}>Action</th>
              </tr>
              {/* Row 2: Sub-column headers */}
              <tr className="border-b-2 border-border">
                <th className={subHeaderClass}>Engine 1</th>
                <th className={subHeaderClass}>Engine 2</th>
                <th className={subHeaderClass}>Engine 3</th>
                <th className={subHeaderClass}>Engine 4</th>
                <th className={subHeaderClass}>CSD 1</th>
                <th className={subHeaderClass}>CSD 2</th>
                <th className={subHeaderClass}>CSD 3</th>
                <th className={subHeaderClass}>CSD 4</th>
                <th className={subHeaderClass}>GREEN/A/LH</th>
                <th className={subHeaderClass}>BLUE/CENTER</th>
                <th className={subHeaderClass}>YELLOW/B/2RH</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: AircraftType, i: number) => (
                <tr key={c.id} className={cn("border-b border-border/50 hover:bg-blue-50/50", i % 2 && "bg-slate-50/50")}>
                  <td className={cn("px-3 py-2.5 font-semibold text-slate-800 min-w-[80px]", sticky0, i % 2 ? stickyBodyAltBg : stickyBodyBg)}>{c.modelName}</td>
                  <td className={cn("px-3 py-2.5 text-slate-700 min-w-[140px]", sticky1, i % 2 ? stickyBodyAltBg : stickyBodyBg)}>{c.modelSubName || <span className="text-slate-300">—</span>}</td>
                  <td className={cn("px-3 py-2.5 min-w-[90px]", sticky2, i % 2 ? stickyBodyAltBg : stickyBodyBg)}>
                    {c.classicOrNeo ? (
                      <Badge color={c.classicOrNeo === "NEO" ? "primary" : "secondary"} className="text-[10px]">{c.classicOrNeo}</Badge>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={cn("px-3 py-2.5 text-slate-700 min-w-[70px] border-r border-border", sticky3, i % 2 ? stickyBodyAltBg : stickyBodyBg)}>{c.code}</td>
                  {/* Engine flags */}
                  <td className={subCellClass}><FlagIcon value={c.flagEnging1} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagEnging2} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagEnging3} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagEnging4} /></td>
                  {/* CSD flags */}
                  <td className={subCellClass}><FlagIcon value={c.flagCsd1} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagCsd2} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagCsd3} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagCsd4} /></td>
                  {/* Hydraulic flags */}
                  <td className={subCellClass}><FlagIcon value={c.flagHydrolicGreen} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagHydrolicBlue} /></td>
                  <td className={subCellClass}><FlagIcon value={c.flagHydrolicYellow} /></td>
                  {/* APU */}
                  <td className="px-3 py-2.5 text-center"><FlagIcon value={c.flagApu} /></td>
                  {/* Color — "Text" sample, click to update */}
                  <td className="px-3 py-2.5 text-center">
                    <PermissionActionGuard
                      menuCode={AE_MENU}
                      action="canEdit"
                      fallback={
                        <ColorTextChip
                          fg={c.colorForeground || DEFAULT_COLOR_FOREGROUND}
                          bg={c.colorBackground || DEFAULT_COLOR_BACKGROUND}
                          isSet={!!(c.colorForeground || c.colorBackground)}
                        />
                      }
                    >
                      <ColorQuickEdit
                        record={c}
                        saving={colorSavingId === c.id}
                        onSave={(fg, bg) => handleQuickColorSave(c, fg, bg)}
                      />
                    </PermissionActionGuard>
                  </td>
                  <td className="px-3 py-2.5"><UpdatedMeta by={c.updatedBy ?? c.createdBy} atUtc={c.updatedDate ?? c.createdDate} /></td>
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
                <tr><td colSpan={totalCols} className="px-4 py-12 text-center text-sm text-muted-foreground">No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalMode !== "closed"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="flex max-h-[90vh] max-w-[640px] flex-col gap-0 overflow-hidden bg-white p-0">
          {/* Header (fixed) */}
          <div className="shrink-0 border-b border-border px-6 pb-3 pt-5 pr-12">
            <DialogTitle className="text-base font-bold text-slate-800">
              {modalMode === "add" ? "Add Aircraft system config" : `Edit ${form.code}`}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">Tied to ICAO code — 1 row per variant</DialogDescription>
          </div>

          <datalist id="familyCode-list">
            {uniqueFamilies.map((fam) => <option key={fam} value={fam} />)}
          </datalist>
          <datalist id="modelName-list">
            {uniqueModels.map((mod) => <option key={mod} value={mod} />)}
          </datalist>
          <datalist id="modelSubName-list">
            {uniqueSubModels.map((sub) => <option key={sub} value={sub} />)}
          </datalist>

          {/* Body (scrollable) */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">ICAO code *</Label>
                <Input value={form.code} disabled={modalMode === "edit"} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value, name: e.target.value }))} placeholder="e.g. A20N" className="mt-1 h-9 text-sm uppercase disabled:opacity-60" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Aircraft family / Model Name *</Label>
                <Input list="familyCode-list" value={form.familyCode} onChange={(e) => setForm((f) => ({ ...f, familyCode: e.target.value.toUpperCase(), modelName: e.target.value.toUpperCase() }))} placeholder="e.g. A320" className="mt-1 h-9 text-sm uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">Model Sub Name</Label>
                <Input list="modelSubName-list" value={form.modelSubName} onChange={(e) => setForm((f) => ({ ...f, modelSubName: e.target.value }))} placeholder="e.g. A320neo" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Classic / NEO</Label>
                <Select value={form.classicOrNeo} onValueChange={(v) => setForm((f) => ({ ...f, classicOrNeo: v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASSIC">CLASSIC</SelectItem>
                    <SelectItem value="NEO">NEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Engine flags */}
            <FormGroup
              title="Engine"
              summary={`${[form.flagEnging1, form.flagEnging2, form.flagEnging3, form.flagEnging4].filter(Boolean).length}/4`}
              open={openGroups.engine}
              onOpenChange={toggleGroup("engine")}
            >
              <div className="grid grid-cols-2 gap-3">
                {(["flagEnging1", "flagEnging2", "flagEnging3", "flagEnging4"] as const).map((key, idx) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <Label className="text-xs text-slate-600">Engine {idx + 1}</Label>
                    <Switch checked={form[key]} onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* CSD flags */}
            <FormGroup
              title="CSD/IDG/VSFG (Generator)"
              summary={`${[form.flagCsd1, form.flagCsd2, form.flagCsd3, form.flagCsd4].filter(Boolean).length}/4`}
              open={openGroups.csd}
              onOpenChange={toggleGroup("csd")}
            >
              <div className="grid grid-cols-2 gap-3">
                {(["flagCsd1", "flagCsd2", "flagCsd3", "flagCsd4"] as const).map((key, idx) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <Label className="text-xs text-slate-600">#{idx + 1}</Label>
                    <Switch checked={form[key]} onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* Hydraulic flags */}
            <FormGroup
              title="Hydraulic"
              summary={`${[form.flagHydrolicGreen, form.flagHydrolicBlue, form.flagHydrolicYellow].filter(Boolean).length}/3`}
              open={openGroups.hydraulic}
              onOpenChange={toggleGroup("hydraulic")}
            >
              <div className="grid gap-3">
                {([
                  ["flagHydrolicGreen", "GREEN/A/LH"],
                  ["flagHydrolicBlue", "BLUE/CENTER"],
                  ["flagHydrolicYellow", "YELLOW/B/2RH"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
                    <Label className="text-xs text-slate-600">{label}</Label>
                    <Switch checked={form[key]} onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* APU */}
            <FormGroup
              title="APU"
              summary={form.flagApu ? "Yes" : "No"}
              open={openGroups.apu}
              onOpenChange={toggleGroup("apu")}
            >
              <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2.5">
                <Label className="text-sm font-medium text-slate-700">Has APU</Label>
                <Switch checked={form.flagApu} onCheckedChange={(v) => setForm((f) => ({ ...f, flagApu: v }))} />
              </div>
            </FormGroup>

            {/* Color */}
            <FormGroup
              title="Color"
              summary={isColorValid
                ? <ColorChip label={(form.code ?? "").trim().toUpperCase()} fg={form.colorForeground} bg={form.colorBackground} />
                : <span className="text-red-500">Invalid</span>}
              open={openGroups.color}
              onOpenChange={toggleGroup("color")}
            >
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  id="aircraft-color-foreground"
                  label="Text Color"
                  value={form.colorForeground}
                  onChange={(v) => setForm((f) => ({ ...f, colorForeground: v }))}
                />
                <ColorField
                  id="aircraft-color-background"
                  label="Background Color"
                  value={form.colorBackground}
                  onChange={(v) => setForm((f) => ({ ...f, colorBackground: v }))}
                />
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-slate-50 px-3 py-2.5">
                <span className="text-xs text-slate-500">Preview</span>
                {isColorValid ? (
                  <ColorChip label={(form.code ?? "").trim().toUpperCase()} fg={form.colorForeground} bg={form.colorBackground} />
                ) : (
                  <span className="text-xs text-red-500">Invalid hex color (use #RRGGBB)</span>
                )}
              </div>
            </FormGroup>
          </div>

          {/* Footer (fixed) */}
          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-white px-6 py-3">
            <Button variant="outline" onClick={closeModal} className="h-9 text-sm">Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || upsert.isPending} className="h-9 gap-2 bg-slate-800 text-sm text-white hover:bg-slate-900">
              {upsert.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />} Save
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
          <p className="text-sm text-muted-foreground">Delete <b>{deleteTarget?.code}</b> ({deleteTarget?.modelSubName})?</p>
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
