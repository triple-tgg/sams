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
}

export const FluidSection: React.FC<FluidSectionProps> = ({
  form,
  onAddEngineOilSet,
  onRemoveEngineOilSet,
  onAddCsdIdgVsfgSet,
  onRemoveCsdIdgVsfgSet,
  acType,
}) => {
  const servicingPerformed = form.watch('servicingPerformed')
  const engOilSets = form.watch('fluid.engOilSets')
  const csdIdgVsfgSets = form.watch('fluid.csdIdgVsfgSets')

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
                      form.setValue('fluid.engOilSets', [])
                      form.setValue('fluid.csdIdgVsfgSets', [])
                    } else {
                      onAddEngineOilSet()
                      onAddCsdIdgVsfgSet()
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeader
                  icon={<Gauge className="h-4 w-4" />}
                  title="Engine Oil"
                  count={engOilSets.length}
                />
                {engOilSets.length < 4 && (
                  <AddItemButton onClick={onAddEngineOilSet} label="Add Set" />
                )}
              </div>

              {engOilSets.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No engine oil sets added.</p>
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

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`fluid.engOilSets.${index}.left`}
                        render={({ field: { value, onChange, ...field } }) => (
                          <FormItem className="space-y-0">
                            <FormLabel className="text-xs text-muted-foreground">Left Engine</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`fluid.engOilSets.${index}.right`}
                        render={({ field: { value, onChange, ...field } }) => (
                          <FormItem className="space-y-0">
                            <FormLabel className="text-xs text-muted-foreground">Right Engine</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {engOilSets.length > 1 && (
                      <RemoveItemButton onClick={() => onRemoveEngineOilSet(index)} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── CSD/IDG/VSFG ── */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <SectionHeader
                  icon={<Gauge className="h-4 w-4" />}
                  title="CSD/IDG/VSFG 1"
                  count={csdIdgVsfgSets.length}
                />
                {csdIdgVsfgSets.length < 4 && (
                  <AddItemButton onClick={onAddCsdIdgVsfgSet} label="Add Set" />
                )}
              </div>

              {csdIdgVsfgSets.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No CSD/IDG/VSFG sets added.</p>
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

                    {csdIdgVsfgSets.length > 1 && (
                      <RemoveItemButton onClick={() => onRemoveCsdIdgVsfgSet(index)} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Hydraulic Oils ── */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <SectionHeader
                icon={<Droplets className="h-4 w-4" />}
                title="Hydraulic Oils"
              />

              {!acType ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>Please fill in the <strong>Aircraft Type</strong> in the flight information to display Hydraulic oil fields.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Airbus (A-type): Blue, Green, Yellow */}
                  {acType.toLowerCase().startsWith('a') && (
                    <>
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
                    </>
                  )}

                  {/* Boeing (B-type): A, B, STBY */}
                  {acType.toLowerCase().startsWith('b') && (
                    <>
                      <FormField
                        control={form.control}
                        name="fluid.hydOilA"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Hyd Oil A</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fluid.hydOilB"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Hyd Oil B</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fluid.hydOilSTBY"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs text-muted-foreground">Hyd Oil STBY</FormLabel>
                            <FormControl>
                              <NumberInput value={value} onChange={onChange} field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Unknown type */}
                  {!acType.toLowerCase().startsWith('a') && !acType.toLowerCase().startsWith('b') && (
                    <div className="md:col-span-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
                      <strong>Aircraft Type:</strong> {acType} — Hydraulic oil configuration not defined.
                      <br />
                      <span className="text-xs">Supported: "A" (Blue/Green/Yellow) or "B" (A/B/STBY)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── APU Oil + Fuel (grouped 3-col) ── */}
            <div className="space-y-3 pt-4 border-t border-dashed">
              <SectionHeader
                icon={<Fuel className="h-4 w-4" />}
                title="APU Oil & Fuel"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="fluid.otherOil"
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
                <FormField
                  control={form.control}
                  name="fluid.rampFuelKgs"
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
                  name="fluid.actualUpliftLts"
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
