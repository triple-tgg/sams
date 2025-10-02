import React from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, TrashIcon } from 'lucide-react'
import { PartsToolsFormInputs, defaultPartToolItem } from './types'
import { useStationsOptions } from '@/lib/api/hooks/useStations'
import { Plus } from 'lucide-react'
import PartsToolsNameDropdown from './PartsToolsNameDropdown'
import { Label } from '@/components/ui/label'

interface PartsToolsCardProps {
  form: UseFormReturn<PartsToolsFormInputs>
}

export const PartsToolsCard: React.FC<PartsToolsCardProps> = ({ form }) => {
  const { options: stationOptions, isLoading: isLoadingStations } = useStationsOptions()

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'partsTools',
  })

  const handleAddItem = () => {
    append(defaultPartToolItem)
  }

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Parts/Tools</h3>
              <p className="text-sm text-gray-600">
                {fields?.length || 0} of 20 maximum entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {fields?.length || 0}/20
            </div>
          </div>
        </div>
      </div>

      {/* Parts/Tools Items */}
      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* Item Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <h4 className="text-lg font-semibold">Parts/Tools #{index + 1}</h4>
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleRemoveItem(index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Classification Section */}
            <div className="mb-6">
              <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                <h5 className="font-medium mb-3">Parts/Tools Classification</h5>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 ">
                    <FormField
                      control={form.control}
                      name={`partsTools.${index}.isSamsTool`}
                      render={({ field }) => (
                        <FormItem className='w-full flex items-center space-x-2 justify-between'>
                          <div className="flex items-center space-x-1 m-0">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <FormLabel className="text-sm font-medium">SAMS TOOL</FormLabel>
                          </div>
                          <FormControl className=' m-0'>
                            <Switch
                              checked={field.value}
                              // onCheckedChange={field.onChange}
                              onCheckedChange={(checked) => {
                                // Set LOAN to new state
                                field.onChange(checked)
                                // Set SAMS TOOL to opposite state
                                form.setValue(`partsTools.${index}.isLoan`, !checked)
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <FormField
                      control={form.control}
                      name={`partsTools.${index}.isLoan`}
                      render={({ field }) => (
                        <FormItem className='w-full flex items-center space-x-2 justify-between'>
                          <div className="flex items-center space-x-1  m-0">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <FormLabel className="text-sm font-medium">LOAN</FormLabel>
                          </div>
                          <FormControl className=' m-0'>
                            <Switch
                              checked={field.value}
                              // onCheckedChange={field.onChange}
                              onCheckedChange={(checked) => {
                                // Set LOAN to new state
                                field.onChange(checked)
                                // Set SAMS TOOL to opposite state
                                form.setValue(`partsTools.${index}.isSamsTool`, !checked)
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Part/Tool Name */}
              <div className="col-span-1">
                <Label
                  htmlFor={`partsTools.${index}.pathToolName`}
                  className="text-sm font-medium text-gray-700 block mb-0"
                >
                  Parts/Tools Name <span className="text-red-500">*</span>
                </Label>
                <PartsToolsNameDropdown
                  value={form.watch(`partsTools.${index}.pathToolName`) || ''}
                  onChange={(value) => form.setValue(`partsTools.${index}.pathToolName`, value)}
                  error={form?.formState?.errors?.partsTools?.[index]?.pathToolName?.message}
                  index={index}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Service Qty */}
                <FormField
                  control={form.control}
                  name={`partsTools.${index}.qty`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Hours */}
                <FormField
                  control={form.control}
                  name={`partsTools.${index}.hrs`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours (HRS)</FormLabel>
                      <FormControl>
                        <Input
                          disabled
                          type="number"
                          // min="0"
                          // step="0.1"
                          placeholder="Auto-calculated"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Part No. */}
              <FormField
                control={form.control}
                name={`partsTools.${index}.pathToolNo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part No. (P/N)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter part number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Equipment No. */}
              <FormField
                control={form.control}
                name={`partsTools.${index}.equipmentNo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment No.</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter equipment number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Serial No. IN (Time ON equivalent) */}
              <FormField
                control={form.control}
                name={`partsTools.${index}.serialNoIn`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial IN </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter serial number IN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Serial No. OUT (Time OFF equivalent) */}
              <FormField
                control={form.control}
                name={`partsTools.${index}.serialNoOut`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial OUT</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter serial number OUT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* Operational Period */}
            <div>
              <h5 className="font-medium mb-3">Operational Period (UTC) <span className="text-red-500">*</span></h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From */}
                <div>
                  <FormLabel className="text-sm font-medium mb-2">From (UTC) <span className="text-red-500">*</span></FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FormLabel className="text-xs text-gray-600">Date <span className="text-red-500">*</span></FormLabel>
                      <FormField
                        control={form.control}
                        name={`partsTools.${index}.formDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="date"
                                placeholder="dd/mm/yyyy"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs text-gray-600">Time <span className="text-red-500">*</span></FormLabel>
                      <FormField
                        control={form.control}
                        name={`partsTools.${index}.formTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                placeholder="--:--"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* To */}
                <div>
                  <FormLabel className="text-sm font-medium mb-2">To (UTC) <span className="text-red-500">*</span></FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FormLabel className="text-xs text-gray-600">Date <span className="text-red-500">*</span></FormLabel>
                      <FormField
                        control={form.control}
                        name={`partsTools.${index}.toDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="date"
                                placeholder="dd/mm/yyyy"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs text-gray-600">Time <span className="text-red-500">*</span></FormLabel>
                      <FormField
                        control={form.control}
                        name={`partsTools.${index}.toTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                placeholder="--:--"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Add New Button */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            disabled={isLoadingStations || fields?.length >= 20}
            className="px-8 py-3 h-auto border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Part&Tools
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {fields?.length || 0}/20
            </span>
          </Button>
          {fields?.length >= 20 && (
            <p className="text-sm text-gray-500 mt-2">Maximum parts/tools entries reached</p>
          )}
        </div>
      </div>
    </div>
  )
}
