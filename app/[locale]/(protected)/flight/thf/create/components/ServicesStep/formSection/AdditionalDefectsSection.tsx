import React from 'react'
import { FieldPath, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, TrashIcon } from 'lucide-react'
import { ServicesFormInputs } from '../types'
import { AdditionalDefectAttachFile } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import PhotoUploadField from '../upload/PhotoUploadField'


export const AdditionalDefectsSection: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  onAdd: () => void
  onRemove: (index: number) => void
  thfNumber: string
}> = ({ form, onAdd, onRemove, thfNumber }) => {
  const additionalDefectRectification = form.watch('additionalDefectRectification')
  const additionalDefects = form.watch('additionalDefects') || []
  console.log("additionalDefects", additionalDefects)
  return (
    <Card className='border border-blue-200'>
      <CardHeader>
        <CardTitle>Additional Defect Rectification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="additionalDefectRectification"
          render={({ field }) => {
            return (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    color='primary'
                    checked={field.value}
                    onCheckedChange={() => {
                      field.onChange(!field.value)
                      // Clear defects if unchecked
                      if (field.value) {
                        form.setValue('additionalDefects', [])
                      } else {
                        onAdd() // Add initial defect when enabling
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Enable Additional Defect Rectification</FormLabel>
                </div>
              </FormItem>
            )
          }}
        />

        {additionalDefectRectification && (
          <>
            {additionalDefects.length >= 6 && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Maximum 6 defects allowed. Remove an existing defect to add a new one.</span>
                </div>
              </div>
            )}

            {additionalDefects.map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Defect {index + 1}</h5>
                  {additionalDefects.length > 1 ? (
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      color="destructive"
                      onClick={() => onRemove(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.defect` as FieldPath<ServicesFormInputs>}
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Defect Details *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the defect..." {...field} value={(field.value as unknown as string) ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.ataChapter` as FieldPath<ServicesFormInputs>}
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>ATA Chapter *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., 32-41-00" {...field} value={(field.value as unknown as string) ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.laeMH` as FieldPath<ServicesFormInputs>}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LAE MH</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.5} placeholder="0.0" {...field} value={(field.value as unknown as string) ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`additionalDefects.${index}.mechMH` as FieldPath<ServicesFormInputs>}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mech MH</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.5} placeholder="0.0" {...field} value={(field.value as unknown as string) ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <PhotoUploadField
                    thfNumber={thfNumber}
                    form={form}
                    fieldName={`additionalDefects.${index}.attachFiles`}
                    label="Attach Files"
                    value={getActiveFile(form.getValues(`additionalDefects.${index}.attachFiles` as FieldPath<ServicesFormInputs>) as AdditionalDefectAttachFile[] | null) || null}
                  />
                  {/* 
                  <PhotoUploadField
                    thfNumber={thfNumber}
                    form={form}
                    fieldName={`additionalDefects.${index}.attachFiles`}
                    label="Attach Files"
                    value={form.getValues(`additionalDefects.${index}.attachFiles`) || null}
                  /> */}
                </div>
                <div className="flex justify-end"></div>
              </div>
            ))}
            <div className="flex justify-end items-center">
              {/* <h4 className="font-medium">Defects List</h4> */}
              {additionalDefects.length < 6 && (
                <Button type="button" onClick={onAdd} size="sm" color='primary' >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Defect
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


export default AdditionalDefectsSection


function getActiveFile(
  data: Array<{ isDelete: boolean }> | null
): any | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const found = data.find(item => item.isDelete === false);
  return found ?? null;
}
