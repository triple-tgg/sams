import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, TrashIcon } from 'lucide-react'
import { ServicesFormInputs, fluidOptions } from './types'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { FieldError } from '@/components/ui/field-error'
import NumberInputExamples from '@/components/ui/input.examples'

interface FluidSectionProps {
  form: UseFormReturn<ServicesFormInputs>
  onAddEngineOilSet: () => void
  onRemoveEngineOilSet: (index: number) => void
  acType?: string // Add acType prop
}

export const FluidSection: React.FC<FluidSectionProps> = ({
  form,
  onAddEngineOilSet,
  onRemoveEngineOilSet,
  acType,
}) => {
  const servicingPerformed = form.watch('servicingPerformed')
  const engOilSets = form.watch('fluid.engOilSets')


  return (
    <Card className='border border-blue-200'>
      <CardHeader>
        <CardTitle>Servicing Performed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="servicingPerformed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  color='primary'
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value)
                    if (field.value) {
                      form.setValue('fluid.engOilSets', [])
                    } else {
                      onAddEngineOilSet() // Add initial defect when enabling
                    }
                  }}

                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Fluid Servicing Performed</FormLabel>
              </div>
            </FormItem>
          )}
        />
        {/* <NumberInputExamples /> */}
        {servicingPerformed && (
          <div className="space-y-6">
            {/* Fluid Type */}
            <FormField
              control={form.control}
              name="fluid.fluidName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fluid Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const selectedFluid = fluidOptions.find(f => f.value === value)
                      field.onChange(selectedFluid || null)
                    }}
                    value={field.value?.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fluid type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fluidOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {field.value && (
                    <p className="text-sm text-gray-600 mt-1">
                      {field.value.value === 'ENG Oil' && `Engine Oil Sets section will be displayed (acType : ${acType})`}
                      {field.value.value === 'Hydraulic' && `Hydraulic Oils section will be displayed (acType : ${acType})`}
                      {field.value.value === 'APU Oil' && `Other Quantity section will be displayed (acType : ${acType})`}
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Engine Oil Sets - Show only when Fluid Type is "ENG Oil" */}
            {form.watch('fluid.fluidName')?.value === 'ENG Oil' && (
              <div className="space-y-4">
                {engOilSets.map((_, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium">Engine Set {index + 1}</h5>
                      {engOilSets.length > 1 && (
                        <Button
                          type="button"
                          variant="soft"
                          size="sm"
                          color='destructive'
                          onClick={() => onRemoveEngineOilSet(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`fluid.engOilSets.${index}.left`}
                        render={({ field: { value, onChange, ...field } }) => (
                          <FormItem>
                            <FormLabel>Left Engine</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                placeholder="0.0"
                                value={value || ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  onChange(val === '' ? undefined : parseFloat(val) || 0)
                                }}
                                // value={value ?? ''}
                                // onChange={(e) => {
                                //   const val = e.target.value;
                                //   onChange(val === '' ? undefined : parseFloat(val));
                                // }}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fluid.engOilSets.${index}.right`}
                        render={({ field: { value, onChange, ...field } }) => (
                          <FormItem>
                            <FormLabel>Right Engine</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                placeholder="0.0"
                                value={value || ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  onChange(val === '' ? undefined : parseFloat(val) || 0)
                                }}
                                // value={value ?? ''}
                                // onChange={(e) => {
                                //   const val = e.target.value;
                                //   onChange(val === '' ? undefined : parseFloat(val));
                                // }}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end items-center">
                  {/* <h4 className="font-medium">Engine Oil Sets</h4> */}
                  {engOilSets.length < 3 && (
                    <Button type="button" onClick={onAddEngineOilSet} size="sm" color='primary'>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Engine Set
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Hydraulic Oils - Show only when Fluid Type is "Hydraulic" */}
            {form.watch('fluid.fluidName')?.value === 'Hydraulic' && (
              <div className="space-y-4">
                <h4 className="font-medium">Hydraulic Oils </h4>

                {/* Check acType and show appropriate hydraulic oils */}
                {!acType ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Aircraft Type Required
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          Please fill in the Aircraft Type (acType) in the flight information to display the appropriate hydraulic oil fields.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Show Blue, Green, Yellow for aircraft types starting with "a" */}
                    {acType.toLowerCase().startsWith('a') && (
                      <>
                        {/* Hydraulic Blue Green Yellow*/}
                        <FormField
                          control={form.control}
                          name="fluid.hydOilBlue"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Hyd Oil Blue</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === '' ? undefined : parseFloat(val) || 0)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fluid.hydOilGreen"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Hyd Oil Green</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === '' ? undefined : parseFloat(val) || 0)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fluid.hydOilYellow"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Hyd Oil Yellow</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === '' ? undefined : parseFloat(val) || 0)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Show A, B, STBY for aircraft types starting with "b" */}
                    {acType.toLowerCase().startsWith('b') && (
                      <>
                        {/* Hydraulic A B STBY*/}
                        <FormField
                          control={form.control}
                          name="fluid.hydOilA"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Hyd Oil A</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === '' ? undefined : parseFloat(val) || 0)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fluid.hydOilB"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Hyd Oil B</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === '' ? undefined : parseFloat(val) || 0)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fluid.hydOilSTBY"
                          render={({ field: { onChange, value, ...field } }) => (
                            <FormItem>
                              <FormLabel>Hyd Oil STBY</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  placeholder="0.0"
                                  {...field}
                                  value={value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === '' ? undefined : parseFloat(val) || 0)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Show message if acType doesn't start with "a" or "b" */}
                    {!acType.toLowerCase().startsWith('a') && !acType.toLowerCase().startsWith('b') && (
                      <div className="md:col-span-3 bg-gray-50 border border-gray-200 rounded-md p-4">
                        <div className="text-sm text-gray-600">
                          <strong>Aircraft Type:</strong> {acType}
                          <br />
                          <span className="text-gray-500">
                            Hydraulic oil configuration not defined for this aircraft type.
                            <br />
                            Supported types: Aircraft types starting with &quot;A&quot; (Blue/Green/Yellow) or &quot;B&quot; (A/B/STBY).
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Other Quantity - Show only when Fluid Type is "APU Oil" */}
            {form.watch('fluid.fluidName')?.value === 'APU Oil' && (
              <FormField
                control={form.control}
                name="fluid.otherOil"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Other Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="0.0"
                        value={value || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          onChange(val === '' ? undefined : parseFloat(val) || 0)
                        }}
                        // value={value ?? ''}
                        // onChange={(e) => {
                        //   const val = e.target.value;
                        //   onChange(val === '' ? undefined : parseFloat(val));
                        // }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface OperationalSectionsProps {
  form: UseFormReturn<ServicesFormInputs>
  // onAddFlightDeckInfo: () => void
  // onRemoveFlightDeckInfo: (index: number) => void
  onAddTowingInfo: () => void
  onRemoveTowingInfo: (index: number) => void
}

export const OperationalSections: React.FC<OperationalSectionsProps> = ({
  form,
  // onAddFlightDeckInfo,
  // onRemoveFlightDeckInfo,
  onAddTowingInfo,
  onRemoveTowingInfo,
}) => {

  const aircraftTowing = form.watch('aircraftTowing')
  const aircraftTowingInfo = form.watch('aircraftTowingInfo') || []

  return (
    <div className="space-y-6">
      {/* Flight Deck */}
      <Card className='border border-blue-200'>
        <CardHeader>
          <CardTitle>Flight Deck</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="flightDeck"
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
                  <FormLabel>Flight Deck Operations</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Aircraft Towing */}
      <Card className='border border-blue-200'>
        <CardHeader>
          <CardTitle>Aircraft Towing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="aircraftTowing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    color='primary'
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value)
                      // Clear defects if unchecked
                      if (field.value) {
                        form.setValue('aircraftTowingInfo', [])
                      } else {
                        onAddTowingInfo() // Add initial defect when enabling
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aircraft Towing Operations</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {aircraftTowing && (
            <>

              {aircraftTowingInfo.length >= 3 && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Maximum 3 towing operations allowed. Remove an existing entry to add a new one.</span>
                  </div>
                </div>
              )}

              {aircraftTowingInfo.map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium">Info {index + 1}</h5>
                    {aircraftTowingInfo.length > 1 ? (
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        color='destructive'
                        onClick={() => onRemoveTowingInfo(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className='col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4'>
                      <div className='col-span-6 flex flex-col'>
                        <div className=''>
                          <FormLabel>From *</FormLabel>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                          <div className='col-span-6'>
                            <Controller
                              name={`aircraftTowingInfo.${index}.onDate`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <>
                                  <CustomDateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="DD-MMM-YYYY"
                                  />
                                  <FieldError msg={fieldState.error?.message} />
                                </>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`aircraftTowingInfo.${index}.onTime`}
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
                              name={`aircraftTowingInfo.${index}.offDate`}
                              control={form.control}
                              render={({ field, fieldState, formState }) => (
                                <>
                                  <CustomDateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="DD-MMM-YYYY"
                                  />
                                  <FieldError msg={fieldState.error?.message} />
                                </>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`aircraftTowingInfo.${index}.offTime`}
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
                      name={`aircraftTowingInfo.${index}.bayFrom`}
                      render={({ field }) => (
                        <FormItem className='col-span-3'>
                          <FormLabel>Bay From *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A1, B2, C3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`aircraftTowingInfo.${index}.bayTo`}
                      render={({ field }) => (
                        <FormItem className='col-span-3'>
                          <FormLabel>Bay To *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A1, B2, C3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end items-center">
                {/* <h4 className="font-medium">Towing Information</h4> */}
                {aircraftTowingInfo.length < 3 && (
                  <Button type="button" onClick={onAddTowingInfo} size="sm" color='primary'>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Info
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
