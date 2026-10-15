'use client'

import React, { useMemo } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import type { FlightAircraftCheck } from './index'

interface AircraftChecksPreviewCellProps {
  checks: FlightAircraftCheck[] | null | undefined
  /** Max number of check chips shown inline before collapsing into "+N". */
  maxInline?: number
  className?: string
}

/** Lookup maps code -> display name for check types / sub types (master data is react-query cached). */
const useCheckLabels = () => {
  const { checkTypes, checkSubTypes } = useAircraftCheckMasterData()
  return useMemo(() => {
    const typeName = new Map<string, string>()
    checkTypes.forEach((t) => typeName.set(t.code, t.name || t.code))
    const subTypeName = new Map<string, string>()
    checkSubTypes.forEach((s) => subTypeName.set(s.code, s.name || s.code))
    return { typeName, subTypeName }
  }, [checkTypes, checkSubTypes])
}

/**
 * Compact display of a flight's Aircraft Checks for table rows (e.g. Recurring Flights Preview).
 * Inline: `[TR · Transit, Daily] [+1]` — click to open a popover with the full breakdown.
 */
export const AircraftChecksPreviewCell: React.FC<AircraftChecksPreviewCellProps> = ({
  checks,
  maxInline = 2,
  className,
}) => {
  const { typeName, subTypeName } = useCheckLabels()
  const list = (checks ?? []).filter((c) => !!c.maintenanceTypes)

  if (list.length === 0) {
    return <span className="text-slate-400">-</span>
  }

  const inline = list.slice(0, maxInline)
  const hidden = list.length - inline.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex max-w-[220px] flex-wrap items-center gap-1 rounded-md p-0.5 text-left transition-colors hover:bg-emerald-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:hover:bg-emerald-950/30',
            className
          )}
          title="View aircraft checks"
        >
          {inline.map((c, i) => (
            <span
              key={i}
              className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <span className="font-mono">{c.maintenanceTypes}</span>
              {c.maintenanceSubTypes?.length > 0 && (
                <span className="truncate font-normal text-emerald-600/80 dark:text-emerald-400/80">
                  · {c.maintenanceSubTypes.map((s) => subTypeName.get(s) ?? s).join(', ')}
                </span>
              )}
            </span>
          ))}
          {hidden > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              +{hidden}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
          <ClipboardCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Aircraft Checks</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {list.length}
          </span>
        </div>
        <ol className="max-h-64 space-y-2 overflow-auto p-3">
          {list.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 dark:bg-slate-800">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-xs">
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                    {c.maintenanceTypes}
                  </span>
                  {typeName.get(c.maintenanceTypes) && typeName.get(c.maintenanceTypes) !== c.maintenanceTypes && (
                    <span className="ml-1.5 text-slate-500">{typeName.get(c.maintenanceTypes)}</span>
                  )}
                </div>
                {c.maintenanceSubTypes?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {c.maintenanceSubTypes.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {subTypeName.get(s) ?? s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] italic text-slate-400">No sub types</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </PopoverContent>
    </Popover>
  )
}

export default AircraftChecksPreviewCell
