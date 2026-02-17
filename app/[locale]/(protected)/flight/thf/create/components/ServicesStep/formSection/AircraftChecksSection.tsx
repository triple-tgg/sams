import React, { useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { UseFormReturn } from 'react-hook-form'
import { PlusIcon, ClipboardCheck, XIcon, TrashIcon } from 'lucide-react'
import { AircraftCheckSubType, AircraftCheckType } from '@/lib/api/master/aircraft-check-types/airlines.interface'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { ServicesFormInputs, transformAircraftCheckTypesToOptions, transformAircraftCheckSubTypesToOptions } from '../types'

/** Check if maintenance type is TR-related (starts with TR/tr or equals TR-Transit) */
const isTRType = (value: string) =>
  /^tr/i.test(value) || value === 'TR-Transit'

const AircraftChecksSection: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
  checkTypes: AircraftCheckType[]
  checkSubTypes: AircraftCheckSubType[]
  isLoadingCheckTypes: boolean
  isLoadingCheckSubTypes: boolean
}> = ({ form, onAdd, onRemove, ...props }) => {
  const maintenanceOptions = useMemo(() =>
    transformAircraftCheckTypesToOptions(props.checkTypes || []), [props.checkTypes]
  )

  const subTypeOptions = useMemo(() =>
    transformAircraftCheckSubTypesToOptions(props.checkSubTypes || []), [props.checkSubTypes]
  )

  const aircraftChecks = form.watch('aircraftChecks')

  if (props.isLoadingCheckTypes) {
    return (
      <Card className="rounded-xl shadow-sm border-l-4 border-l-emerald-500 border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            Aircraft Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading check types...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-sm border-l-4 border-l-emerald-500 border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-emerald-500" />
          Aircraft Checks
          {aircraftChecks.length > 0 && (
            <Badge color="default" className="ml-1 text-xs px-1.5 py-0 h-5">
              {aircraftChecks.length}
            </Badge>
          )}
        </CardTitle>
        <Button
          type="button"
          color="primary"
          variant="soft"
          size="sm"
          onClick={onAdd}
        >
          <PlusIcon className="h-3.5 w-3.5 mr-1" />
          Add Check
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {aircraftChecks.map((_, index) => (
          <div
            key={index}
            className="bg-gray-50/80 rounded-lg p-4 space-y-4 hover:bg-gray-100/80 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Badge color="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold shrink-0 mt-7">
                {index + 1}
              </Badge>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`aircraftChecks.${index}.maintenanceTypes`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-muted-foreground">Maintenance Type *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (!isTRType(value)) {
                            form.setValue(`aircraftChecks.${index}.maintenanceSubTypes`, [])
                          }
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maintenanceOptions?.length > 0 ? (
                            maintenanceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No types available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`aircraftChecks.${index}.maintenanceSubTypes`}
                  render={({ field }) => {
                    const selectedMaintenanceType = form.watch(`aircraftChecks.${index}.maintenanceTypes`)
                    const isSubTypesDisabled = !isTRType(selectedMaintenanceType || '')

                    return (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs text-muted-foreground">Sub Types</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {subTypeOptions.map((option) => (
                            <label
                              key={option.value}
                              className={`
                                flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer select-none
                                ${isSubTypesDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : field.value?.includes(option.value)
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30 hover:text-primary'
                                }
                              `}
                            >
                              <Checkbox
                                className="h-3.5 w-3.5"
                                color='primary'
                                disabled={isSubTypesDisabled}
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  if (isSubTypesDisabled) return
                                  const updatedValue = checked
                                    ? [...(field.value || []), option.value]
                                    : (field.value || []).filter((v) => v !== option.value)
                                  field.onChange(updatedValue)
                                }}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                        {isSubTypesDisabled && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Subtypes available with TR type only.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              {aircraftChecks.length > 1 && (
                <Button
                  type="button"
                  variant="soft"
                  color='destructive'
                  size="icon"
                  className="h-8 w-8 p-0 mt-6"
                  onClick={() => onRemove(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card >
  )
}

export default AircraftChecksSection