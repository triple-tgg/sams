import type { ReactNode } from 'react';
import type { CompareKpi, TrendTone } from '../../types';

const accentClass: Record<string, string> = {
  blue: 'text-primary',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  pink: 'text-pink-600',
  purple: 'text-violet-600',
};

/** Large stat card used at the top of the Overview tab. */
export function MetricCard({
  accent,
  label,
  value,
  sub,
}: {
  accent: keyof typeof accentClass;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${accentClass[accent]}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

const toneTextClass: Record<TrendTone, string> = {
  up: 'text-success',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
  na: 'text-muted-foreground',
  new: 'text-primary',
  amber: 'text-amber-600',
};

/** Compact KPI tile used in the Compare and Category tabs. */
export function KpiCard({ kpi }: { kpi: CompareKpi }) {
  return (
    <div className="rounded-md border border-border bg-card p-3.5 shadow-sm">
      <p className="mb-1 text-[11px] text-muted-foreground">{kpi.label}</p>
      <p className="mb-0.5 text-xl font-bold leading-tight" style={kpi.valueColor ? { color: kpi.valueColor } : undefined}>
        {kpi.value}
      </p>
      <p className={`text-[11px] ${kpi.subTone ? toneTextClass[kpi.subTone] : 'text-muted-foreground'}`}>{kpi.sub}</p>
    </div>
  );
}

/** Small square tile, e.g. "Station revenue change" grid. */
export function StatTile({
  label,
  value,
  valueTone,
  sub,
  children,
}: {
  label: string;
  value: string;
  valueTone: 'up' | 'down';
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-[90px] flex-1 rounded-md bg-muted px-4 py-2.5 text-center">
      <p className="mb-1 text-[10px] font-semibold text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${valueTone === 'up' ? 'text-success' : 'text-destructive'}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      {children}
    </div>
  );
}
