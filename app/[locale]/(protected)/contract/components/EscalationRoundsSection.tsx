"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CustomDateInput } from "@/components/ui/input-date/CustomDateInput";
import { CalendarClock, CheckCircle2, Clock, HelpCircle, Lock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildEscalationSchedule,
  formatDMY,
  validateEscalationRounds,
  type EscalationRound,
  type ScheduleEntry,
} from "@/lib/utils/contractEscalation";
import type { ContractFormData } from "./types";

type Patch = Partial<Pick<ContractFormData, "isEscalationRescheduled" | "escalationRounds">>;

// CustomDateInput works with "DD/MM/YYYY"; the form keeps "YYYY-MM-DD"
const isoToSlash = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const slashToIso = (v: string) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
};

const SOURCE_LABEL = { regular: "Yearly", additional: "Additional round" } as const;

function StatusBadge({ entry, isNewContract }: { entry: ScheduleEntry; isNewContract: boolean }) {
  if (entry.isApplied === true)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Applied{entry.appliedDate ? ` · ${formatDMY(entry.appliedDate)}` : ""}
      </span>
    );
  if (entry.isApplied === false)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
        <Clock className="h-3 w-3" />
        Not applied yet
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <HelpCircle className="h-3 w-3" />
      {isNewContract ? "Not saved yet" : "No status from system"}
    </span>
  );
}

export function EscalationRoundsSection({
  formData,
  onChange,
  fieldErrors = {},
}: {
  formData: ContractFormData;
  onChange: (patch: Patch) => void;
  fieldErrors?: Record<string, string>;
}) {
  const rounds = formData.escalationRounds;
  const hasRegular = !!formData.escalationDate;
  const appliedCount = rounds.filter((r) => r.isApplied).length;
  const isNewContract = !formData.contractId;

  const schedule = useMemo(
    () =>
      buildEscalationSchedule({
        regularDate: formData.escalationDate,
        rounds: formData.isEscalationRescheduled ? rounds : rounds.filter((r) => r.isApplied),
        effectiveFrom: formData.effectiveFrom,
        expiresOn: formData.isNoExpiryDate ? null : formData.expiresOn,
        lastEscalationAppliedDate: formData.lastEscalationAppliedDate,
      }),
    [formData.escalationDate, formData.isEscalationRescheduled, rounds, formData.effectiveFrom,
      formData.expiresOn, formData.isNoExpiryDate, formData.lastEscalationAppliedDate]
  );

  const setRounds = (next: EscalationRound[]) => onChange({ escalationRounds: next });

  const toggle = (on: boolean) => {
    if (on && rounds.every((r) => r.isApplied)) {
      // Start with one empty row so the user can pick the first date right away
      onChange({
        isEscalationRescheduled: true,
        escalationRounds: [...rounds, { id: 0, escalationDate: "", isApplied: false, appliedDate: null, appliedBy: null }],
      });
      return;
    }
    // Turning off drops rounds not applied yet; applied rounds stay as history
    onChange({ isEscalationRescheduled: on, escalationRounds: on ? rounds : rounds.filter((r) => r.isApplied) });
  };

  const addRound = () =>
    setRounds([...rounds, { id: 0, escalationDate: "", isApplied: false, appliedDate: null, appliedBy: null }]);

  // Rows keep the order they were entered in; a date earlier than the previous round is an error
  const updateDate = (index: number, iso: string) =>
    setRounds(rounds.map((r, i) => (i === index ? { ...r, escalationDate: iso } : r)));

  // Live check while picking dates (empty rows are only flagged on Next/Save)
  const liveErrors = useMemo(
    () =>
      formData.isEscalationRescheduled
        ? validateEscalationRounds(rounds, formData.effectiveFrom, formData.expiresOn, formData.isNoExpiryDate, {
            requireDate: false,
          })
        : {},
    [formData.isEscalationRescheduled, rounds, formData.effectiveFrom, formData.expiresOn, formData.isNoExpiryDate]
  );

  const removeRound = (index: number) => setRounds(rounds.filter((_, i) => i !== index));

  if (!hasRegular && !formData.isEscalationRescheduled && appliedCount === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3 sm:col-span-2">
      {/* Header + switch */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <Label htmlFor="escalation-reschedule" className="cursor-pointer text-sm font-semibold">
              Reschedule escalation
            </Label>
            <p className="text-xs text-muted-foreground">
              Add one or more dated rounds, each later than the one before. Each round replaces the yearly date in
              its year; after the last round the yearly date applies again.
            </p>
          </div>
        </div>
        <Switch
          id="escalation-reschedule"
          checked={formData.isEscalationRescheduled}
          onCheckedChange={toggle}
          disabled={!hasRegular && !formData.isEscalationRescheduled}
        />
      </div>
      {fieldErrors.escalationDate && <p className="text-xs text-destructive">{fieldErrors.escalationDate}</p>}

      {/* Rounds */}
      {(formData.isEscalationRescheduled || appliedCount > 0) && (
        <div className="space-y-2">
          {rounds.map((r, i) => {
            const locked = r.isApplied;
            if (!formData.isEscalationRescheduled && !locked) return null;
            // Live result wins; fall back to the submit-time error (e.g. "Date is required")
            const err = liveErrors[i] ?? (r.escalationDate ? undefined : fieldErrors[`escalationRound-${i}`]);
            return (
              <div key={`${r.id}-${i}`} className="space-y-1">
                <div
                  className={cn(
                    "grid grid-cols-[72px_minmax(0,1fr)_auto_32px] items-center gap-2 rounded-md border px-2 py-1.5",
                    locked ? "bg-muted/40" : "bg-background",
                    err && "border-destructive"
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground">Round {i + 1}</span>
                  {locked ? (
                    <span className="flex items-center gap-1.5 font-mono text-sm">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      {formatDMY(r.escalationDate)}
                    </span>
                  ) : (
                    <CustomDateInput
                      value={isoToSlash(r.escalationDate)}
                      onChange={(v) => updateDate(i, slashToIso(v))}
                      placeholder="DD-MMM-YYYY"
                      className="h-8"
                    />
                  )}
                  <StatusBadge
                    entry={{
                      date: r.escalationDate,
                      source: "additional",
                      roundId: r.id,
                      isApplied: r.id > 0 ? r.isApplied : null,
                      appliedDate: r.appliedDate,
                    }}
                    isNewContract={r.id === 0}
                  />
                  {locked ? (
                    <span />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRound(i)}
                      title="Remove round"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {err && <p className="pl-1 text-xs text-destructive">{err}</p>}
              </div>
            );
          })}

          {formData.isEscalationRescheduled && (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={addRound}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add round
            </Button>
          )}
          {fieldErrors.escalationRounds && <p className="text-xs text-destructive">{fieldErrors.escalationRounds}</p>}
          {appliedCount > 0 && (
            <p className="text-[11px] text-muted-foreground">Applied rounds are locked and kept as history.</p>
          )}
        </div>
      )}

      {/* Status of this round + what's next */}
      {hasRegular && (
        <div className="grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">This round</p>
            {schedule.current ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{formatDMY(schedule.current.date)}</span>
                <span className="text-xs text-muted-foreground">{SOURCE_LABEL[schedule.current.source]}</span>
                <StatusBadge entry={schedule.current} isNewContract={isNewContract} />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No escalation due yet</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next rounds</p>
            {schedule.upcoming.length ? (
              <ul className="space-y-0.5">
                {schedule.upcoming.map((e) => (
                  <li key={e.date} className="flex items-center gap-2">
                    <span className="font-mono">{formatDMY(e.date)}</span>
                    <span
                      className={cn(
                        "text-xs",
                        e.source === "additional" ? "font-medium text-primary" : "text-muted-foreground"
                      )}
                    >
                      {SOURCE_LABEL[e.source]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No more rounds within the contract period</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
