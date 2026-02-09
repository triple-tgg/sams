import React, { useState } from 'react'
import { AlertCircle, ChevronDown, Clock } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Trash2, Users } from 'lucide-react'
import { ServicesFormInputs } from '../types'
import { StaffTypeOption } from '@/lib/api/hooks/useStaffsTypes'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import SearchableStaffSelect from './SearchableStaffSelect'
import dayjs from 'dayjs'
import { convertDateToBackend } from '@/lib/utils/formatPicker'

/** Calculate duration in minutes between From and To datetime */
const calcDurationMinutes = (formDate: string, formTime: string, toDate: string, toTime: string): number => {
  if (!formDate || !formTime || !toDate || !toTime) return 0
  const from = dayjs(`${convertDateToBackend(formDate)} ${formTime}`, "YYYY-MM-DD HH:mm")
  const to = dayjs(`${convertDateToBackend(toDate)} ${toTime}`, "YYYY-MM-DD HH:mm")
  if (!from.isValid() || !to.isValid()) return 0
  const diff = to.diff(from, 'minute')
  return diff > 0 ? diff : 0
}

/** Format minutes to "Xh Ym" string */
const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return '0m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export const PersonnelSection: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
  staffsTypesValuesOptions: {
    staffsTypesOptions: StaffTypeOption[];
    isLoadingStaffsTypes: boolean;
    staffsTypesError: Error | null;
    hasOptionsStaffsTypes: boolean;
  };
  infoData: FlightFormData | null;
}> = ({ form, onAdd, onRemove, staffsTypesValuesOptions, infoData }) => {

  const addPersonnels = form.watch('addPersonnels')
  const personnel = form.watch('personnel') || []

  // Track which items are expanded (new items default to open)
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({})

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({ ...prev, [index]: prev[index] === undefined ? false : !prev[index] }))
  }

  // Calculate per-item durations (recomputes on every render triggered by form.watch)
  const itemDurations = personnel.map(p =>
    calcDurationMinutes(p.formDate, p.formTime, p.toDate, p.toTime)
  )

  // Calculate total duration
  const totalDuration = itemDurations.reduce((sum, d) => sum + d, 0)

  return (
    <Card className="rounded-xl shadow-sm border-l-4 border-l-violet-500 border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-violet-500" />
          Personnel
          {addPersonnels && personnel.length > 0 && (
            <Badge color="default" className="ml-1 text-xs px-1.5 py-0 h-5">
              {personnel.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="addPersonnels"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  color='primary'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-medium cursor-pointer">
                Add Personnel
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Top-level personnel error */}
        {(() => {
          const personnelErrors = form.formState.errors.personnel as any
          const errorMessage = personnelErrors?.message || personnelErrors?.root?.message
          if (!errorMessage) return null
          return (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg mt-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )
        })()}

        {addPersonnels && (
          <div className="space-y-4">
            {/* Staff Search */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Staff Search & Selection</h4>
              <SearchableStaffSelect
                infoData={infoData}
                form={form}
                index={personnel.length}
                onStaffSelect={(staff) => {
                  // New items default to expanded
                  setOpenItems(prev => ({ ...prev, [personnel.length]: true }))
                  onAdd()
                }}
              />
            </div>

            {/* Personnel List */}
            {personnel.length > 0 && (
              <div className="space-y-3">
                {/* Header with total duration */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Personnel List ({personnel.length})
                  </h4>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-md">
                    <Clock className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-xs font-semibold text-violet-700">
                      Total: {formatDuration(totalDuration)}
                    </span>
                  </div>
                </div>

                {personnel.map((_, index) => {
                  const isOpen = openItems[index] !== undefined ? openItems[index] : true
                  const duration = itemDurations[index] || 0

                  return (
                    <Collapsible
                      key={index}
                      open={isOpen}
                      onOpenChange={() => toggleItem(index)}
                    >
                      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        {/* Header: Badge + Staff Info + Duration + Chevron + Delete */}
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-3 px-4 py-2.5 bg-linear-to-r from-violet-50 to-slate-50 border-b border-gray-100 cursor-pointer select-none">
                            <Badge color="default" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-bold shrink-0 bg-blue-500 text-white">
                              {index + 1}
                            </Badge>

                            {/* Hidden Staff ID */}
                            <FormField
                              control={form.control}
                              name={`personnel.${index}.staffId`}
                              render={({ field }) => (
                                <FormItem className='hidden'>
                                  <FormControl>
                                    <Input {...field} readOnly />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-slate-700 shrink-0">
                                {form.watch(`personnel.${index}.staffCode`) || '—'}
                              </span>
                              <span className="text-xs text-slate-400">|</span>
                              <span className="text-sm text-slate-600 truncate">
                                {form.watch(`personnel.${index}.name`) || 'Unnamed'}
                              </span>
                            </div>

                            {/* Per-item duration badge */}
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700 shrink-0">
                              <Clock className="h-3 w-3" />
                              {formatDuration(duration)}
                            </div>

                            {/* Chevron */}
                            <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />

                            {/* Delete button */}
                            <Button
                              type="button"
                              variant="soft"
                              size="icon"
                              color="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemove(index)
                              }}
                              title="Remove personnel"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CollapsibleTrigger>

                        {/* Collapsible Body: Fields */}
                        <CollapsibleContent>
                          <div className="px-4 py-3 space-y-3">
                            {/* Hidden fields for staffCode and name */}
                            <FormField
                              control={form.control}
                              name={`personnel.${index}.staffCode`}
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl><Input {...field} readOnly /></FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`personnel.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl><Input {...field} readOnly /></FormControl>
                                </FormItem>
                              )}
                            />

                            {/* Row 1: Type + From + To */}
                            <div className="grid grid-cols-5 gap-3">
                              {/* Type */}
                              <div className="col-span-1">
                                <FormField
                                  control={form.control}
                                  name={`personnel.${index}.type`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormLabel className="text-xs text-muted-foreground">Type *</FormLabel>
                                      <FormControl>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value || ""}
                                        >
                                          <FormControl>
                                            <SelectTrigger className="h-9">
                                              <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {staffsTypesValuesOptions.staffsTypesOptions && !!staffsTypesValuesOptions.hasOptionsStaffsTypes ? (
                                              staffsTypesValuesOptions.staffsTypesOptions.map((option) => (
                                                <SelectItem key={option.value} value={String(option.value)}>
                                                  {option.label}
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <SelectItem value="-" disabled>
                                                No types available
                                              </SelectItem>
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* From: Date + Time */}
                              <div className="col-span-2">
                                <FormLabel className="text-xs text-muted-foreground mb-1 block">From *</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0">
                                    <Controller
                                      name={`personnel.${index}.formDate`}
                                      control={form.control}
                                      render={({ field, fieldState }) => (
                                        <>
                                          <CustomDateInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="DD-MMM-YYYY"
                                          />
                                          {fieldState.error && (
                                            <p className="text-xs font-medium text-destructive mt-1">{fieldState.error.message}</p>
                                          )}
                                        </>
                                      )}
                                    />
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name={`personnel.${index}.formTime`}
                                    render={({ field }) => (
                                      <FormItem className="space-y-0">
                                        <FormControl>
                                          <Input type="time" {...field} className="h-9" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>

                              {/* To: Date + Time */}
                              <div className="col-span-2">
                                <FormLabel className="text-xs text-muted-foreground mb-1 block">To *</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0">
                                    <Controller
                                      name={`personnel.${index}.toDate`}
                                      control={form.control}
                                      render={({ field, fieldState }) => (
                                        <>
                                          <CustomDateInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="DD-MMM-YYYY"
                                          />
                                          {fieldState.error && (
                                            <p className="text-xs font-medium text-destructive mt-1">{fieldState.error.message}</p>
                                          )}
                                        </>
                                      )}
                                    />
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name={`personnel.${index}.toTime`}
                                    render={({ field }) => (
                                      <FormItem className="space-y-0">
                                        <FormControl>
                                          <Input type="time" {...field} className="h-9" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Remark (full width) */}
                            <FormField
                              control={form.control}
                              name={`personnel.${index}.remark`}
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormLabel className="text-xs text-muted-foreground">Remark</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Additional notes..."
                                      {...field}
                                      className="h-9"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PersonnelSection