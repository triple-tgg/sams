'use client'

import React from 'react'
import { Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FlightAircraftTowingItem } from './AircraftTowingCard'

interface AircraftTowingPreviewCellProps {
  enabled?: boolean
  items?: FlightAircraftTowingItem[] | null
  maxInline?: number
  className?: string
}

export const AircraftTowingPreviewCell: React.FC<AircraftTowingPreviewCellProps> = ({
  enabled = true,
  items,
  maxInline = 1,
  className,
}) => {
  const list = enabled
    ? (items ?? []).filter((t) => !!(t.bayFrom || t.bayTo || t.onDate || t.offDate))
    : []

  if (!enabled || list.length === 0) {
    return <span className="text-slate-400 text-xs">-</span>
  }

  const inline = list.slice(0, maxInline)
  const hidden = list.length - inline.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex max-w-[220px] flex-wrap items-center gap-1 rounded-md p-0.5 text-left transition-colors hover:bg-amber-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:hover:bg-amber-950/30',
            className
          )}
          title="View aircraft towing details"
        >
          {inline.map((t, i) => (
            <span
              key={i}
              className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <Truck className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="font-mono">
                {t.bayFrom || '—'} → {t.bayTo || '—'}
              </span>
              {(t.onTime || t.offTime) && (
                <span className="font-normal text-amber-600/80 dark:text-amber-400/80">
                  · {t.onTime || '--:--'} - {t.offTime || '--:--'}
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

      <PopoverContent align="start" className="w-72 p-3 space-y-2">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Truck className="w-4 h-4 text-amber-500" />
          <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            Aircraft Towing Details ({list.length})
          </h5>
        </div>
        <div className="space-y-2 max-h-56 overflow-auto">
          {list.map((t, idx) => (
            <div
              key={idx}
              className="p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-xs space-y-1"
            >
              <div className="flex items-center justify-between font-medium text-amber-900 dark:text-amber-200">
                <span className="font-mono text-xs">
                  Bay: {t.bayFrom || '—'} → {t.bayTo || '—'}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">#{idx + 1}</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                <div>From: {t.onDate || '—'} {t.onTime ? `(${t.onTime})` : ''}</div>
                <div>To: {t.offDate || '—'} {t.offTime ? `(${t.offTime})` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AircraftTowingPreviewCell

