import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, XIcon } from 'lucide-react'
import { ServicesFormInputs } from '../types'
import { StaffTypeOption } from '@/lib/api/hooks/useStaffsTypes'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import SearchableStaffSelect from './SearchableStaffSelect'

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
                  console.log('Selected staff:', staff)
                  onAdd()
                }}
              />
            </div>

            {/* Personnel List */}
            {personnel.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Personnel List ({personnel.length})
                </h4>

                {personnel.map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-50/80 rounded-lg p-4 space-y-3 hover:bg-gray-100/80 transition-colors"
                  >
                    {/* Row 1: Badge + Staff Code + Name + Type + Remove */}
                    <div className="flex items-start gap-3">
                      <Badge color="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold shrink-0 mt-6">
                        {index + 1}
                      </Badge>

                      <div className="flex-1 grid grid-cols-12 gap-3">
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

                        {/* Staff Code */}
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`personnel.${index}.staffCode`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Staff Code *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Code"
                                    {...field}
                                    readOnly
                                    className="bg-white/50 h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Name */}
                        <div className="col-span-5">
                          <FormField
                            control={form.control}
                            name={`personnel.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-xs text-muted-foreground">Name *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Staff name"
                                    {...field}
                                    readOnly
                                    className="bg-white/50 h-9"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Type */}
                        <div className="col-span-4">
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
                                        <SelectValue placeholder="Select type" />
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
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive mt-6"
                        onClick={() => onRemove(index)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Row 2: From / To Date-Time */}
                    <div className="grid grid-cols-2 gap-4 ml-9">
                      {/* From */}
                      <div className="space-y-1.5">
                        <FormLabel className="text-xs text-muted-foreground font-medium">From *</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          <Controller
                            name={`personnel.${index}.formDate`}
                            control={form.control}
                            render={({ field }) => (
                              <CustomDateInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="DD-MMM-YYYY"
                              />
                            )}
                          />
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

                      {/* To */}
                      <div className="space-y-1.5">
                        <FormLabel className="text-xs text-muted-foreground font-medium">To *</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          <Controller
                            name={`personnel.${index}.toDate`}
                            control={form.control}
                            render={({ field }) => (
                              <CustomDateInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="DD-MMM-YYYY"
                              />
                            )}
                          />
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

                    {/* Row 3: Remark */}
                    <div className="ml-9">
                      <FormField
                        control={form.control}
                        name={`personnel.${index}.remark`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Remark</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Additional notes"
                                {...field}
                                className="min-h-[56px] resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PersonnelSection