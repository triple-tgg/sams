"use client";

import { useMemo } from "react";
import { CalendarClock, CheckCircle2, Clock, HelpCircle, History, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildEscalationSchedule,
  formatDMY,
  sortEscalationLog,
  summarizeEscalationByRate,
  type EscalationSource,
} from "@/lib/utils/contractEscalation";
import type { ContractFormData, PricingRate } from "./types";

const SOURCE_LABEL: Record<EscalationSource, string> = { regular: "Yearly", additional: "Additional" };

const fmtPct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)}%`;

const rateLabel = (rate: PricingRate | undefined, index: number) => {
  if (!rate) return `Rate #${index + 1}`;
  const parts = [rate.serviceLocation.join(", "), rate.aircraftTypes.join(", ")].filter(Boolean);
  return parts.length ? `Rate #${index + 1} · ${parts.join(" · ")}` : `Rate #${index + 1}`;
};

function SourceTag({ source }: { source: EscalationSource }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium",
        source === "additional" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}

function Stat({ label, value, sub, icon: Icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function EscalationLogTab({ formData, isLoading }: { formData: ContractFormData; isLoading?: boolean }) {
  const log = useMemo(() => sortEscalationLog(formData.escalationLog), [formData.escalationLog]);

  // Rates are matched by their numeric id from the API
  const rates = formData.pricingRates.filter((r): r is PricingRate & { id: number } => typeof r.id === "number");
  const rateIndex = new Map(formData.pricingRates.map((r, i) => [r.id, i]));

  const perRate = useMemo(
    () => summarizeEscalationByRate(log, rates.map((r) => r.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, formData.pricingRates]
  );

  const schedule = useMemo(
    () =>
      buildEscalationSchedule({
        regularDate: formData.escalationDate,
        rounds: formData.escalationRounds,
        effectiveFrom: formData.effectiveFrom,
        expiresOn: formData.isNoExpiryDate ? null : formData.expiresOn,
        lastEscalationAppliedDate: formData.lastEscalationAppliedDate ?? log[log.length - 1]?.appliedDate ?? null,
      }),
    [formData.escalationDate, formData.escalationRounds, formData.effectiveFrom, formData.expiresOn,
      formData.isNoExpiryDate, formData.lastEscalationAppliedDate, log]
  );

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const last = log[log.length - 1];
  const current = schedule.current;
  const next = schedule.upcoming[0];

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={History} label="Rounds applied" value={log.length} sub={last ? `Last: ${formatDMY(last.appliedDate)}` : "None yet"} />
        <Stat
          icon={current?.isApplied ? CheckCircle2 : current?.isApplied === false ? Clock : HelpCircle}
          label="This round"
          value={current ? formatDMY(current.date) : "—"}
          sub={
            !current ? (
              "No escalation due yet"
            ) : current.isApplied ? (
              <span className="text-emerald-700">Applied</span>
            ) : current.isApplied === false ? (
              <span className="text-amber-700">Not applied yet</span>
            ) : (
              "No status from system"
            )
          }
        />
        <Stat
          icon={CalendarClock}
          label="Next round"
          value={next ? formatDMY(next.date) : "—"}
          sub={next ? SOURCE_LABEL[next.source] : "No more rounds in contract period"}
        />
        <Stat
          icon={CalendarClock}
          label="Yearly date"
          value={formData.escalationDate ? formatDMY(`2000-${formData.escalationDate}`).slice(0, 6) : "—"}
          sub={formData.escalationRounds.length ? `${formData.escalationRounds.length} additional round(s)` : "No additional rounds"}
        />
      </div>

      {/* Per rate */}
      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Escalation by rate
        </h3>
        {rates.length === 0 ? (
          <p className="text-sm text-muted-foreground">This contract has no pricing rates.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Escalation / round</th>
                  <th className="px-3 py-2 text-right font-medium">Rounds applied</th>
                  <th className="px-3 py-2 text-right font-medium">Total increase</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => {
                  const s = perRate.find((x) => x.pricingDataId === r.id);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{rateLabel(r, rateIndex.get(r.id) ?? 0)}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtPct(Number(r.escalation) || 0)}</td>
                      <td className="px-3 py-2 text-right font-mono">{s?.roundsApplied ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {s && s.roundsApplied > 0 ? `+${fmtPct(s.cumulativePercent)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
              Total increase is compounded across applied rounds.
            </p>
          </div>
        )}
      </section>

      {/* Log */}
      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" />
          Escalation log
        </h3>
        {log.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
            <History className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No escalation applied yet</p>
            <p className="mt-1 text-xs">Applied rounds will be listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Round date</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Applied on</th>
                  <th className="px-3 py-2 text-left font-medium">By</th>
                  <th className="px-3 py-2 text-left font-medium">Escalation</th>
                </tr>
              </thead>
              <tbody>
                {[...log].reverse().map((e, i) => {
                  const pcts = e.rates.map((r) => r.percent);
                  const same = pcts.length > 0 && pcts.every((p) => p === pcts[0]);
                  return (
                    <tr key={e.id} className="border-t align-top">
                      <td className="px-3 py-2 font-mono text-muted-foreground">{log.length - i}</td>
                      <td className="px-3 py-2 font-mono">{formatDMY(e.escalationDate)}</td>
                      <td className="px-3 py-2"><SourceTag source={e.source} /></td>
                      <td className="px-3 py-2 font-mono">{formatDMY(e.appliedDate)}</td>
                      <td className="px-3 py-2">{e.appliedBy || "System"}</td>
                      <td className="px-3 py-2">
                        {pcts.length === 0 ? (
                          "—"
                        ) : same ? (
                          <span className="font-mono font-semibold">+{fmtPct(pcts[0])}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {e.rates.map((r) => {
                              const idx = rateIndex.get(r.pricingDataId);
                              return (
                                <span key={r.pricingDataId} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                  {idx !== undefined ? `Rate #${idx + 1}` : `Rate ${r.pricingDataId}`}:{" "}
                                  <span className="font-mono font-semibold">+{fmtPct(r.percent)}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming */}
      {schedule.upcoming.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Upcoming rounds
          </h3>
          <ul className="divide-y rounded-lg border text-sm">
            {schedule.upcoming.map((e) => (
              <li key={e.date} className="flex items-center gap-3 px-3 py-2">
                <span className="font-mono">{formatDMY(e.date)}</span>
                <SourceTag source={e.source} />
                <span className="ml-auto text-xs text-muted-foreground">Uses each rate&apos;s Escalation %</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
