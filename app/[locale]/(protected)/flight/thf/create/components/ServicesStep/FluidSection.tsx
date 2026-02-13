import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import {
  PlusIcon, TrashIcon, XIcon,
  Droplets, Fuel, Gauge, PlaneTakeoff, Truck, Wrench
} from 'lucide-react'
import { ServicesFormInputs } from './types'
import { AircraftTypeFlags } from '@/lib/api/master/aircraft-types/getAircraftTypeById'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { FieldError } from '@/components/ui/field-error'

// ─── Shared UI helpers ───────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ReactNode
  title: string
  count?: number
  accent?: string
}> = ({ icon, title, count }) => (
  <div className="flex items-center gap-2">
    <span className="text-primary">{icon}</span>
    <h4 className="font-semibold text-sm">{title}</h4>
    {count !== undefined && count > 0 && (
      <Badge color="default" className="ml-1 text-xs px-1.5 py-0 h-5">
        {count}
      </Badge>
    )}
  </div>
)

const AddItemButton: React.FC<{
  onClick: () => void
  label: string
  disabled?: boolean
}> = ({ onClick, label, disabled }) => (
  <Button
    type="button"
    color="primary"
    size="sm"
    variant="soft"
    onClick={onClick}
    disabled={disabled}
  >
    <PlusIcon className="h-3.5 w-3.5 mr-1" />
    {label}
  </Button>
)

const RemoveItemButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    type="button"
    variant="soft"
    size="icon"
    color='destructive'
    onClick={onClick}
  >
    <TrashIcon className="h-4 w-4" />
  </Button>
)

const NumberInput: React.FC<{
  value: any
  onChange: (v: number | undefined) => void
  placeholder?: string
  step?: number
  field?: any
}> = ({ value, onChange, placeholder = "0.0", step = 0.5, field }) => (
  <Input
    type="number"
    min={0}
    step={step}
    placeholder={placeholder}
    value={value || ''}
    onChange={(e) => {
      const val = e.target.value
      onChange(val === '' ? undefined : parseFloat(val) || 0)
    }}
    className="h-9"
    {...field}
  />
)

// ─── FluidSection ────────────────────────────────────────────────────

interface FluidSectionProps {
  form: UseFormReturn<ServicesFormInputs>
  onAddEngineOilSet: () => void
  onRemoveEngineOilSet: (index: number) => void
  onAddCsdIdgVsfgSet: () => void
  onRemoveCsdIdgVsfgSet: (index: number) => void
  acType?: string
  aircraftTypeFlags?: AircraftTypeFlags | null
  isLoadingFlags?: boolean
}

export const FluidSection: React.FC<FluidSectionProps> = ({
  form,
  onAddEngineOilSet,
  onRemoveEngineOilSet,
  onAddCsdIdgVsfgSet,
  onRemoveCsdIdgVsfgSet,
  acType,
  aircraftTypeFlags,
  isLoadingFlags,
}) => {
  const servicingPerformed = form.watch('servicingPerformed')
  const engOilSets = form.watch('fluid.engOilSets')
  const csdIdgVsfgSets = form.watch('fluid.csdIdgVsfgSets')

  // Compute max counts from flags (fallback to 4 if no flags)
  const maxEngineOilSets = 4
  const maxCsdSets = 4
  const minEngineOilSets = aircraftTypeFlags ? aircraftTypeFlags.engineCount : 0
  const minCsdSets = aircraftTypeFlags ? aircraftTypeFlags.csdCount : 0
  const showHydGreen = aircraftTypeFlags ? aircraftTypeFlags.flagHydrolicGreen : true
  const showHydBlue = aircraftTypeFlags ? aircraftTypeFlags.flagHydrolicBlue : true
  const showHydYellow = aircraftTypeFlags ? aircraftTypeFlags.flagHydrolicYellow : true
  const showApu = aircraftTypeFlags ? aircraftTypeFlags.flagApu : true

  return (
    <Card className="rounded-xl shadow-sm border-l-4 border-l-sky-500 border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="h-5 w-5 text-sky-500" />
          Servicing Performed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField
          control={form.control}
          name="servicingPerformed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  color='primary'
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value)
                    if (field.value) {

                    } else {

                    }
                  }}
                />
              </FormControl>
              <FormLabel className="text-sm font-medium cursor-pointer">
                Fluid Servicing Performed
              </FormLabel>
            </FormItem>
          )}
        />

        {servicingPerformed && (
          <div className="space-y-6">

            {/* ── Engine Oil Sets ── */}
            {maxEngineOilSets > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={<Gauge className="h-4 w-4" />}
                    title="Engine Oil"
                    count={engOilSets.length}
                  />
                  {engOilSets.length < maxEngineOilSets && (
                    <AddItemButton onClick={onAddEngineOilSet} label="Add Set" />
                  )}
                </div>

                {engOilSets.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No engine oil sets added.</p>
                )}

                {/* Error message for engine oil sets */}
                {form.formState.errors.fluid?.engOilSets?.message && (
                  <p className="text-xs text-red-500 font-medium" data-error-field="fluid.engOilSets">
                    {form.formState.errors.fluid.engOilSets.message}
                  </p>
                )}

                <div className="space-y-2">
                  {engOilSets.map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gray-50/80 rounded-lg px-3 py-2.5 group hover:bg-gray-100/80 transition-colors"
                    >
                      <Badge color="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold shrink-0">
                        {index + 1}
                      </Badge>

                      <div className="flex-1 flex items-end gap-3">
                        {/* Engine Selector Toggle */}
                        <FormField
                          control={form.control}
                          name={`fluid.engOilSets.${index}.selectedEngine`}
                          render={({ field: { value, onChange } }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs text-muted-foreground">Engine</FormLabel>
                              <div className="flex rounded-md border border-gray-300 overflow-hidden h-9">
                                <button
                                  type="button"
                                  className={`px-3 text-xs font-medium transition-colors ${value === 'left'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-white text-muted-foreground hover:bg-gray-50'
                                    }`}
                                  onClick={() => {
                                    if (value !== 'left') {
                                      const currentRight = form.getValues(`fluid.engOilSets.${index}.right`) || 0
                                      onChange('left')
                                      form.setValue(`fluid.engOilSets.${index}.left`, currentRight)
                                      form.setValue(`fluid.engOilSets.${index}.right`, 0)
                                    }
                                  }}
                                >
                                  Left
                                </button>
                                <button
                                  type="button"
                                  className={`px-3 text-xs font-medium transition-colors border-l border-gray-300 ${value === 'right'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-white text-muted-foreground hover:bg-gray-50'
                                    }`}
                                  onClick={() => {
                                    if (value !== 'right') {
                                      const currentLeft = form.getValues(`fluid.engOilSets.${index}.left`) || 0
                                      onChange('right')
                                      form.setValue(`fluid.engOilSets.${index}.right`, currentLeft)
                                      form.setValue(`fluid.engOilSets.${index}.left`, 0)
                                    }
                                  }}
                                >
                                  Right
                                </button>
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Single Quantity Input */}
                        {form.watch(`fluid.engOilSets.${index}.selectedEngine`) === 'left' ? (
                          <FormField
                            control={form.control}
                            name={`fluid.engOilSets.${index}.left`}
                            render={({ field: { value, onChange, ...field } }) => (
                              <FormItem className="space-y-1 flex-1">
                                <FormLabel className="text-xs text-muted-foreground">Left Engine (Qty)</FormLabel>
                                <FormControl>
                                  <NumberInput value={value} onChange={onChange} field={field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name={`fluid.engOilSets.${index}.right`}
                            render={({ field: { value, onChange, ...field } }) => (
                              <FormItem className="space-y-1 flex-1">
                                <FormLabel className="text-xs text-muted-foreground">Right Engine (Qty)</FormLabel>
                                <FormControl>
                                  <NumberInput value={value} onChange={onChange} field={field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {engOilSets.length > minEngineOilSets && (
                        <RemoveItemButton onClick={() => onRemoveEngineOilSet(index)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CSD/IDG/VSFG ── */}
            {maxCsdSets > 0 && (
              <div className="space-y-3 pt-4 border-t border-dashed">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={<Gauge className="h-4 w-4" />}
                    title="CSD/IDG/VSFG"
                    count={csdIdgVsfgSets.length}
                  />
                  {csdIdgVsfgSets.length < maxCsdSets && (
                    <AddItemButton onClick={onAddCsdIdgVsfgSet} label="Add Set" />
                  )}
                </div>

                {csdIdgVsfgSets.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No CSD/IDG/VSFG sets added.</p>
                )}

                {/* Error message for CSD/IDG/VSFG sets */}
                {form.formState.errors.fluid?.csdIdgVsfgSets?.message && (
                  <p className="text-xs text-red-500 font-medium" data-error-field="fluid.csdIdgVsfgSets">
                    {form.formState.errors.fluid.csdIdgVsfgSets.message}
                  </p>
                )}

                <div className="space-y-2">
                  {csdIdgVsfgSets.map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gray-50/80 rounded-lg px-3 py-2.5 group hover:bg-gray-100/80 transition-colors"
                    >
                      <Badge color="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold shrink-0">
                        {index + 1}
                      </Badge>

                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`fluid.csdIdgVsfgSets.${index}.quantity`}
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem className="space-y-0">
                              <FormLabel className="text-xs text-muted-foreground">Quantity</FormLabel>
                              <FormControl>
                                <NumberInput value={value} onChange={onChange} field={field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {csdIdgVsfgSets.length > minCsdSets && (
                        <RemoveItemButton onClick={() => onRemoveCsdIdgVsfgSet(index)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Hydraulic Oils ── */}
            {(showHydGreen || showHydBlue || showHydYellow) && (
              <div className="space-y-3 pt-4 border-t border-dashed">
                <SectionHeader
                  icon={<Droplets className="h-4 w-4" />}
                  title="Hydraulic Oils"
                />

                {isLoadingFlags ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500 animate-pulse">
                    Loading hydraulic oil configuration...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {showHydGreen && (
                      <FormField
                        control={form.control}
                        name="fluid.hydOilGreen"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Hyd Oil Green</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {showHydBlue && (
                      <FormField
                        control={form.control}
                        name="fluid.hydOilBlue"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Hyd Oil Blue</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {showHydYellow && (
                      <FormField
                        control={form.control}
                        name="fluid.hydOilYellow"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Hyd Oil Yellow</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── APU Oil + Fuel (grouped 3-col) ── */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <SectionHeader
                icon={<Fuel className="h-4 w-4" />}
                title={showApu ? "APU Oil & Fuel" : "Fuel"}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {showApu && (
                  <FormField
                    control={form.control}
                    name="fluid.apuOil"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs text-muted-foreground">APU Oil (Qty)</FormLabel>
                        <FormControl>
                          <NumberInput value={value} onChange={onChange} field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="fluid.rampFuel"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-muted-foreground">Ramp Fuel (KGs)</FormLabel>
                      <FormControl>
                        <NumberInput value={value} onChange={onChange} step={1} placeholder="0" field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fluid.actualUplift"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-muted-foreground">Actual Uplift (LTs)</FormLabel>
                      <FormControl>
                        <NumberInput value={value} onChange={onChange} step={1} placeholder="0" field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── OperationalSections ─────────────────────────────────────────────

interface OperationalSectionsProps {
  form: UseFormReturn<ServicesFormInputs>
  onAddTowingInfo: () => void
  onRemoveTowingInfo: (index: number) => void
}

export const OperationalSections: React.FC<OperationalSectionsProps> = ({
  form,
  onAddTowingInfo,
  onRemoveTowingInfo,
}) => {
  const aircraftTowing = form.watch('aircraftTowing')
  const aircraftTowingInfo = form.watch('aircraftTowingInfo') || []

  return (
    <div className="space-y-6">
      {/* Flight Deck */}
      <Card className="rounded-xl shadow-sm border-l-4 border-l-indigo-500 border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlaneTakeoff className="h-5 w-5 text-indigo-500" />
            Flight Deck
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="flightDeck"
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
                  Flight Deck Operations
                </FormLabel>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Aircraft Towing */}
      <Card className="rounded-xl shadow-sm border-l-4 border-l-amber-500 border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-amber-500" />
            Aircraft Towing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="aircraftTowing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    color='primary'
                    checked={field.value}
                    onCheckedChange={(value) => {
                      field.onChange(value)
                      if (field.value) {
                        form.setValue('aircraftTowingInfo', [])
                      } else {
                        onAddTowingInfo()
                      }
                    }}
                  />
                </FormControl>
                <FormLabel className="text-sm font-medium cursor-pointer">
                  Aircraft Towing Operations
                </FormLabel>
              </FormItem>
            )}
          />

          {/* Array-level error (e.g., "required when enabled", "max 3") */}
          {form.formState.errors.aircraftTowingInfo?.message && (
            <p className="text-sm text-red-500 mt-2">
              {form.formState.errors.aircraftTowingInfo.message}
            </p>
          )}
          {/* Root-level refine error (shown as root error on the array) */}
          {form.formState.errors.aircraftTowingInfo?.root?.message && (
            <p className="text-sm text-red-500 mt-2">
              {form.formState.errors.aircraftTowingInfo.root.message}
            </p>
          )}

          {aircraftTowing && (
            <div className="space-y-3">
              {aircraftTowingInfo.length >= 3 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Maximum 3 towing operations allowed.</span>
                </div>
              )}

              {aircraftTowingInfo.map((_, index) => (
                <div key={index} className="bg-gray-50/80 rounded-lg p-4 space-y-4 hover:bg-gray-100/80 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge color="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </Badge>
                      <h5 className="font-medium text-sm">Towing Info</h5>
                    </div>
                    {aircraftTowingInfo.length > 1 && (
                      <RemoveItemButton onClick={() => onRemoveTowingInfo(index)} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* From Date/Time */}
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs text-muted-foreground font-medium">From *</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
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
                        <FormField
                          control={form.control}
                          name={`aircraftTowingInfo.${index}.onTime`}
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

                    {/* To Date/Time */}
                    <div className="space-y-1.5">
                      <FormLabel className="text-xs text-muted-foreground font-medium">To *</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <Controller
                          name={`aircraftTowingInfo.${index}.offDate`}
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
                        <FormField
                          control={form.control}
                          name={`aircraftTowingInfo.${index}.offTime`}
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

                  {/* Cross-field error: Time off must be after time on */}
                  {(form.formState.errors.aircraftTowingInfo as any)?.[index]?.timeOf?.message && (
                    <p className="text-sm text-red-500">
                      {(form.formState.errors.aircraftTowingInfo as any)?.[index]?.timeOf?.message}
                    </p>
                  )}

                  {/* Bay From / Bay To */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`aircraftTowingInfo.${index}.bayFrom`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs text-muted-foreground">Bay From *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A1, B2" {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`aircraftTowingInfo.${index}.bayTo`}
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs text-muted-foreground">Bay To *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., A1, B2" {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                {aircraftTowingInfo.length < 3 && (
                  <AddItemButton onClick={onAddTowingInfo} label="Add Towing Info" />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Servicing */}
      <Card className="rounded-xl shadow-sm border-l-4 border-l-gray-400 border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-5 w-5 text-gray-500" />
            Other Servicing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="marshallingServicePerFlight"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs text-muted-foreground">Marshalling (per flight)</FormLabel>
                  <FormControl>
                    <NumberInput value={value} onChange={onChange} step={1} placeholder="0" field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
