'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Control, UseFormWatch, UseFormSetValue, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Plus, Search } from 'lucide-react'
import { PartsToolsFormInputs } from './types'
import { useSearchPartsTools } from '@/lib/api/hooks/usePartsTools'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface PartsToolsTableProps {
    control: Control<PartsToolsFormInputs>
    watch: UseFormWatch<PartsToolsFormInputs>
    setValue: UseFormSetValue<PartsToolsFormInputs>
    onAddItem: () => void
    onRemoveItem: (index: number) => void
    canAddMore: boolean
}

// Searchable Parts/Tools Name Cell (inline dropdown)
const PartsToolsNameCell: React.FC<{
    value: string
    onChange: (value: string) => void
    index: number
}> = ({ value, onChange, index }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState(value || '')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { data: searchResults, isLoading } = useSearchPartsTools(searchTerm)

    const filteredPartsTools = searchResults || []

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
        setSearchTerm(e.target.value)
        onChange(e.target.value)
        setIsOpen(true)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <Input
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search parts/tools..."
                    className="h-8 text-sm pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                    {isLoading ? (
                        <div className="p-2 text-sm text-gray-500 text-center">Loading...</div>
                    ) : filteredPartsTools.length > 0 ? (
                        filteredPartsTools.slice(0, 10).map((pt) => (
                            <div
                                key={pt.id}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                onClick={() => handleSelect(pt.code)}
                            >
                                {pt.code}
                            </div>
                        ))
                    ) : searchTerm ? (
                        <div
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-blue-600"
                            onClick={() => { onChange(searchTerm); setIsOpen(false) }}
                        >
                            <Plus className="inline h-3 w-3 mr-1" />
                            Add: &ldquo;{searchTerm}&rdquo;
                        </div>
                    ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                            Type to search...
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export const PartsToolsTable: React.FC<PartsToolsTableProps> = ({
    control,
    watch,
    setValue,
    onAddItem,
    onRemoveItem,
    canAddMore,
}) => {
    const partsTools = watch('partsTools') || []

    return (
        <div className="space-y-4 h-full">
            {/* Header with Add Button */}
            {canAddMore && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onAddItem}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parts/Tools
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto h-full">
                <div className="border rounded-lg">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="min-w-[220px] text-xs font-semibold whitespace-nowrap sticky left-0 z-20 bg-gray-50 shadow-md border border-gray-200">Parts/Tools Name</TableHead>
                                <TableHead className="min-w-[100px] text-xs font-semibold whitespace-nowrap">Part No. (P/N)</TableHead>
                                <TableHead className="min-w-[100px] text-xs font-semibold whitespace-nowrap">Equipment No.</TableHead>
                                <TableHead className="min-w-[90px] text-xs font-semibold whitespace-nowrap">Serial IN</TableHead>
                                <TableHead className="min-w-[90px] text-xs font-semibold whitespace-nowrap">Serial OUT</TableHead>
                                <TableHead className="min-w-[60px] text-xs font-semibold text-center whitespace-nowrap">Qty</TableHead>
                                <TableHead className="min-w-[60px] text-xs font-semibold text-center whitespace-nowrap">Hrs</TableHead>
                                <TableHead className="min-w-[70px] text-xs font-semibold text-center whitespace-nowrap">SAMS Tool</TableHead>
                                <TableHead className="min-w-[50px] text-xs font-semibold text-center whitespace-nowrap">Loan</TableHead>
                                <TableHead className="min-w-[110px] text-xs font-semibold whitespace-nowrap">From Date</TableHead>
                                <TableHead className="min-w-[80px] text-xs font-semibold whitespace-nowrap">From Time</TableHead>
                                <TableHead className="min-w-[110px] text-xs font-semibold whitespace-nowrap">To Date</TableHead>
                                <TableHead className="min-w-[80px] text-xs font-semibold whitespace-nowrap">To Time</TableHead>
                                <TableHead className="min-w-[40px] sticky right-0 z-20 bg-gray-50 shadow-md"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partsTools.map((item, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                    {/* Parts/Tools Name */}
                                    <TableCell className="p-2 sticky left-0 z-10 bg-white shadow-md border-r border-gray-200">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.pathToolName`}
                                            render={({ field }) => (
                                                <PartsToolsNameCell
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    index={index}
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Part No. (P/N) */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.pathToolNo`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="P/N"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Equipment No. */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.equipmentNo`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Eq. No."
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Serial IN */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.serialNoIn`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="S/N IN"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Serial OUT */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.serialNoOut`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="S/N OUT"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Qty */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.qty`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-8 text-sm text-center"
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Hrs */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.hrs`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    disabled
                                                    placeholder="Auto"
                                                    className="h-8 text-sm text-center"
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* SAMS Tool Checkbox */}
                                    <TableCell className="p-2 text-center">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.isSamsTool`}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked)
                                                        if (checked) {
                                                            setValue(`partsTools.${index}.isLoan`, false)
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Loan Checkbox */}
                                    <TableCell className="p-2 text-center">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.isLoan`}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked)
                                                        if (checked) {
                                                            setValue(`partsTools.${index}.isSamsTool`, false)
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* From Date */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.formDate`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    value={field.value || ''}
                                                    type="date"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* From Time */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.formTime`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    value={field.value || ''}
                                                    type="time"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* To Date */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.toDate`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    value={field.value || ''}
                                                    type="date"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* To Time */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`partsTools.${index}.toTime`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    value={field.value || ''}
                                                    type="time"
                                                    className="h-8 text-sm"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Delete Button */}
                                    <TableCell className="p-2 sticky right-0 z-10 bg-white shadow-md border-l border-gray-200">
                                        <Button
                                            type="button"
                                            variant="soft"
                                            size="icon"
                                            color="destructive"
                                            onClick={() => onRemoveItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Empty State Row */}
                            {partsTools.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={14} className="text-center py-8 text-gray-500">
                                        No parts/tools added yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

export default PartsToolsTable
