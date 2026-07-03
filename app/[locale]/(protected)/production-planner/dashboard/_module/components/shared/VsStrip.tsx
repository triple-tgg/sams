import { VsPill } from './Badge';
import type { CategoryVsSummary } from '../../types';

export function VsStrip({ items }: { items: CategoryVsSummary[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border pt-2">
      {items.map((item) => (
        <div key={item.category} className="flex min-w-[56px] flex-1 flex-col items-center gap-[3px]">
          <div
            className="text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: item.color ?? undefined }}
          >
            {item.category}
          </div>
          {item.pills.map((pill) => (
            <div key={pill.label} className="flex flex-wrap justify-center gap-[3px]">
              <span className="text-[8px] text-muted-foreground">{pill.label}</span>
              <VsPill badge={pill.value} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
