"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Users, Send, CheckCircle2, XCircle, RotateCw, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import { useMenuPermission } from "@/hooks/use-menu-permission";
import {
  useAuthGroups, useCombinations, useSaveAuthGroupDraft, useTransitionAuthGroup,
} from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import { useAirlinesList } from "@/lib/api/hooks/useAirlinesList";
import type { AuthorizationTypeGroup, AircraftEngineCombination } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";
import { AE_MENU, Chip, CompletenessStatusBadge, ReviewStatusBadge, UpdatedMeta, th } from "./shared";

const GLOBAL_SCOPE = "__global__";

interface EditorState {
  groupId: string;
  isNew: boolean;
  label: string;
  memberIds: Set<number>;
  /** CR-2: null = global default; a value = override for that airline. */
  customerId: number | null;
}

export function AuthGroupsTab() {
  const { data: groups = [], isFetching } = useAuthGroups();
  const { data: combinations = [] } = useCombinations();
  const { data: airlinesResp } = useAirlinesList({ page: 1, perPage: 100 });
  const saveDraft = useSaveAuthGroupDraft();
  const transition = useTransitionAuthGroup();
  const perms = useMenuPermission(AE_MENU);
  const canPublish = perms.canDelete; // approver authority ≈ canDelete (see docs)

  const airlines = airlinesResp?.responseData ?? [];
  const airlineName = (id: number | null) =>
    id == null ? null : airlines.find((a) => a.id === id)?.name || airlines.find((a) => a.id === id)?.code || `#${id}`;

  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter((g: AuthorizationTypeGroup) => {
      // CR-4: read the precomputed roll-up, never join the junction live.
      const engineText = g.engineListCached.join(" ");
      return `${g.groupLabel} ${engineText}`.toLowerCase().includes(q);
    });
  }, [groups, search]);

  const openCreate = () => { setMemberSearch(""); setEditor({ groupId: "", isNew: true, label: "", memberIds: new Set(), customerId: null }); };
  const openEdit = (g: AuthorizationTypeGroup) => {
    setMemberSearch("");
    setEditor({ groupId: g.groupId, isNew: false, label: g.groupLabel, memberIds: new Set(g.memberCombinationIds), customerId: g.customerId });
  };

  const toggleMember = (id: number) =>
    setEditor((s) => {
      if (!s) return s;
      const next = new Set(s.memberIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...s, memberIds: next };
    });

  const handleSaveDraft = async () => {
    if (!editor || !editor.groupId.trim() || !editor.label.trim()) return;
    try {
      await saveDraft.mutateAsync({
        groupId: editor.groupId.trim().toUpperCase(),
        groupLabel: editor.label.trim(),
        memberCombinationIds: Array.from(editor.memberIds),
        customerId: editor.customerId,
      });
      toast.success("Saved as Draft — must Submit → Publish to affect CRS");
      setEditor(null);
    } catch (error) {
      toast.error(error instanceof Error && error.message === "DUPLICATE" ? "This Group ID already exists" : error instanceof Error ? error.message : "An error occurred");
    }
  };

  const doTransition = async (groupId: string, action: "SUBMIT" | "PUBLISH" | "REJECT") => {
    try {
      await transition.mutateAsync({ groupId, action });
      toast.success(action === "SUBMIT" ? "Submitted for review" : action === "PUBLISH" ? "Published — affects CRS scope" : "Reverted to Draft");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Group combinations by family for the member picker.
  const groupedCombos = useMemo(() => {
    const q = memberSearch.toLowerCase();
    const byFamily = new Map<string, typeof combinations>();
    for (const c of combinations) {
      if (q && !c.displayLabel.toLowerCase().includes(q)) continue;
      const arr = byFamily.get(c.familyCode) ?? [];
      arr.push(c);
      byFamily.set(c.familyCode, arr);
    }
    return Array.from(byFamily.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [combinations, memberSearch]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search authorization group..." className="h-9 pl-9 text-sm" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} items · engines roll-up from combinations</span>
        <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
          <Button onClick={openCreate} className="ml-auto gap-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900">
            <Plus className="h-4 w-4" /> Add group
          </Button>
        </PermissionActionGuard>
      </div>

      {/* CR-1: only complete groups are selectable downstream */}
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-emerald-500" />
        เฉพาะ status <b className="font-semibold text-emerald-700">complete</b> เท่านั้นที่เลือกใช้ออก FM-CM-063 ได้
        (ต้อง Published ด้วย)
      </p>

      {/* Table */}
      <div className={cn("overflow-hidden rounded-xl border border-border bg-white transition-opacity", isFetching && "opacity-60")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-slate-50">
                <th className={th}>Authorization group</th>
                <th className={th}>Scope</th>
                <th className={th}>Engines (rolled up)</th>
                <th className={th}>Members</th>
                <th className={th}>Status</th>
                <th className={th}>Review status</th>
                <th className={th}>Updated</th>
                <th className={cn(th, "text-center")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g: AuthorizationTypeGroup, i: number) => {
                const rolled = g.engineListCached; // CR-4: precomputed cache
                return (
                  <tr key={g.groupId} className={cn("border-b border-border/50 align-top hover:bg-blue-50/50", i % 2 && "bg-slate-50/50")}>
                    <td className="px-3 py-2.5">
                      <div className=" font-semibold text-slate-800">{g.groupLabel}</div>
                      <div className="text-[10px] text-slate-400">{g.groupId}</div>
                      {g.legacyEngineLabels && g.legacyEngineLabels.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
                          <Info className="h-3 w-3" /> legacy: {g.legacyEngineLabels.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {g.customerId == null ? (
                        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Global</span>
                      ) : (
                        <span className="inline-block rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{airlineName(g.customerId)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex max-w-md flex-wrap gap-1">
                        {rolled.length ? rolled.map((e) => <Chip key={e}>{e}</Chip>) : <span className="text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5  text-slate-600">{g.memberCombinationIds.length}</td>
                    <td className="px-3 py-2.5">
                      <CompletenessStatusBadge status={g.completenessStatus} />
                    </td>
                    <td className="px-3 py-2.5">
                      <ReviewStatusBadge status={g.reviewStatus} />
                      {g.reviewStatus === "IN_REVIEW" && g.submittedBy && (
                        <div className="mt-1 text-[10px] text-slate-400">by {g.submittedBy}</div>
                      )}
                      {g.reviewStatus === "PUBLISHED" && g.publishedBy && (
                        <div className="mt-1 text-[10px] text-slate-400">by {g.publishedBy}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><UpdatedMeta by={g.updatedBy} atUtc={g.updatedAtUtc} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-stretch gap-1">
                        <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
                          <Button variant="outline" size="sm" onClick={() => openEdit(g)} className="h-7 justify-start gap-1.5 text-xs">
                            <Users className="h-3.5 w-3.5" /> Manage members
                          </Button>
                        </PermissionActionGuard>
                        {g.reviewStatus === "DRAFT" && (
                          <PermissionActionGuard menuCode={AE_MENU} action="canEdit">
                            <Button size="sm" onClick={() => doTransition(g.groupId, "SUBMIT")} disabled={transition.isPending} className="h-7 justify-start gap-1.5 bg-amber-500 text-xs text-white hover:bg-amber-600">
                              <Send className="h-3.5 w-3.5" /> Submit for review
                            </Button>
                          </PermissionActionGuard>
                        )}
                        {g.reviewStatus === "IN_REVIEW" && canPublish && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => doTransition(g.groupId, "PUBLISH")} disabled={transition.isPending} className="h-7 flex-1 justify-center gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => doTransition(g.groupId, "REJECT")} disabled={transition.isPending} className="h-7 flex-1 justify-center gap-1 text-xs text-red-600 hover:bg-red-50">
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                        {g.reviewStatus === "IN_REVIEW" && !canPublish && (
                          <span className="px-1 text-[10px] text-slate-400">Waiting for publisher</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !isFetching && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group editor (label + members) */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="flex max-h-[85vh] max-w-[560px] flex-col bg-white">
          <DialogTitle className="text-base font-bold text-slate-800">
            {editor?.isNew ? "Add Authorization group" : "Manage group members"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select combinations to include/exclude from the group — engine list will roll-up automatically. Saving will create a Draft.
          </DialogDescription>

          {editor && (
            <>
              <div>
                <Label className="text-xs font-medium text-slate-600">Group ID *</Label>
                <Input
                  value={editor.groupId}
                  disabled={!editor.isNew}
                  onChange={(e) => setEditor({ ...editor, groupId: e.target.value.toUpperCase() })}
                  placeholder="e.g. AG-737NG"
                  className="mt-1 h-9 text-sm disabled:opacity-60"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">Group label *</Label>
                <Input value={editor.label} onChange={(e) => setEditor({ ...editor, label: e.target.value })} placeholder="e.g. A320 family" className="mt-1 h-9 text-sm" />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600">Scope</Label>
                <Select
                  value={editor.customerId == null ? GLOBAL_SCOPE : String(editor.customerId)}
                  onValueChange={(v) => setEditor({ ...editor, customerId: v === GLOBAL_SCOPE ? null : Number(v) })}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GLOBAL_SCOPE}>Global (all airlines)</SelectItem>
                    {airlines.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name || a.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Global = ใช้ร่วมทุก airline · เลือก airline = override เฉพาะรายนั้น (fallback ไป Global เมื่อไม่มี)
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search combination..." className="h-9 pl-9 text-sm" />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Selected {editor.memberIds.size} combinations</span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
                {groupedCombos.map(([family, combos]) => (
                  <div key={family}>
                    <div className="mb-1  text-[11px] font-semibold uppercase tracking-wider text-slate-400">{family}</div>
                    <div className="space-y-0.5">
                      {combos.map((c: AircraftEngineCombination) => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-slate-50">
                          <Checkbox checked={editor.memberIds.has(c.id)} onCheckedChange={() => toggleMember(c.id)} />
                          <span className=" text-xs text-slate-700">{c.displayLabel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedCombos.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No combination found</p>}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditor(null)} className="h-9 text-sm">Cancel</Button>
                <Button onClick={handleSaveDraft} disabled={!editor.groupId.trim() || !editor.label.trim() || saveDraft.isPending} className="h-9 gap-2 bg-slate-800 text-sm text-white hover:bg-slate-900">
                  {saveDraft.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />} Save as Draft
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
