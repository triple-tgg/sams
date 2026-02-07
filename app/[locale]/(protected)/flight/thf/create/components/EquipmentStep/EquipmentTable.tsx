'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Control, UseFormWatch, UseFormSetValue, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Plus, Search, ChevronDown } from 'lucide-react'
import { EquipmentFormData, Equipment, defaultEquipment } from './types'
import { useEquipmentSearch } from '@/lib/api/hooks/useEquipment'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface EquipmentTableProps {
    control: Control<EquipmentFormData>
    watch: UseFormWatch<EquipmentFormData>
    setValue: UseFormSetValue<EquipmentFormData>
    onAddEquipment: () => void
    onRemoveEquipment: (index: number) => void
    canAddMore: boolean
}

// Searchable Equipment Name Cell
const EquipmentNameCell: React.FC<{
    value: string
    onChange: (value: string) => void
    index: number
}> = ({ value, onChange, index }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState(value || '')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { equipmentList, searchEquipment, isLoading } = useEquipmentSearch()

    const filteredEquipment = searchTerm ? searchEquipment(searchTerm) : equipmentList

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
                    placeholder="Search equipment..."
                    className="h-8 text-sm pr-8"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                    {isLoading ? (
                        <div className="p-2 text-sm text-gray-500 text-center">Loading...</div>
                    ) : filteredEquipment.length > 0 ? (
                        filteredEquipment.slice(0, 10).map((eq) => (
                            <div
                                key={eq.id}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                onClick={() => handleSelect(eq.code)}
                            >
                                {eq.code}{eq.name ? ` - ${eq.name}` : ''}
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                            No equipment found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({
    control,
    watch,
    setValue,
    onAddEquipment,
    onRemoveEquipment,
    canAddMore,
}) => {
    const equipments = watch('equipments') || []

    return (
        <div className="space-y-4 h-full">
            {/* Header with Add Button */}
            {canAddMore && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onAddEquipment}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Equipment
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto h-full">
                <div className="border rounded-lg ">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="min-w-[250px] text-xs font-semibold whitespace-nowrap sticky left-0 z-20 bg-gray-50 shadow-md border border-gray-200">Equipment Name</TableHead>
                                <TableHead className="min-w-[60px] text-xs font-semibold text-center whitespace-nowrap">Hrs</TableHead>
                                <TableHead className="min-w-[60px] text-xs font-semibold text-center whitespace-nowrap">Svc</TableHead>
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
                            {equipments.map((equipment, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                    {/* Equipment Name */}
                                    <TableCell className="p-2 sticky left-0 z-10 bg-white shadow-md border-r border-gray-200">
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.equipmentName`}
                                            render={({ field }) => (
                                                <EquipmentNameCell
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    index={index}
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Hrs */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.hrs`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-8 text-sm text-center"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* Svc */}
                                    <TableCell className="p-2">
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.svc`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-8 text-sm text-center"
                                                />
                                            )}
                                        />
                                    </TableCell>

                                    {/* SAMS Tool Checkbox */}
                                    <TableCell className="p-2 text-center">
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.isSamsTool`}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked)
                                                        // Mutually exclusive with isLoan
                                                        if (checked) {
                                                            setValue(`equipments.${index}.isLoan`, false)
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
                                            name={`equipments.${index}.isLoan`}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked)
                                                        // Mutually exclusive with isSamsTool
                                                        if (checked) {
                                                            setValue(`equipments.${index}.isSamsTool`, false)
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
                                            name={`equipments.${index}.fromDate`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
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
                                            name={`equipments.${index}.fromTime`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
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
                                            name={`equipments.${index}.toDate`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
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
                                            name={`equipments.${index}.toTime`}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
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
                                            onClick={() => onRemoveEquipment(index)}
                                        // className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Empty State Row */}
                            {equipments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                        No equipment added yet
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

export default EquipmentTable
