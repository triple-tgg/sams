'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

export type FlightFormSectionKey = 'flightInfo' | 'service' | 'personnel'

/** Only the first group is expanded when the form opens. */
export const INITIAL_FLIGHT_FORM_SECTIONS: Record<FlightFormSectionKey, boolean> = {
  flightInfo: true,
  service: false,
  personnel: false,
}

interface FlightFormSectionProps {
  title: string
  icon: React.ElementType
  /** Tailwind classes for the icon badge (bg / text / border). */
  iconClassName?: string
  /** Compact info shown on the right of the header (e.g. counts). */
  summary?: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Collapsible group for the Add/Edit Flight forms.
 * Content stays mounted while collapsed (`forceMount` + hidden) so react-hook-form
 * fields and PersonnelSection's internal selection state are preserved.
 */
export const FlightFormSection: React.FC<FlightFormSectionProps> = ({
  title,
  icon: Icon,
  iconClassName = 'bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
  summary,
  open,
  onOpenChange,
  children,
}) => (
  <Collapsible
    open={open}
    onOpenChange={onOpenChange}
    className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
  >
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900',
          open && 'rounded-b-none border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60',
        )}
      >
        <span className="flex items-center gap-2">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg border', iconClassName)}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        </span>
        <span className="flex items-center gap-2">
          {summary != null && <span className="text-xs text-slate-500 dark:text-slate-400">{summary}</span>}
          <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent forceMount className="data-[state=closed]:hidden">
      <div className="p-4">{children}</div>
    </CollapsibleContent>
  </Collapsible>
)

export default FlightFormSection
