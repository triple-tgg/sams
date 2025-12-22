import React, { useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { UseFormReturn } from 'react-hook-form'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { AircraftCheckSubType, AircraftCheckType } from '@/lib/api/master/aircraft-check-types/airlines.interface'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { ServicesFormInputs, transformAircraftCheckTypesToOptions, transformAircraftCheckSubTypesToOptions } from '../types'

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

  // Don't render if still loading critical data
  if (props.isLoadingCheckTypes) {
    return (
      <Card className='border border-blue-200'>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Aircraft Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading aircraft check types...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border border-blue-200'>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Aircraft Checks</CardTitle>
        <Button type="button" onClick={onAdd} size="sm" color='primary'>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Check
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {aircraftChecks.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Check {index + 1}</h4>
              {aircraftChecks.length > 1 && (
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  color="destructive"
                  onClick={() => onRemove(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`aircraftChecks.${index}.maintenanceTypes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        console.log("field.value:", field.value)
                        field.onChange(value)
                        // Clear sub types if TR is selected
                        if (value !== "TR") {
                          form.setValue(`aircraftChecks.${index}.maintenanceSubTypes`, [])
                        }
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maintenanceOptions && maintenanceOptions.length > 0 ? (
                          maintenanceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No maintenance types available
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
                  const isSubTypesDisabled = selectedMaintenanceType !== "TR"

                  return (
                    <FormItem>
                      <FormLabel>Sub Types</FormLabel>
                      <div className="space-y-2">
                        {subTypeOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              className=''
                              color='primary'
                              disabled={isSubTypesDisabled}
                              id={`${index}-${option.value}`}
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                console.log("onCheckedChange field.value:", checked, field.value)

                                if (isSubTypesDisabled) return
                                const updatedValue = checked
                                  ? [...(field.value || []), option.value]
                                  : (field.value || []).filter((value) => value !== option.value)
                                field.onChange(updatedValue)
                              }}
                            />
                            <label
                              htmlFor={`${index}-${option.value}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isSubTypesDisabled ? 'text-gray-400' : ''
                                }`}
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {isSubTypesDisabled && (
                        <p className="text-xs text-gray-400 mt-2">
                          **Subtypes can be used with TR maintenance types.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
export default AircraftChecksSection