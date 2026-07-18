"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ShieldCheck, AlertTriangle } from "lucide-react";
import type { DataQualityCategory, DataQualityFinding } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

const TAG_STYLE: Record<DataQualityCategory, string> = {
  ORPHAN: "bg-amber-400 text-amber-950",
  MISSING_CONFIG: "bg-orange-400 text-orange-950",
  NAMING: "bg-rose-400 text-rose-950",
  STALE_GROUP: "bg-red-500 text-white",
};

const TAG_LABEL: Record<DataQualityCategory, string> = {
  ORPHAN: "ORPHAN",
  MISSING_CONFIG: "MISSING",
  NAMING: "NAMING",
  STALE_GROUP: "GROUP",
};

export function DataQualityBanner({ findings }: { findings: DataQualityFinding[] }) {
  const [open, setOpen] = useState(false);

  // Any `red` finding (CR-1: a group stuck below `complete` past the 3-day SLA)
  // escalates the whole banner from amber to red.
  const hasRed = findings.some((f) => f.severity === "red");

  if (findings.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-800">All data is consistent — no discrepancies found</span>
      </div>
    );
  }

  const shell = hasRed
    ? { border: "border-red-300", bg: "bg-red-50", icon: "text-red-600", title: "text-red-900", hint: "text-red-700", item: "border-red-200" }
    : { border: "border-amber-300", bg: "bg-amber-50", icon: "text-amber-600", title: "text-amber-900", hint: "text-amber-700", item: "border-amber-200" };

  return (
    <div className={cn("rounded-xl border", shell.border, shell.bg)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <AlertTriangle className={cn("h-4 w-4 shrink-0", shell.icon)} />
        <b className={cn("text-sm", shell.title)}>
          {findings.length} inconsistent data records found
          {hasRed && " — action overdue"}
        </b>
        <span className={cn("ml-auto flex items-center gap-1 text-xs", shell.hint)}>
          Click for details
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {findings.map((f) => (
            <div
              key={f.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border bg-white/70 px-3 py-2",
                f.severity === "red" ? "border-red-300" : "border-amber-200",
              )}
            >
              <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5  text-[10px] font-semibold", TAG_STYLE[f.category])}>
                {TAG_LABEL[f.category]}
              </span>
              <div className="text-[12.5px] leading-snug text-slate-800">
                {f.message}
                {f.suggestion && (
                  <span className="text-amber-700"> — might refer to <b className="">{f.suggestion}</b></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
