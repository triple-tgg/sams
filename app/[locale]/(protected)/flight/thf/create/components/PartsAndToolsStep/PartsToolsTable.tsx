'use client'

import React, { useState, useEffect } from 'react'
import { Control, UseFormWatch, UseFormSetValue, UseFormRegister, Controller, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Trash2, Plus, Clock, Package, Hash, ChevronDown } from 'lucide-react'
import { PartsToolsFormInputs } from './types'
import PartsToolsNameDropdown from './PartsToolsNameDropdown'
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

// ── Single Parts/Tools Card ──
interface PartsToolsCardItemProps {
    index: number
    control: Control<PartsToolsFormInputs>
    register: UseFormRegister<PartsToolsFormInputs>
    watch: UseFormWatch<PartsToolsFormInputs>
    setValue: UseFormSetValue<PartsToolsFormInputs>
    onRemove: (index: number) => void
    errors?: FieldErrors<PartsToolsFormInputs>
}

const PartsToolsCardItem: React.FC<PartsToolsCardItemProps> = ({
    index,
    control,
    register,
    watch,
    setValue,
    onRemove,
    errors,
}) => {
    const [isOpen, setIsOpen] = useState(true)
    const itemErrors = (errors?.partsTools as any)?.[index]
    const formDate = watch(`partsTools.${index}.formDate`)
    const formTime = watch(`partsTools.${index}.formTime`)
    const toDate = watch(`partsTools.${index}.toDate`)
    const toTime = watch(`partsTools.${index}.toTime`)
    const isLoan = watch(`partsTools.${index}.isLoan`)
    const partToolName = watch(`partsTools.${index}.pathToolName`)

    // Auto-calculate hours
    const calculateHours = (fd: string | null, ft: string | null, td: string | null, tt: string | null): number => {
        try {
            if (!fd || !ft || !td || !tt) return 0
            const from = dayjs(`${fd}T${ft}:00`)
            const to = dayjs(`${td}T${tt}:00`)
            if (!from.isValid() || !to.isValid()) return 0
            const diffInHours = to.diff(from, 'hour', true)
            if (diffInHours < 0) return 0
            return parseFloat(diffInHours.toFixed(1))
        } catch {
            return 0
        }
    }

    useEffect(() => {
        const hrs = calculateHours(
            formDate ? convertDateToBackend(formDate) : null,
            formTime,
            toDate ? convertDateToBackend(toDate) : null,
            toTime
        )
        setValue(`partsTools.${index}.hrs`, hrs)
    }, [formDate, formTime, toDate, toTime, setValue, index])

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                <Package className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900">Parts/Tools #{index + 1}</h3>
                                {!isOpen && partToolName && (
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">— {partToolName}</span>
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
                        {/* ── Section 1: Main Info ── */}
                        <div className="grid grid-cols-6 gap-4">
                            {/* Parts/Tools Name - 4 cols */}
                            <div className="col-span-4">
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    Parts/Tools Name <span className="text-red-500">*</span>
                                </Label>
                                <PartsToolsNameDropdown
                                    value={watch(`partsTools.${index}.pathToolName`) || ''}
                                    onChange={(value) => setValue(`partsTools.${index}.pathToolName`, value)}
                                    error={itemErrors?.pathToolName?.message}
                                    index={index}
                                />
                                <FieldError message={itemErrors?.pathToolName?.message} />
                            </div>

                            {/* Qty - 1 col */}
                            <div className="col-span-1">
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    Qty
                                </Label>
                                <Controller
                                    control={control}
                                    name={`partsTools.${index}.qty`}
                                    render={({ field }) => (
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            className={itemErrors?.qty ? 'border-red-500 bg-red-50' : ''}
                                        />
                                    )}
                                />
                                <FieldError message={itemErrors?.qty?.message} />
                            </div>

                            {/* HRS - 1 col (auto) */}
                            <div className="col-span-1">
                                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                    HRS <span className="text-[10px] text-gray-400 font-normal">(Auto)</span>
                                </Label>
                                <Controller
                                    control={control}
                                    name={`partsTools.${index}.hrs`}
                                    render={({ field }) => (
                                        <Input
                                            disabled
                                            type="number"
                                            placeholder="—"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            className="bg-gray-50 text-gray-500"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* ── Section 2: Tracking IDs ── */}
                        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Hash className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Tracking IDs
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {/* Part No (P/N) */}
                                <div>
                                    <Label className="text-[10px] text-gray-400 mb-1 block">Part No. (P/N)</Label>
                                    <Input
                                        {...register(`partsTools.${index}.pathToolNo` as const)}
                                        placeholder="Enter P/N"
                                        className="text-sm"
                                    />
                                </div>

                                {/* Equipment No. */}
                                <div>
                                    <Label className="text-[10px] text-gray-400 mb-1 block">Equipment No.</Label>
                                    <Input
                                        {...register(`partsTools.${index}.equipmentNo` as const)}
                                        placeholder="Enter Eq. No."
                                        className="text-sm"
                                    />
                                </div>

                                {/* Serial IN */}
                                <div>
                                    <Label className="text-[10px] text-gray-400 mb-1 block">Serial IN</Label>
                                    <Input
                                        {...register(`partsTools.${index}.serialNoIn` as const)}
                                        placeholder="S/N IN"
                                        className="text-sm"
                                    />
                                </div>

                                {/* Serial OUT */}
                                <div>
                                    <Label className="text-[10px] text-gray-400 mb-1 block">Serial OUT</Label>
                                    <Input
                                        {...register(`partsTools.${index}.serialNoOut` as const)}
                                        placeholder="S/N OUT"
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Operational Period ── */}
                        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                    Operational Period (UTC)
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
                                                name={`partsTools.${index}.formDate` as const}
                                                render={({ field }) => (
                                                    <CustomDateInput
                                                        value={field.value || undefined}
                                                        onChange={field.onChange}
                                                        placeholder="DD/MMM/YYYY"
                                                    />
                                                )}
                                            />
                                            <FieldError message={itemErrors?.formDate?.message} />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-gray-400 mb-1 block">Time</Label>
                                            <Controller
                                                control={control}
                                                name={`partsTools.${index}.formTime` as const}
                                                render={({ field }) => (
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || ''}
                                                        className={itemErrors?.formTime ? 'border-red-500 bg-red-50' : ''}
                                                    />
                                                )}
                                            />
                                            <FieldError message={itemErrors?.formTime?.message} />
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
                                                name={`partsTools.${index}.toDate` as const}
                                                render={({ field }) => (
                                                    <CustomDateInput
                                                        value={field.value || undefined}
                                                        onChange={field.onChange}
                                                        placeholder="DD/MMM/YYYY"
                                                    />
                                                )}
                                            />
                                            <FieldError message={itemErrors?.toDate?.message} />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-gray-400 mb-1 block">Time</Label>
                                            <Controller
                                                control={control}
                                                name={`partsTools.${index}.toTime` as const}
                                                render={({ field }) => (
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || ''}
                                                        className={itemErrors?.toTime ? 'border-red-500 bg-red-50' : ''}
                                                    />
                                                )}
                                            />
                                            <FieldError message={itemErrors?.toTime?.message} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Classification ── */}
                        <div className="flex flex-wrap items-center gap-6">
                            {/* SAMS Tool */}
                            <Controller
                                control={control}
                                name={`partsTools.${index}.isSamsTool`}
                                render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked)
                                                if (checked) {
                                                    setValue(`partsTools.${index}.isLoan`, false)
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
                                name={`partsTools.${index}.isLoan`}
                                render={({ field }) => (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked)
                                                if (checked) {
                                                    setValue(`partsTools.${index}.isSamsTool`, false)
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
                                    {...register(`partsTools.${index}.loanRemark` as const)}
                                    placeholder="Enter loan remark..."
                                    rows={2}
                                    className={`resize-none ${itemErrors?.loanRemark ? 'border-red-500 bg-red-50' : ''}`}
                                />
                                <FieldError message={itemErrors?.loanRemark?.message} />
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}

// ── Main Parts/Tools Card List ──
interface PartsToolsTableProps {
    control: Control<PartsToolsFormInputs>
    watch: UseFormWatch<PartsToolsFormInputs>
    setValue: UseFormSetValue<PartsToolsFormInputs>
    register: UseFormRegister<PartsToolsFormInputs>
    errors: FieldErrors<PartsToolsFormInputs>
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    canAddMore: boolean
}

export const PartsToolsTable: React.FC<PartsToolsTableProps> = ({
    control,
    watch,
    setValue,
    register,
    errors,
    onAddItem,
    onRemoveItem,
    canAddMore,
}) => {
    const partsTools = watch('partsTools') || []

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {partsTools.length} part/tool{partsTools.length !== 1 ? 's' : ''} added
                </p>
                {canAddMore && (
                    <Button
                        type="button"
                        onClick={onAddItem}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parts/Tools
                    </Button>
                )}
            </div>

            {/* Parts/Tools Cards */}
            <div className="space-y-4">
                {partsTools.map((_, index) => (
                    <PartsToolsCardItem
                        key={index}
                        index={index}
                        control={control}
                        register={register}
                        watch={watch}
                        setValue={setValue}
                        onRemove={onRemoveItem}
                        errors={errors}
                    />
                ))}
            </div>
        </div>
    )
}

export default PartsToolsTable
