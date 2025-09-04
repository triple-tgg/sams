import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, TrashIcon, RefreshCw } from 'lucide-react'
import { ServicesFormInputs, transformAircraftCheckTypesToOptions, transformAircraftCheckSubTypesToOptions } from './types'
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'

interface EnhancedAircraftChecksSectionProps {
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
}

export const EnhancedAircraftChecksSection: React.FC<EnhancedAircraftChecksSectionProps> = ({ 
  form, 
  onAdd, 
  onRemove 
}) => {
  const aircraftChecks = form.watch('aircraftChecks')
  
  // Fetch master data
  const {
    checkTypes,
    checkSubTypes,
    isLoading,
    isError,
    error,
    refetchAll
  } = useAircraftCheckMasterData()

  // Transform master data to dropdown options
  const maintenanceTypeOptions = transformAircraftCheckTypesToOptions(checkTypes)
  const maintenanceSubTypeOptions = transformAircraftCheckSubTypesToOptions(checkSubTypes)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <span>Aircraft Checks</span>
          {isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          )}
          {isError && (
            <span className="text-xs text-red-500 font-normal">
              (Master data error)
            </span>
          )}
        </CardTitle>
        <div className="flex space-x-2">
          {isError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refetchAll}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          <Button type="button" onClick={onAdd} size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show loading/error states */}
        {isLoading && !checkTypes.length && (
          <div className="text-center py-4 text-sm text-gray-500">
            Loading maintenance types...
          </div>
        )}
        
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-sm text-red-600">
              Failed to load master data: {error?.message}
            </div>
          </div>
        )}

        {aircraftChecks.map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Check {index + 1}</h4>
              {aircraftChecks.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoading 
                              ? "Loading..." 
                              : "Select maintenance type"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maintenanceTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`aircraftChecks.${index}.maintenanceSubTypes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Types</FormLabel>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {isLoading ? (
                        <div className="text-sm text-gray-500">Loading sub types...</div>
                      ) : maintenanceSubTypeOptions.length > 0 ? (
                        maintenanceSubTypeOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${index}-${option.value}`}
                              checked={field.value?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(field.value || []), option.value]
                                  : (field.value || []).filter((value) => value !== option.value)
                                field.onChange(updatedValue)
                              }}
                            />
                            <label
                              htmlFor={`${index}-${option.value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No sub types available</div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`aircraftChecks.${index}.laeMH`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LAE MH</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`aircraftChecks.${index}.mechMH`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mech MH</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
        
        {/* Master data info */}
        {checkTypes.length > 0 && (
          <div className="text-xs text-gray-500">
            Loaded {checkTypes.length} maintenance types and {checkSubTypes.length} sub types from master data
          </div>
        )}
      </CardContent>
    </Card>
  )
}
