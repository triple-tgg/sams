'use client'

import React from 'react'
import { PlusIcon, TrashIcon, Truck } from 'lucide-react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { CustomTimeInput } from '@/components/ui/input-time/CustomTimeInput'
import { combineFormToUtcDatetime, utcDatetimeToFormDate, utcDatetimeToFormTime } from '@/lib/utils/flightDatetime'
import { cn } from '@/lib/utils'

export interface FlightAircraftTowingItem {
  id?: string
  onDate: string // DD/MM/YYYY
  onTime: string // HH:mm
  offDate: string // DD/MM/YYYY
  offTime: string // HH:mm
  bayFrom: string
  bayTo: string
}

export interface FlightAircraftTowingApiItem {
  id?: string | null
  bayForm: string
  bayTo: string
  aircraftOnDate: string // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
  aircraftOffDate: string // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
}

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Convert form date (DD/MM/YYYY) and time (HH:mm) to ISO string in UTC without timezone offset (e.g. "YYYY-MM-DDTHH:mm:ss") */
export const formDateTimeToUtcIso = (formDate: string, time?: string): string => {
  if (!formDate) return ''
  const parts = formDate.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const t = time && time.trim() ? time.trim() : '00:00'
  const timeWithSec = t.length === 5 ? `${t}:00` : t
  const localIso = `${isoDate}T${timeWithSec}`
  const d = dayjs(localIso)
  if (!d.isValid()) return ''
  return d.utc().format('YYYY-MM-DDTHH:mm:ss')
}

export interface ToFlightAircraftTowingsListsOptions {
  includeExistingIds?: boolean
  defaultNullId?: boolean
}

/**
 * Convert form rows to `flightAircraftTowingsLists` matching API specification.
 * - When editing, existing rows loaded from the server have `item.id`, so we include `id` to UPDATE that existing row.
 * - New rows (or when creating new flights) do NOT have a server id, so `id` is omitted to INSERT a new row.
 * - For Recurring Flights Preview, `defaultNullId: true` sets `id: null` per API requirement.
 */
export const toFlightAircraftTowingsLists = (
  items: FlightAircraftTowingItem[] | null | undefined,
  optionsOrIncludeExistingIds: boolean | ToFlightAircraftTowingsListsOptions = true
): FlightAircraftTowingApiItem[] => {
  const options: ToFlightAircraftTowingsListsOptions =
    typeof optionsOrIncludeExistingIds === 'boolean'
      ? { includeExistingIds: optionsOrIncludeExistingIds, defaultNullId: false }
      : optionsOrIncludeExistingIds

  return (items ?? [])
    .filter((item) => !!item.onDate && !!item.offDate)
    .map((item) => {
      const payload: FlightAircraftTowingApiItem = {
        bayForm: item.bayFrom?.trim() || '',
        bayTo: item.bayTo?.trim() || '',
        aircraftOnDate: formDateTimeToUtcIso(item.onDate, item.onTime),
        aircraftOffDate: formDateTimeToUtcIso(item.offDate, item.offTime),
      }
      if (options.includeExistingIds && item.id) {
        payload.id = item.id
      } else if (options.defaultNullId) {
        payload.id = null
      }
      return payload
    })
}

/** Convert form rows to the legacy API payload shape */
export const toAircraftTowingPayload = (
  items: FlightAircraftTowingItem[] | null | undefined
) =>
  (items ?? [])
    .filter((item) => !!item.onDate && !!item.offDate)
    .map((item) => ({
      onDate: item.onDate && item.onTime
        ? combineFormToUtcDatetime(item.onDate, item.onTime)
        : item.onDate
        ? combineFormToUtcDatetime(item.onDate, '00:00')
        : '',
      offDate: item.offDate && item.offTime
        ? combineFormToUtcDatetime(item.offDate, item.offTime)
        : item.offDate
        ? combineFormToUtcDatetime(item.offDate, '00:00')
        : '',
      ...(item.bayFrom?.trim() ? { bayFrom: item.bayFrom.trim(), bayForm: item.bayFrom.trim() } : {}),
      ...(item.bayTo?.trim() ? { bayTo: item.bayTo.trim() } : {}),
    }))

/** Convert API response (flightAircraftTowingsLists or aircraft.aircraftTowing) back to form rows */
export const fromAircraftTowingPayload = (
  items: any[] | null | undefined
): FlightAircraftTowingItem[] =>
  (items ?? []).map((item) => {
    const rawOn = item.aircraftOnDate || item.onDate
    const rawOff = item.aircraftOffDate || item.offDate
    return {
      // Keep the server id as-is (do not fabricate one) so edit only references real rows
      id: item.id || undefined,
      onDate: rawOn ? utcDatetimeToFormDate(rawOn) : '',
      onTime: rawOn ? utcDatetimeToFormTime(rawOn) : '',
      offDate: rawOff ? utcDatetimeToFormDate(rawOff) : '',
      offTime: rawOff ? utcDatetimeToFormTime(rawOff) : '',
      bayFrom: item.bayForm || item.bayFrom || '',
      bayTo: item.bayTo || '',
    }
  })

export const isOffTimeBeforeOnTime = (
  onDate: string,
  onTime: string,
  offDate: string,
  offTime: string
): boolean => {
  if (!onDate || !onTime || !offDate || !offTime) return false
  const onParts = onDate.split('/')
  const offParts = offDate.split('/')
  if (onParts.length !== 3 || offParts.length !== 3) return false
  const onIso = `${onParts[2]}-${onParts[1].padStart(2, '0')}-${onParts[0].padStart(2, '0')}T${onTime.trim()}`
  const offIso = `${offParts[2]}-${offParts[1].padStart(2, '0')}-${offParts[0].padStart(2, '0')}T${offTime.trim()}`
  const onD = dayjs(onIso)
  const offD = dayjs(offIso)
  if (!onD.isValid() || !offD.isValid()) return false
  return !offD.isAfter(onD)
}

/** Standalone validator for towing items (used in form submit & recurring generator) */
export const validateAircraftTowing = (
  items: FlightAircraftTowingItem[] | null | undefined
): { isValid: boolean; message?: string } => {
  if (!items || items.length === 0) {
    return { isValid: false, message: 'At least one towing operation is required when enabled' }
  }
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!it.onDate || !it.onDate.trim()) {
      return { isValid: false, message: `Towing #${i + 1}: From date is required` }
    }
    if (!it.onTime || !it.onTime.trim()) {
      return { isValid: false, message: `Towing #${i + 1}: From time is required` }
    }
    if (!it.offDate || !it.offDate.trim()) {
      return { isValid: false, message: `Towing #${i + 1}: To date is required` }
    }
    if (!it.offTime || !it.offTime.trim()) {
      return { isValid: false, message: `Towing #${i + 1}: To time is required` }
    }
    if (!it.bayFrom || !it.bayFrom.trim()) {
      return { isValid: false, message: `Towing #${i + 1}: Bay From is required` }
    }
    if (it.bayFrom.trim().length > 10) {
      return { isValid: false, message: `Towing #${i + 1}: Bay From must not exceed 10 characters` }
    }
    if (!it.bayTo || !it.bayTo.trim()) {
      return { isValid: false, message: `Towing #${i + 1}: Bay To is required` }
    }
    if (it.bayTo.trim().length > 10) {
      return { isValid: false, message: `Towing #${i + 1}: Bay To must not exceed 10 characters` }
    }
    if (it.bayFrom.trim().toLowerCase() === it.bayTo.trim().toLowerCase()) {
      return { isValid: false, message: `Towing #${i + 1}: Bay From and Bay To must be different` }
    }
    if (isOffTimeBeforeOnTime(it.onDate, it.onTime, it.offDate, it.offTime)) {
      return { isValid: false, message: `Towing #${i + 1}: To time must be after From time` }
    }
  }
  return { isValid: true }
}

export interface AircraftTowingCardProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  items: FlightAircraftTowingItem[]
  onChange: (items: FlightAircraftTowingItem[]) => void
  defaultDate?: string
  disabled?: boolean
  errors?: any
}

export const AircraftTowingCard: React.FC<AircraftTowingCardProps> = ({
  enabled,
  onEnabledChange,
  items = [],
  onChange,
  defaultDate,
  disabled = false,
  errors,
}) => {
  const getTodayFormDate = () => dayjs().format('DD/MM/YYYY')

  const onAddItem = () => {
    if (items.length >= 3) return
    const initialDate = defaultDate && defaultDate.trim() ? defaultDate : getTodayFormDate()
    onChange([
      ...items,
      {
        onDate: initialDate,
        onTime: '',
        offDate: initialDate,
        offTime: '',
        bayFrom: '',
        bayTo: '',
      },
    ])
  }

  const updateItem = (index: number, patch: Partial<FlightAircraftTowingItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const rootError = errors?.message || errors?.root?.message

  return (
    <Card className="rounded-xl shadow-sm border-l-4 border-l-amber-500 border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5 text-amber-500" />
          Aircraft Towing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable / Disable Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="aircraft-towing-operations"
            checked={enabled}
            onCheckedChange={(checked) => {
              const next = Boolean(checked)
              onEnabledChange(next)
              if (next && items.length === 0) {
                const initialDate = defaultDate && defaultDate.trim() ? defaultDate : getTodayFormDate()
                onChange([
                  {
                    onDate: initialDate,
                    onTime: '',
                    offDate: initialDate,
                    offTime: '',
                    bayFrom: '',
                    bayTo: '',
                  },
                ])
              }
            }}
            disabled={disabled}
          />
          <label
            htmlFor="aircraft-towing-operations"
            className="text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-200 select-none"
          >
            Aircraft Towing Operations
          </label>
        </div>

        {enabled && (
          <div className="space-y-3">
            {rootError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center justify-between">
                <span>{rootError}</span>
                {items.length === 0 && (
                  <Button
                    type="button"
                    color="primary"
                    size="sm"
                    variant="soft"
                    onClick={onAddItem}
                    disabled={disabled}
                  >
                    <PlusIcon className="h-3.5 w-3.5 mr-1" />
                    Add Towing Info
                  </Button>
                )}
              </div>
            )}

            {items.length >= 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                <span>⚠</span>
                <span>Maximum 3 towing operations allowed.</span>
              </div>
            )}

            {items.map((item, index) => {
              const itemErr = Array.isArray(errors) ? errors[index] : errors?.[index]
              const onDateError = itemErr?.onDate?.message
              const onTimeError = itemErr?.onTime?.message
              const offDateError = itemErr?.offDate?.message
              const offTimeError = itemErr?.offTime?.message
              const bayFromError = itemErr?.bayFrom?.message
              const bayToError = itemErr?.bayTo?.message

              const hasTimeMismatch = Boolean(
                item.onDate &&
                  item.offDate &&
                  item.onTime &&
                  item.offTime &&
                  isOffTimeBeforeOnTime(item.onDate, item.onTime, item.offDate, item.offTime)
              )
              const hasBayMismatch = Boolean(
                item.bayFrom &&
                  item.bayTo &&
                  item.bayFrom.trim().toLowerCase() === item.bayTo.trim().toLowerCase()
              )

              const timeErrorMessage =
                itemErr?.timeMismatch?.message ||
                (hasTimeMismatch ? 'To time must be after From time' : undefined)
              const bayErrorMessage =
                itemErr?.bayMismatch?.message ||
                (hasBayMismatch ? 'Bay From and Bay To must be different' : undefined)

              return (
                <div
                  key={item.id || index}
                  className="bg-gray-50/80 dark:bg-slate-900/40 rounded-lg p-4 space-y-4 hover:bg-gray-100/80 dark:hover:bg-slate-900/60 transition-colors border border-gray-100 dark:border-slate-800"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge
                        color="secondary"
                        className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold"
                      >
                        {index + 1}
                      </Badge>
                      <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                        Towing Info
                      </h5>
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="soft"
                        size="icon"
                        color="destructive"
                        onClick={() => removeItem(index)}
                        disabled={disabled}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* From Date/Time */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">From *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <CustomDateInput
                            value={item.onDate}
                            onChange={(val) => updateItem(index, { onDate: val })}
                            placeholder="DD-MMM-YYYY"
                            disabled={disabled}
                            className={cn(onDateError && 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500')}
                          />
                          {onDateError && (
                            <p className="text-[11px] text-red-500 mt-1">{onDateError}</p>
                          )}
                        </div>
                        <div>
                          <CustomTimeInput
                            value={item.onTime}
                            onChange={(val) => updateItem(index, { onTime: val })}
                            className={cn(
                              'h-9',
                              (onTimeError || hasTimeMismatch) &&
                                'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500'
                            )}
                            disabled={disabled}
                          />
                          {onTimeError && (
                            <p className="text-[11px] text-red-500 mt-1">{onTimeError}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* To Date/Time */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-medium">To *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <CustomDateInput
                            value={item.offDate}
                            onChange={(val) => updateItem(index, { offDate: val })}
                            placeholder="DD-MMM-YYYY"
                            disabled={disabled}
                            className={cn(offDateError && 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500')}
                          />
                          {offDateError && (
                            <p className="text-[11px] text-red-500 mt-1">{offDateError}</p>
                          )}
                        </div>
                        <div>
                          <CustomTimeInput
                            value={item.offTime}
                            onChange={(val) => updateItem(index, { offTime: val })}
                            className={cn(
                              'h-9',
                              (offTimeError || hasTimeMismatch) &&
                                'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500'
                            )}
                            disabled={disabled}
                          />
                          {offTimeError && (
                            <p className="text-[11px] text-red-500 mt-1">{offTimeError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {timeErrorMessage && (
                    <p className="text-xs text-red-500 font-medium">
                      {timeErrorMessage}
                    </p>
                  )}

                  {/* Bay From / Bay To */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bay From *</Label>
                      <Input
                        placeholder="e.g., A1, B2"
                        maxLength={10}
                        value={item.bayFrom}
                        onChange={(e) => updateItem(index, { bayFrom: e.target.value })}
                        className={cn(
                          'h-9',
                          (bayFromError || hasBayMismatch) &&
                            'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500'
                        )}
                        disabled={disabled}
                      />
                      {bayFromError && (
                        <p className="text-[11px] text-red-500 mt-0.5">{bayFromError}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bay To *</Label>
                      <Input
                        placeholder="e.g., A1, B2"
                        maxLength={10}
                        value={item.bayTo}
                        onChange={(e) => updateItem(index, { bayTo: e.target.value })}
                        className={cn(
                          'h-9',
                          (bayToError || hasBayMismatch) &&
                            'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500'
                        )}
                        disabled={disabled}
                      />
                      {bayToError && (
                        <p className="text-[11px] text-red-500 mt-0.5">{bayToError}</p>
                      )}
                    </div>
                  </div>

                  {bayErrorMessage && (
                    <p className="text-xs text-red-500 font-medium">
                      {bayErrorMessage}
                    </p>
                  )}
                </div>
              )
            })}

            {items.length < 3 && (
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  color="primary"
                  size="sm"
                  variant="soft"
                  onClick={onAddItem}
                  disabled={disabled}
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  Add Towing Info
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AircraftTowingCard
