import type { TrendBadge } from '../../types';

const toneClass: Record<TrendBadge['tone'], string> = {
  up: 'bg-emerald-50 text-emerald-700',
  down: 'bg-red-50 text-red-700',
  flat: 'bg-muted text-muted-foreground',
  na: 'bg-primary/10 text-primary',
  new: 'bg-primary/10 text-primary',
  amber: 'bg-amber-50 text-amber-700',
};

/** Small pill badge used throughout comparison tables, e.g. "+12%", "-6", "New", "N/A". */
export function Badge({ badge }: { badge: TrendBadge }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${toneClass[badge.tone]}`}>
      {badge.label}
    </span>
  );
}

/** Larger pill variant used in the "vs Bud / vs Plan" strips under charts. */
export function VsPill({ badge }: { badge: TrendBadge }) {
  return (
    <span className={`inline-block rounded px-[5px] py-[2px] text-[9.5px] font-semibold whitespace-nowrap ${toneClass[badge.tone]}`}>
      {badge.label}
    </span>
  );
}
