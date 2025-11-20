import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TrashIcon } from 'lucide-react'
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
    <Card className='border border-blue-200'>
      <CardHeader>
        <CardTitle>Personnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="addPersonnels"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  color='primary'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Add Personnel</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {addPersonnels && (
          <>
            <div className="space-y-4">
              <h4 className="font-medium">Staff Search & Selection</h4>
              <SearchableStaffSelect
                infoData={infoData}
                form={form}
                index={personnel.length} // Use current personnel length as next index
                onStaffSelect={(staff) => {
                  console.log('Selected staff:', staff)
                  // Add new personnel when staff is selected
                  onAdd()
                }}
              />
            </div>

            {personnel.length > 0 && (
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Personnel List ({personnel.length})</h4>
              </div>
            )}

            {/* personnel list */}
            {personnel.map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h5 className="font-medium">Personnel {index + 1}</h5>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    color='destructive'
                    onClick={() => onRemove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.staffId`}
                      render={({ field }) => (
                        <FormItem className='hidden'>
                          <FormLabel>ID *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Selected staff ID"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.staffCode`}
                      render={({ field }) => (
                        <FormItem >
                          <FormLabel>Staff Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Selected staff code"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-6">
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Selected staff name"
                              {...field}
                              readOnly
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <FormField
                      control={form.control}
                      name={`personnel.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                console.log("field.value:", field.value)
                                field.onChange(value)
                              }}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select maintenance type" />
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
                                    No staffs types available
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
                  <div className='col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4'>
                    <div className='col-span-6 flex flex-col'>
                      <div className=''>
                        <FormLabel>From *</FormLabel>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                        <div className='col-span-6'>
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
                        </div>
                        <FormField
                          control={form.control}
                          name={`personnel.${index}.formTime`}
                          render={({ field }) => (
                            <FormItem className='col-span-6'>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className='col-span-6 flex flex-col'>
                      <div className=''>
                        <FormLabel>To *</FormLabel>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                        <div className='col-span-6'>
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
                        </div>
                        <FormField
                          control={form.control}
                          name={`personnel.${index}.toTime`}
                          render={({ field }) => (
                            <FormItem className='col-span-6'>
                              <FormControl >
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>


                  <FormField
                    control={form.control}
                    name={`personnel.${index}.remark`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-12">
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card >
  )
}

export default PersonnelSection