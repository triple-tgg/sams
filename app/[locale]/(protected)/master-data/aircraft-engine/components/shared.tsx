"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { cn } from "@/lib/utils";
import { dateTimeUtils } from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";
import type { CompletenessStatus, ReviewStatus } from "@/lib/api/master/aircraft-engine/aircraftEngine.types";

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Bangkok";

/** Menu code for permission gating across every tab. */
export const AE_MENU = "MASTER_DATA_AIRCRAFT_ENGINE";

/**
 * UTC / LOCAL clock pill, mirroring the SAMS header design.
 * UTC is the single source of truth; local is derived for display.
 */
export function TimePill() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const utcStr = now ? dayjs(now).utc().format("HH:mm:ss") : "--:--:--";
  const localStr = now ? dayjs(now).tz(APP_TZ).format("HH:mm:ss") : "--:--:--";

  return (
    <div className="hidden sm:flex items-center gap-4 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5  text-xs text-slate-300">
      <span>
        UTC <b className="text-white font-medium">{utcStr}</b>
      </span>
      <span className="text-slate-600">|</span>
      <span>
        LOCAL <span className="text-slate-500">({APP_TZ.split("/")[1] ?? APP_TZ})</span>{" "}
        <b className="text-white font-medium">{localStr}</b>
      </span>
    </div>
  );
}

/** Render a UTC ISO timestamp in the viewer's local time. */
export function formatLocal(utcIso: string | undefined): string {
  if (!utcIso) return "—";
  return dateTimeUtils.fromApiFormat(utcIso, "YYYY-MM-DD HH:mm");
}

/** "updated_by · local time" meta cell used across tables. */
export function UpdatedMeta({ by, atUtc }: { by?: string; atUtc?: string }) {
  return (
    <div className="text-[11px] leading-tight text-muted-foreground">
      <div className="">{formatLocal(atUtc)}</div>
      {by && <div className="text-slate-400">{by}</div>}
    </div>
  );
}

const REVIEW_META: Record<ReviewStatus, { label: string; color: "secondary" | "warning" | "success" }> = {
  DRAFT: { label: "Draft", color: "secondary" },
  IN_REVIEW: { label: "In review", color: "warning" },
  PUBLISHED: { label: "Published", color: "success" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const m = REVIEW_META[status];
  return (
    <Badge color={m.color} rounded="full" className=" text-[10px] normal-case">
      {m.label}
    </Badge>
  );
}

// Auto-computed completeness (CR-1) — independent of the manual review workflow.
// draft = grey, incomplete = amber, complete = green.
const COMPLETENESS_META: Record<CompletenessStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border border-slate-200" },
  incomplete: { label: "Incomplete", className: "bg-amber-100 text-amber-800 border border-amber-200" },
  complete: { label: "Complete", className: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
};

export function CompletenessStatusBadge({ status }: { status: CompletenessStatus }) {
  const m = COMPLETENESS_META[status];
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", m.className)}>
      {m.label}
    </span>
  );
}

/** Small monospace chip for engine names / codes. */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block rounded-full bg-slate-100 px-2 py-0.5  text-[11px] text-slate-600", className)}>
      {children}
    </span>
  );
}

/** Uppercase column header cell for the shared table style. */
export const th = "px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider";
