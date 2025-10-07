import React, { useState, useRef, useEffect } from 'react'
import { Control, UseFormRegister, UseFormWatch, UseFormSetValue, Controller, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Trash, Search, Plus, Check } from "lucide-react"
import { EquipmentFormData } from './types'
import { useEquipmentSearch } from '@/lib/api/hooks/useEquipment'
import { dateTimeUtils } from '@/lib/dayjs'
import dayjs from 'dayjs'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { convertDateToBackend } from '@/lib/utils/formatPicker'
import { Textarea } from '@/components/ui/textarea'

interface EquipmentCardProps {
  index: number
  control: Control<EquipmentFormData>
  register: UseFormRegister<EquipmentFormData>
  watch: UseFormWatch<EquipmentFormData>
  setValue: UseFormSetValue<EquipmentFormData>
  onRemove: (index: number) => void
  canRemove: boolean
  errors?: FieldErrors<EquipmentFormData>
}

// Error display component
const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null
  return (
    <span className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <span className="w-3 h-3 text-red-500">⚠</span>
      {message}
    </span>
  )
}

const EquipmentNameDropdown: React.FC<{
  value: string
  onChange: (value: string) => void
  error?: string
  index: number
}> = ({ value, onChange, error, index }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use equipment search hook
  const { equipmentList, searchEquipment, isLoading } = useEquipmentSearch()

  // Get filtered equipment based on search term
  const filteredEquipment = searchTerm ? searchEquipment(searchTerm) : equipmentList

  // Check if current search term exists in equipment list
  const isExistingEquipment = equipmentList.some(eq =>
    eq.code.toLowerCase() === searchTerm.toLowerCase()
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle selection
  const handleSelect = (equipmentCode: string) => {
    setSearchTerm(equipmentCode)
    onChange(equipmentCode)
    setIsOpen(false)
  }

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  // Handle create new equipment
  const handleCreateNew = () => {
    onChange(searchTerm)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          id={`equipments.${index}.equipmentName`}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search or enter equipment name..."
          className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${error ? 'border-red-500 bg-red-50' : ''
            }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Loading equipment...
            </div>
          )}

          {!isLoading && filteredEquipment.length === 0 && searchTerm && (
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2 text-left px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                <Plus className="h-4 w-4" />
                <span>Add new equipment: &ldquo;<strong>{searchTerm}</strong>&rdquo;</span>
              </button>
            </div>
          )}

          {!isLoading && filteredEquipment.length > 0 && (
            <>
              {filteredEquipment.map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => handleSelect(equipment.code)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {equipment.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {equipment.id}
                    </div>
                  </div>
                  {equipment.code.toLowerCase() === searchTerm.toLowerCase() && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </button>
              ))}

              {/* Add new option if search term doesn't match exactly */}
              {searchTerm && !isExistingEquipment && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add new equipment: &ldquo;<strong>{searchTerm}</strong>&rdquo;</span>
                  </button>
                </div>
              )}
            </>
          )}

          {!isLoading && filteredEquipment.length === 0 && !searchTerm && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Start typing to search equipment...
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      {searchTerm && (
        <div className="mt-1 text-xs">
          {isExistingEquipment ? (
            <span className="text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Existing equipment
            </span>
          ) : (
            <span className="text-blue-600 flex items-center gap-1">
              <Plus className="h-3 w-3" />
              New equipment (will be created)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  index,
  control,
  register,
  watch,
  setValue,
  onRemove,
  canRemove,
  errors
}) => {
  // Get specific equipment errors
  const equipmentErrors = errors?.equipments?.[index]

  // Watch for changes in date/time fields to auto-calculate hours
  const fromDate = watch(`equipments.${index}.fromDate`)
  const fromTime = watch(`equipments.${index}.fromTime`)
  const toDate = watch(`equipments.${index}.toDate`)
  const toTime = watch(`equipments.${index}.toTime`)
  const isLoan = watch(`equipments.${index}.isLoan`)

  // Function to calculate hours between two UTC date/time combinations
  const calculateHours = (fromDate: string, fromTime: string, toDate: string, toTime: string): string => {
    try {
      // Validate that all fields have values
      if (!fromDate || !fromTime || !toDate || !toTime) {
        return ''
      }

      // Create datetime strings in ISO format (treating as UTC)
      const fromDateTime = `${fromDate}T${fromTime}:00`
      const toDateTime = `${toDate}T${toTime}:00`

      // Parse with Day.js
      const from = dayjs(fromDateTime)
      const to = dayjs(toDateTime)

      // Validate that dates are valid
      if (!from.isValid() || !to.isValid()) {
        return ''
      }

      // Calculate difference in hours
      const diffInHours = to.diff(from, 'hour', true) // true for precise decimal
      const diffInMinutes = to.diff(from, 'minute') // 90
      // Return empty if negative (to is before from)
      if (diffInHours < 0) {
        return ''
      }
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = diffInMinutes % 60
      console.log(`${hours}:${minutes}`)

      // Format to 1 decimal place
      return diffInHours.toFixed(1)
    } catch (error) {
      console.error('Error calculating hours:', error)
      return ''
    }
  }

  // Auto-calculate hours when date/time fields change
  useEffect(() => {
    const calculatedHours = calculateHours(convertDateToBackend(fromDate), fromTime, convertDateToBackend(toDate), toTime)
    if (calculatedHours !== '') {
      setValue(`equipments.${index}.hrs`, calculatedHours)
    }
  }, [fromDate, fromTime, toDate, toTime, setValue, index])

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative ml-4">
      {/* Remove Button */}
      {canRemove && (
        <div className="absolute top-4 right-4">
          <Button
            type="button"
            variant="soft"
            size="sm"
            color="destructive"
            onClick={() => onRemove(index)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Card Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Equipment #{index + 1}</h3>
        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
      </div>

      {/* Switches Section */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Equipment Classification</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <Label htmlFor={`equipments.${index}.isSamsTool`} className="text-sm font-medium text-gray-700">
                SAMS TOOL
              </Label>
            </div>
            <Controller
              control={control}
              name={`equipments.${index}.isSamsTool` as const}
              render={({ field }) => (
                <Switch
                  id={`equipments.${index}.isSamsTool`}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    // Set SAMS TOOL to new state
                    field.onChange(checked)
                    // Set LOAN to opposite state
                    setValue(`equipments.${index}.isLoan`, !checked)
                  }}
                />
              )}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Label htmlFor={`equipments.${index}.isLoan`} className="text-sm font-medium text-gray-700">
                LOAN
              </Label>
            </div>
            <Controller
              control={control}
              name={`equipments.${index}.isLoan` as const}
              render={({ field }) => (
                <Switch
                  id={`equipments.${index}.isLoan`}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    // Set LOAN to new state
                    field.onChange(checked)
                    // Set SAMS TOOL to opposite state
                    setValue(`equipments.${index}.isSamsTool`, !checked)
                  }}
                />
              )}
            />
          </div>
          {isLoan && (
            <div className="col-span-2">
              <Label htmlFor={`equipments.${index}.svc`} className="text-sm font-medium text-gray-700 mb-2 block">
                Loan Remark
              </Label>
              <Textarea
                id={`equipments.${index}.loanRemark`}
                {...register(`equipments.${index}.loanRemark` as const)}
                placeholder="Enter loan remark"
                className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${equipmentErrors?.loanRemark ? 'border-red-500 bg-red-50' : ''
                  }`}
              />
              <FieldError message={equipmentErrors?.loanRemark?.message} />
            </div>
          )}
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid lg:grid-cols-6 gap-4">
        {/* Equipment Name - Searchable Dropdown */}
        <div className="col-span-4">
          <Label htmlFor={`equipments.${index}.equipmentName`} className="text-sm font-medium text-gray-700 mb-2 block">
            Equipment Name <span className="text-red-500">*</span>
          </Label>
          <EquipmentNameDropdown
            value={watch(`equipments.${index}.equipmentName`) || ''}
            onChange={(value) => setValue(`equipments.${index}.equipmentName`, value)}
            error={equipmentErrors?.equipmentName?.message}
            index={index}
          />
          <FieldError message={equipmentErrors?.equipmentName?.message} />
        </div>
        {/* SVC Quantity */}
        <div className="col-span-1">
          <Label htmlFor={`equipments.${index}.svc`} className="text-sm font-medium text-gray-700 mb-2 block">
            Service Qty
          </Label>
          <Input
            id={`equipments.${index}.svc`}
            type="text"
            {...register(`equipments.${index}.svc` as const)}
            placeholder="0"
            className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${equipmentErrors?.svc ? 'border-red-500 bg-red-50' : ''
              }`}
          />
          <FieldError message={equipmentErrors?.svc?.message} />
        </div>
        {/* HRS - Auto-calculated */}
        <div className="col-span-1">
          <Label htmlFor={`equipments.${index}.hrs`} className="text-sm font-medium text-gray-700 mb-2 block">
            Hours (HRS) <span className="text-xs text-gray-400 font-normal">(Auto)</span>
          </Label>
          <Input
            disabled
            id={`equipments.${index}.hrs`}
            type="text"
            {...register(`equipments.${index}.hrs` as const)}
            placeholder="Auto-calculated"
            className={`bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${equipmentErrors?.hrs ? 'border-red-500 bg-red-50' : ''
              }`}
          />
          <FieldError message={equipmentErrors?.hrs?.message} />
        </div>


      </div>

      {/* Date/Time Range Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Operational Period (UTC) <span className="text-red-500">*</span></h4>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* From (UTC) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">From (UTC) <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name={`equipments.${index}.fromDate` as const}
                  render={({ field }) => (
                    <CustomDateInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={"DD/MMM/YYYY"}
                    />
                  )}
                />
                <FieldError message={equipmentErrors?.fromDate?.message} />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Time <span className="text-red-500">*</span></Label>
                <Input
                  id={`equipments.${index}.fromTime`}
                  type="time"
                  {...register(`equipments.${index}.fromTime` as const)}
                  placeholder="00:00"
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${equipmentErrors?.fromTime ? 'border-red-500 bg-red-50' : ''
                    }`}
                />
                <FieldError message={equipmentErrors?.fromTime?.message} />
              </div>
            </div>
          </div>

          {/* To (UTC) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">To (UTC) <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name={`equipments.${index}.toDate` as const}
                  render={({ field }) => (
                    <CustomDateInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={"DD/MMM/YYYY"}
                    />
                  )}
                />
                <FieldError message={equipmentErrors?.toDate?.message} />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Time <span className="text-red-500">*</span></Label>
                <Input
                  id={`equipments.${index}.toTime`}
                  type="time"
                  {...register(`equipments.${index}.toTime` as const)}
                  placeholder="00:00"
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${equipmentErrors?.toTime ? 'border-red-500 bg-red-50' : ''
                    }`}
                />
                <FieldError message={equipmentErrors?.toTime?.message} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
