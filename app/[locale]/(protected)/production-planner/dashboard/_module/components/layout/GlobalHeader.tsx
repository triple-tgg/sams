'use client';

import { useDateRangeCompare } from '../../hooks/useDateRangeCompare';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import type { ComparePeriods } from '../../types';

interface GlobalHeaderProps {
  title: string;
  periods: ComparePeriods;
  onPeriodsChange?: (periods: ComparePeriods) => void;
  onDownload?: () => void;
}

export function GlobalHeader({ title, periods, onPeriodsChange, onDownload }: GlobalHeaderProps) {
  const { draft, updateDraft, apply, p1Badge, p2Badge, justApplied } = useDateRangeCompare(periods, onPeriodsChange);

  return (
    <div className="mb-5">
      {/* Row 1: Export button — right aligned */}
      <div className="flex justify-end mb-3">
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        )}
      </div>

      {/* Row 2: Period filters + Search in a card */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Period 1 */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-[3px] text-[11px] font-medium text-primary">
              Period 1
            </span>
            <div className="flex items-center gap-1.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={draft.p1.start}
                  onChange={(e) => updateDraft('p1Start', e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={draft.p1.end}
                  onChange={(e) => updateDraft('p1End', e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="h-9 w-px bg-border self-end" />

          {/* Period 2 */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-[3px] text-[11px] font-medium text-emerald-700">
              Period 2
            </span>
            <div className="flex items-center gap-1.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={draft.p2.start}
                  onChange={(e) => updateDraft('p2Start', e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={draft.p2.end}
                  onChange={(e) => updateDraft('p2End', e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center gap-2 self-end">
          <Button size="sm" onClick={apply} className="h-9">
            <Search className="h-4 w-4 mr-1.5" />
            Search
          </Button>
          {justApplied && <span className="text-xs font-medium text-success">✓ Applied</span>}
        </div>
      </div>
    </div>
  );
}
