'use client'

import React, { useMemo } from 'react'
import { ClipboardCheck, PlusIcon, TrashIcon, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'
import {
  transformAircraftCheckTypesToOptions,
  transformAircraftCheckSubTypesToOptions,
} from '../ServicesStep/types'
import { getDefaultMaintenanceType } from '../ServicesStep/utils'
import {
  isTRType,
  isFullHandling,
  ServiceDescriptionBanner,
} from '../ServicesStep/formSection/AircraftChecksSection'

export interface FlightAircraftCheck {
  maintenanceTypes: string
  maintenanceSubTypes: string[]
}

/** Convert form rows to the API shape (`aircraftCheckType`), dropping rows without a type. */
export const toAircraftCheckPayload = (checks: FlightAircraftCheck[] | null | undefined) =>
  (checks ?? [])
    .filter((c) => !!c.maintenanceTypes)
    .map((c) => ({ checkType: c.maintenanceTypes, checkSubType: c.maintenanceSubTypes ?? [] }))

/** Convert THF `aircraft.aircraftCheckType` back to form rows. */
export const fromAircraftCheckPayload = (
  checks: { checkType: string | null; checkSubType: string[] | null }[] | null | undefined
): FlightAircraftCheck[] =>
  (checks ?? [])
    .filter((c) => !!c.checkType)
    .map((c) => ({ maintenanceTypes: c.checkType as string, maintenanceSubTypes: c.checkSubType ?? [] }))

interface FlightServiceGroupProps {
  value: FlightAircraftCheck[]
  onChange: (value: FlightAircraftCheck[]) => void
  disabled?: boolean
  /** Hide the "Service" group header (e.g. when wrapped by a collapsible group header). */
  hideHeader?: boolean
}

export const FlightServiceGroup: React.FC<FlightServiceGroupProps> = ({ value, onChange, disabled, hideHeader = false }) => {
  const { checkTypes, checkSubTypes, isLoadingCheckTypes } = useAircraftCheckMasterData()

  const maintenanceOptions = useMemo(() => transformAircraftCheckTypesToOptions(checkTypes), [checkTypes])
  const subTypeOptions = useMemo(() => transformAircraftCheckSubTypesToOptions(checkSubTypes), [checkSubTypes])

  const checks = value ?? []

  const updateRow = (index: number, patch: Partial<FlightAircraftCheck>) =>
    onChange(checks.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const addRow = () =>
    onChange([...checks, { maintenanceTypes: getDefaultMaintenanceType(checkTypes), maintenanceSubTypes: [] }])

  const removeRow = (index: number) => onChange(checks.filter((_, i) => i !== index))

  return (
    <div className="space-y-3">
      {/* Group header — same style as "Personnel Assignment" */}
      {!hideHeader && (
        <div className="flex items-center gap-2 pb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200/60 bg-emerald-50 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Wrench className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Service</h4>
        </div>
      )}

      <Card className="rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            Aircraft Checks
            {checks.length > 0 && (
              <Badge color="default" className="ml-1 h-5 px-1.5 py-0 text-xs">{checks.length}</Badge>
            )}
          </CardTitle>
          <Button
            type="button"
            color="primary"
            variant="soft"
            size="sm"
            onClick={addRow}
            disabled={disabled || isLoadingCheckTypes}
          >
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            Add Check
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoadingCheckTypes ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-emerald-500" />
              <span className="ml-2 text-sm text-muted-foreground">Loading check types...</span>
            </div>
          ) : checks.length === 0 ? (
            <p className="py-4 text-center text-xs italic text-muted-foreground">
              No aircraft checks. Click &quot;Add Check&quot; to add one.
            </p>
          ) : (
            checks.map((check, index) => {
              const subTypesDisabled = disabled || !isTRType(check.maintenanceTypes || '')
              const hasFullHandling = (check.maintenanceSubTypes || []).some(isFullHandling)

              return (
                <div key={index} className="space-y-4 rounded-lg bg-gray-50/80 p-4 transition-colors hover:bg-gray-100/80">
                  <div className="flex items-start gap-3">
                    <Badge color="secondary" className="mt-7 flex h-6 w-6 shrink-0 items-center justify-center p-0 text-xs font-semibold">
                      {index + 1}
                    </Badge>

                    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Maintenance type */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Maintenance Type *</Label>
                        <Select
                          value={check.maintenanceTypes || ''}
                          disabled={disabled}
                          onValueChange={(v) =>
                            updateRow(index, {
                              maintenanceTypes: v,
                              ...(isTRType(v) ? {} : { maintenanceSubTypes: [] }),
                            })
                          }
                        >
                          <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {maintenanceOptions.length > 0 ? (
                              maintenanceOptions.map((option) => {
                                // Non-TR types may only be used once across checks
                                const usedElsewhere =
                                  !isTRType(option.value) &&
                                  checks.some((c, i) => i !== index && c.maintenanceTypes === option.value)
                                return (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={usedElsewhere}
                                    className={usedElsewhere ? 'opacity-50' : ''}
                                  >
                                    {option.label}{usedElsewhere ? ' (already selected)' : ''}
                                  </SelectItem>
                                )
                              })
                            ) : (
                              <SelectItem value="__none" disabled>No types available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sub types */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Sub Types</Label>
                        <div className="flex flex-wrap gap-2">
                          {subTypeOptions.map((option) => {
                            const selected = (check.maintenanceSubTypes || []).includes(option.value)
                            const multiAllowed = hasFullHandling || isFullHandling(option.value)
                            return (
                              <label
                                key={option.value}
                                className={`flex cursor-pointer select-none items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all ${
                                  subTypesDisabled
                                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                                    : selected
                                      ? 'border-primary/30 bg-primary/10 text-primary'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-primary/30 hover:text-primary'
                                }`}
                              >
                                <Checkbox
                                  className="h-3.5 w-3.5"
                                  color="primary"
                                  disabled={subTypesDisabled}
                                  checked={selected}
                                  onCheckedChange={(checked) => {
                                    if (subTypesDisabled) return
                                    const current = check.maintenanceSubTypes || []
                                    const next = checked
                                      ? multiAllowed ? [...current, option.value] : [option.value]
                                      : current.filter((v) => v !== option.value)
                                    updateRow(index, { maintenanceSubTypes: next })
                                  }}
                                />
                                {option.label}
                              </label>
                            )
                          })}
                        </div>
                        {!isTRType(check.maintenanceTypes || '') && (
                          <p className="mt-1 text-[10px] text-muted-foreground">Subtypes available with TR type only.</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="soft"
                      color="destructive"
                      size="icon"
                      className="mt-6 h-8 w-8 p-0"
                      onClick={() => removeRow(index)}
                      disabled={disabled}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <ServiceDescriptionBanner
                    maintenanceType={check.maintenanceTypes}
                    subTypes={check.maintenanceSubTypes || []}
                  />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FlightServiceGroup
