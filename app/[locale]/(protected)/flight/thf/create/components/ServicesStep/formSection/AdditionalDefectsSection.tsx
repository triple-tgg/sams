import React, { useState } from 'react'
import { FieldPath, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, AlertTriangle, TrashIcon, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // Auto-expand newly added items
  const handleAdd = () => {
    const nextIndex = additionalDefects.length
    setExpandedItems(prev => ({ ...prev, [nextIndex]: true }))
    onAdd()
  }

  return (
    <Card className="rounded-xl shadow-sm border-l-4 border-l-rose-500 border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          Additional Defect Rectification
          {additionalDefectRectification && additionalDefects.length > 0 && (
            <Badge color="default" className="ml-1 text-xs px-1.5 py-0 h-5">
              {additionalDefects.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="additionalDefectRectification"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  color='primary'
                  checked={field.value}
                  onCheckedChange={() => {
                    field.onChange(!field.value)
                    if (field.value) {
                      form.setValue('additionalDefects', [])
                    } else {
                      handleAdd()
                    }
                  }}
                />
              </FormControl>
              <FormLabel className="text-sm font-medium cursor-pointer">
                Enable Additional Defect Rectification
              </FormLabel>
            </FormItem>
          )}
        />

        {additionalDefectRectification && (
          <div className="space-y-3">
            {additionalDefects.length >= 6 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>Maximum 6 defects allowed.</span>
              </div>
            )}

            {additionalDefects.map((defect, index) => {
              const isExpanded = expandedItems[index] !== false // Default to expanded
              const defectSummary = (form.getValues(`additionalDefects.${index}.defect` as FieldPath<ServicesFormInputs>) as string) || `Defect ${index + 1}`

              return (
                <div
                  key={index}
                  className="bg-gray-50/80 rounded-lg overflow-hidden hover:bg-gray-100/80 transition-colors"
                >
                  {/* Collapsible Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(index)}
                  >
                    <Badge color="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {typeof defectSummary === 'string' && defectSummary.length > 0 ? defectSummary : `Defect ${index + 1}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {additionalDefects.length > 1 && (<Button
                        type="button"
                        variant="ghost"
                        color="destructive"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(index)
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-200/60">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.defect` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Defect Details *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the defect..."
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="min-h-[72px] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.ataChapter` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">ATA Chapter *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., 32-41-00"
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="min-h-[72px] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.acDefect` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">A/C Defect</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter A/C defect details..."
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="min-h-[72px] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.action` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Action</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter action taken..."
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="min-h-[72px] resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.laeMH` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">LAE MH</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="h-9"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.mechMH` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Mech MH</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="h-9"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`additionalDefects.${index}.technicalDelay` as FieldPath<ServicesFormInputs>}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2 space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Technical Delay</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter technical delay..."
                                  {...field}
                                  value={(field.value as unknown as string) ?? ''}
                                  className="h-9"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex justify-end">
              {additionalDefects.length < 6 && (
                <Button
                  type="button"
                  variant="soft"
                  color="primary"
                  size="sm"
                  onClick={handleAdd}
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  Add Defect
                </Button>
              )}
            </div>
          </div>
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
