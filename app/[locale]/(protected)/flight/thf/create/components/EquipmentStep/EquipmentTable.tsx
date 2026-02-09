'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Control, UseFormWatch, UseFormSetValue, UseFormRegister, Controller, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Trash2, Plus, Search, Check, Wrench, Clock, ChevronDown } from 'lucide-react'
import { EquipmentFormData, Equipment } from './types'
import { useEquipmentSearch } from '@/lib/api/hooks/useEquipment'
import { CustomDateInput } from '@/components/ui/input-date/CustomDateInput'
import { convertDateToBackend } from '@/lib/utils/formatPicker'
import dayjs from 'dayjs'

// ── Error display component ──
const FieldError: React.FC<{ message?: string }> = ({ message }) => {
    if (!message) return null
    return (
        <span className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <span className="w-3 h-3 text-red-500">⚠</span>
            {message}
        </span>
    )
}

// ── Searchable Equipment Name Dropdown ──
const EquipmentNameDropdown: React.FC<{
    value: string
    onChange: (value: string) => void
    error?: string
    index: number
}> = ({ value, onChange, error, index }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState(value || '')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { equipmentList, searchEquipment, isLoading } = useEquipmentSearch()

    const filteredEquipment = searchTerm ? searchEquipment(searchTerm) : equipmentList
    const isExistingEquipment = equipmentList.some(eq =>
        eq.code.toLowerCase() === searchTerm.toLowerCase()
    )

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (code: string) => {
        setSearchTerm(code)
        onChange(code)
        setIsOpen(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setSearchTerm(newValue)
        onChange(newValue)
        setIsOpen(true)
    }

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
                    className={`pr-10 ${error ? 'border-red-500 bg-red-50' : ''}`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {isLoading && (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">Loading...</div>
                    )}

                    {!isLoading && filteredEquipment.length === 0 && searchTerm && (
                        <div className="px-3 py-2">
                            <button
                                type="button"
                                onClick={handleCreateNew}
                                className="w-full flex items-center gap-2 text-left px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add new: &ldquo;<strong>{searchTerm}</strong>&rdquo;</span>
                            </button>
                        </div>
                    )}

                    {!isLoading && filteredEquipment.length > 0 && (
                        <>
                            {filteredEquipment.slice(0, 10).map((eq) => (
                                <button
                                    key={eq.id}
                                    type="button"
                                    onClick={() => handleSelect(eq.code)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                                >
                                    <div className="text-sm font-medium text-gray-900">
                                        {eq.code}{eq.name ? ` - ${eq.name}` : ''}
                                    </div>
                                    {eq.code.toLowerCase() === searchTerm.toLowerCase() && (
                                        <Check className="h-4 w-4 text-green-500" />
                                    )}
                                </button>
                            ))}

                            {searchTerm && !isExistingEquipment && (
                                <div className="border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCreateNew}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add new: &ldquo;<strong>{searchTerm}</strong>&rdquo;</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {!isLoading && filteredEquipment.length === 0 && !searchTerm && (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            Start typing to search...
                        </div>
                    )}
                </div>
            )}

            {/* Status indicator */}
            {searchTerm && (
                <div className="mt-1 text-xs">
                    {isExistingEquipment ? (
                        <span className="text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Existing equipment
                        </span>
                    ) : (
                        <span className="text-blue-600 flex items-center gap-1">
                            <Plus className="h-3 w-3" /> New equipment
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Single Equipment Card ──
interface EquipmentCardItemProps {
    index: number
    control: Control<EquipmentFormData>
    register: UseFormRegister<EquipmentFormData>
    watch: UseFormWatch<EquipmentFormData>
    setValue: UseFormSetValue<EquipmentFormData>
    onRemove: (index: number) => void
    errors?: FieldErrors<EquipmentFormData>
}

const EquipmentCardItem: React.FC<EquipmentCardItemProps> = ({
    index,
    control,
    register,
    watch,
    setValue,
    onRemove,
    errors,
}) => {
    const [isOpen, setIsOpen] = useState(true)
    const equipmentErrors = (errors?.equipments as any)?.[index]
    const fromDate = watch(`equipments.${index}.fromDate`)
    const fromTime = watch(`equipments.${index}.fromTime`)
    const toDate = watch(`equipments.${index}.toDate`)
    const toTime = watch(`equipments.${index}.toTime`)
    const isLoan = watch(`equipments.${index}.isLoan`)
    const equipmentName = watch(`equipments.${index}.equipmentName`)

    // Auto-calculate hours
    const calculateHours = (fd: string, ft: string, td: string, tt: string): string => {
        try {
            if (!fd || !ft || !td || !tt) return ''
            const from = dayjs(`${fd}T${ft}:00`)
            const to = dayjs(`${td}T${tt}:00`)
            if (!from.isValid() || !to.isValid()) return ''
            const diffInHours = to.diff(from, 'hour', true)
            if (diffInHours < 0) return ''
            return diffInHours.toFixed(1)
        } catch {
            return ''
        }
    }

    useEffect(() => {
        const hrs = calculateHours(
            convertDateToBackend(fromDate),
            fromTime,
            convertDateToBackend(toDate),
            toTime
        )
        if (hrs !== '') {
            setValue(`equipments.${index}.hrs`, hrs)
        }
    }, [fromDate, fromTime, toDate, toTime, setValue, index])

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Wrench className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900">Equipment #{index + 1}</h3>
                                {!isOpen && equipmentName && (
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">— {equipmentName}</span>
                                )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 ml-2 shrink-0"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Remove</span>
                    </Button>
                </div>

                <CollapsibleContent>
                    <div className="p-5 space-y-5">
                        {/* ── Section 1: Equipment Info ── */}
                        <div className="grid grid-cols-6 gap-4">
                            {/* Equipment Name - 4 cols */}
                            <div className="col-span-4">
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
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

                            {/* SVC - 1 col */}
                            <div className="col-span-1">
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    Service Qty
                                </Label>
                                <Input
                                    type="text"
                                    {...register(`equipments.${index}.svc` as const)}
                                    placeholder="0"
                                    className={equipmentErrors?.svc ? 'border-red-500 bg-red-50' : ''}
                                />
                                <FieldError message={equipmentErrors?.svc?.message} />
                            </div>

                            {/* HRS - 1 col (auto) */}
                            <div className="col-span-1">
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    HRS <span className="text-[10px] text-gray-400 font-normal">(Auto)</span>
                                </Label>
                                <Input
                                    disabled
                                    type="text"
                                    {...register(`equipments.${index}.hrs` as const)}
                                    placeholder="—"
                                    className="bg-gray-50 text-gray-500"
                                />
                            </div>
                        </div>

                        {/* ── Section 2: Operational Period ── */}
                        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Operational Period (UTC) <span className="text-red-500">*</span>
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* From */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-600">From</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px] text-gray-400 mb-1 block">Date</Label>
                                            <Controller
                                                control={control}
                                                name={`equipments.${index}.fromDate` as const}
                                                render={({ field }) => (
                                                    <CustomDateInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="DD/MMM/YYYY"
                                                    />
                                                )}
                                            />
                                            <FieldError message={equipmentErrors?.fromDate?.message} />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-gray-400 mb-1 block">Time</Label>
                                            <Input
                                                type="time"
                                                {...register(`equipments.${index}.fromTime` as const)}
                                                className={equipmentErrors?.fromTime ? 'border-red-500 bg-red-50' : ''}
                                            />
                                            <FieldError message={equipmentErrors?.fromTime?.message} />
                                        </div>
                                    </div>
                                </div>

                                {/* To */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-600">To</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px] text-gray-400 mb-1 block">Date</Label>
                                            <Controller
                                                control={control}
                                                name={`equipments.${index}.toDate` as const}
                                                render={({ field }) => (
                                                    <CustomDateInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="DD/MMM/YYYY"
                                                    />
                                                )}
                                            />
                                            <FieldError message={equipmentErrors?.toDate?.message} />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-gray-400 mb-1 block">Time</Label>
                                            <Input
                                                type="time"
                                                {...register(`equipments.${index}.toTime` as const)}
                                                className={equipmentErrors?.toTime ? 'border-red-500 bg-red-50' : ''}
                                            />
                                            <FieldError message={equipmentErrors?.toTime?.message} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Classification ── */}
                        <div className="flex flex-wrap items-center gap-6">
                            {/* SAMS Tool */}
                            <Controller
                                control={control}
                                name={`equipments.${index}.isSamsTool`}
                                render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked)
                                                if (checked) {
                                                    setValue(`equipments.${index}.isLoan`, false)
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-gray-700 font-medium">SAMS Tool</span>
                                    </label>
                                )}
                            />

                            {/* Loan */}
                            <Controller
                                control={control}
                                name={`equipments.${index}.isLoan`}
                                render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked)
                                                if (checked) {
                                                    setValue(`equipments.${index}.isSamsTool`, false)
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Loan</span>
                                    </label>
                                )}
                            />
                        </div>

                        {/* Loan Remark (conditional) */}
                        {isLoan && (
                            <div>
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    Loan Remark
                                </Label>
                                <Textarea
                                    {...register(`equipments.${index}.loanRemark` as const)}
                                    placeholder="Enter loan remark..."
                                    rows={2}
                                    className={`resize-none ${equipmentErrors?.loanRemark ? 'border-red-500 bg-red-50' : ''}`}
                                />
                                <FieldError message={equipmentErrors?.loanRemark?.message} />
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}

// ── Main Equipment Card List ──
interface EquipmentTableProps {
    control: Control<EquipmentFormData>
    watch: UseFormWatch<EquipmentFormData>
    setValue: UseFormSetValue<EquipmentFormData>
    register: UseFormRegister<EquipmentFormData>
    errors: FieldErrors<EquipmentFormData>
    onAddEquipment: () => void
    onRemoveEquipment: (index: number) => void
    canAddMore: boolean
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({
    control,
    watch,
    setValue,
    register,
    errors,
    onAddEquipment,
    onRemoveEquipment,
    canAddMore,
}) => {
    const equipments = watch('equipments') || []

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {equipments.length} equipment{equipments.length !== 1 ? 's' : ''} added
                </p>
                {canAddMore && (
                    <Button
                        type="button"
                        onClick={onAddEquipment}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Equipment
                    </Button>
                )}
            </div>

            {/* Equipment Cards */}
            <div className="space-y-4">
                {equipments.map((_, index) => (
                    <EquipmentCardItem
                        key={index}
                        index={index}
                        control={control}
                        register={register}
                        watch={watch}
                        setValue={setValue}
                        onRemove={onRemoveEquipment}
                        errors={errors}
                    />
                ))}
            </div>
        </div>
    )
}

export default EquipmentTable
