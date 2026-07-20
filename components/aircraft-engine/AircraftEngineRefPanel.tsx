"use client";

// ──────────────────────────────────────────────────────────────
// CR-6 — shared, READ-ONLY reference panel for Aircraft & Engine master data.
//
// Other modules (M-03 Authorization, M-02 Course setup) embed this to SHOW the
// master data they depend on, without duplicating or letting it be edited inline.
// It reads the same hooks the master-data screen uses, so it always reflects the
// single source of truth (CR-4 cached roll-up included) and can never drift.
//
//  • context="authorization", refId = group_id  → group label, engine list,
//    completeness status, member series.
//  • context="training",      refId = icao_code → ICAO, Classic/NEO, engine /
//    generator / hydraulic counts, APU.
//
// Visual language deliberately differs from a normal card (light-blue wash,
// READ-ONLY chip, "sync from Master Data" footer) so it reads as reference data.
// The footer link adapts to the viewer's rights on MASTER_DATA_AIRCRAFT_ENGINE.
// ──────────────────────────────────────────────────────────────

import { ExternalLink, Lock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useMenuPermission } from "@/hooks/use-menu-permission";
import {
  useAuthGroups,
  useCombinations,
  useSystemConfigs,
} from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import type { CompletenessStatus } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

const AE_MENU = "MASTER_DATA_AIRCRAFT_ENGINE";

export type RefPanelContext = "authorization" | "training";

export interface AircraftEngineRefPanelProps {
  context: RefPanelContext;
  /** group_id for "authorization", icao_code for "training". */
  refId: string;
  className?: string;
  /** Hide the header when a parent supplies a collapsible trigger. */
  hideHeader?: boolean;
}

const AUTHORIZATION_COMPLETENESS: Record<CompletenessStatus, { label: string; className: string }> = {
  draft: { label: "ฉบับร่าง", className: "bg-slate-100 text-slate-600" },
  incomplete: { label: "ตรวจสอบ", className: "bg-amber-100 text-amber-800" },
  complete: { label: "สมบูรณ์", className: "bg-emerald-100 text-emerald-700" },
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-inset ring-blue-100">
      <div className="text-[10px] uppercase tracking-wider text-blue-500">{label}</div>
      <div className="text-sm font-semibold text-blue-900">{value}</div>
    </div>
  );
}

export function AircraftEngineRefPanel({ context, refId, className, hideHeader = false }: AircraftEngineRefPanelProps) {
  const perms = useMenuPermission(AE_MENU);
  const canEdit = perms.canEdit;

  const { data: groups = [] } = useAuthGroups();
  const { data: combinations = [] } = useCombinations();
  const { data: systemConfigs = [] } = useSystemConfigs();

  // Accept either a group_id or the group label (the latter lets a consumer pass
  // the aircraft-scope string it already has, e.g. M-03's aircraft selector).
  const group = context === "authorization" ? groups.find((g) => g.groupId === refId || g.groupLabel === refId) : undefined;
  const cfg = context === "training" ? systemConfigs.find((s) => s.icaoCode === refId) : undefined;

  const focusTab = context === "authorization" ? "group" : "sys";
  const deepLink = `/master-data/aircraft-engine?tab=${focusTab}&focus=${encodeURIComponent(refId)}`;

  if (context === "authorization") {
    const completeness = group ? AUTHORIZATION_COMPLETENESS[group.completenessStatus] : undefined;
    const memberCombinations = group
      ? combinations.filter((combination) => group.memberCombinationIds.includes(combination.id))
      : [];

    return (
      <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
        {!hideHeader && (
          <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/70 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
            <span className="min-w-0 truncate text-xs font-bold text-slate-800">
              Authorization type group — อ้างอิง
            </span>
            <span className="ml-auto shrink-0 rounded-md bg-slate-200/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
              Read-only
            </span>
          </div>
        )}

        {group ? (
          <div className="px-4 py-3">
            <dl className="divide-y divide-slate-100">
              <div className="flex items-start justify-between gap-4 py-2 first:pt-0">
                <dt className="text-xs text-slate-500">Group</dt>
                <dd className="text-right text-xs font-semibold text-slate-800">{group.groupLabel}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-xs text-slate-500">Engine ที่ครอบคลุม</dt>
                <dd className="text-right text-xs font-semibold text-slate-800">
                  {group.engineListCached.length ? group.engineListCached.join(", ") : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-xs text-slate-500">สถานะข้อมูล</dt>
                <dd>
                  {completeness && (
                    <span className={cn("inline-flex rounded-md px-2.5 py-1 text-[10px] font-semibold", completeness.className)}>
                      {completeness.label}
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="border-t border-slate-100 pt-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Series ที่อยู่ใน Group นี้
              </p>
              <div className="flex flex-wrap gap-1.5">
                {memberCombinations.length ? (
                  memberCombinations.map((combination) => {
                    const family = combination.familyCode.replace(/^B(?=\d)/, "");
                    const label = combination.series ? `${family}-${combination.series}` : family;
                    return (
                      <span
                        key={combination.id}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500"
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 text-xs text-slate-500">
            ไม่พบ Authorization group “{refId}”
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            sync จาก Master Data
          </span>
          <Link
            href={deepLink}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            {canEdit ? "แก้ไขที่ Master Data" : "ดู full master data"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-blue-200 bg-blue-50/70", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-blue-200/70 px-3.5 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Aircraft system config</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
          <Lock className="h-3 w-3" /> Read-only
        </span>
      </div>

      {/* Body */}
      <div className="space-y-3 px-3.5 py-3">
        {cfg ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-blue-950">{cfg.icaoCode}</span>
              <span className="text-[11px] text-blue-500">{cfg.modelVariant}</span>
              <span className="ml-auto inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                {cfg.classicNeo}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Engines" value={cfg.engineCount} />
              <Stat label="Generators" value={cfg.generatorCount} />
              <Stat label="Hydraulics" value={cfg.hydraulicCount} />
              <Stat label="APU" value={cfg.hasApu ? "Yes" : "No"} />
            </div>
          </>
        ) : (
          <p className="text-xs text-blue-400">ไม่พบ System config “{refId}”</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-blue-200/70 px-3.5 py-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500">
          <RefreshCw className="h-3 w-3" /> sync จาก Master Data
        </span>
        <Link
          href={deepLink}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900 hover:underline"
        >
          {canEdit ? "แก้ไขที่ Master Data" : "ดู full master data"}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default AircraftEngineRefPanel;
