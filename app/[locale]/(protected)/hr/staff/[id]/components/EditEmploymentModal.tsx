'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Briefcase } from 'lucide-react'
import { StaffData } from '../types'
import { useStaffDepartments, useStaffDepartmentPositions } from '@/lib/api/master/organization.hooks'

interface EmploymentFormData {
    empId: string
    position: string
    department: string
    startDate: string
    endWorkingDate: string
    jobNote: string
    staffType: string
}

interface EditEmploymentModalProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffData
    onSave: (data: EmploymentFormData) => void
}

function FormField({ label, name, value, onChange, type = 'text', placeholder }: {
    label: string
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    type?: string
    placeholder?: string
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={name} className="text-xs font-semibold text-slate-500 tracking-wide">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white placeholder:text-slate-300"
            />
        </div>
    )
}

function FormSelect({ label, name, value, onChange, options, disabled }: {
    label: string
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string; label: string }[]
    disabled?: boolean
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={name} className="text-xs font-semibold text-slate-500 tracking-wide">
                {label}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

export function EditEmploymentModal({ isOpen, onClose, staff, onSave }: EditEmploymentModalProps) {
    // Fetch departments & positions from API
    const { data: deptData } = useStaffDepartments()
    const { data: posData } = useStaffDepartmentPositions()

    const departments = useMemo(() => {
        return (deptData?.responseData || []).filter(d => !d.isdelete)
    }, [deptData])

    const allPositions = useMemo(() => {
        return (posData?.responseData || []).filter(p => !p.isdelete)
    }, [posData])

    const [form, setForm] = useState<EmploymentFormData>({
        empId: '',
        position: '',
        department: '',
        startDate: '',
        endWorkingDate: '',
        jobNote: '',
        staffType: '',
    })

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen && departments.length > 0 && allPositions.length > 0) {
            // Find the current position's staffDepartmentId to resolve the department
            const currentPositionName = staff.position
            const matchedPosition = allPositions.find(p => p.name === currentPositionName)
            const currentDeptId = matchedPosition?.staffDepartmentId?.toString() || ''

            setForm({
                empId: staff.empId,
                position: matchedPosition?.id.toString() || '',
                department: currentDeptId,
                startDate: staff.startDate ?? '',
                endWorkingDate: staff.endDate ?? '',
                jobNote: staff.jobNote ?? '',
                staffType: staff.staffType ?? '',
            })
        } else if (isOpen) {
            setForm({
                empId: staff.empId,
                position: '',
                department: '',
                startDate: staff.startDate ?? '',
                endWorkingDate: staff.endDate ?? '',
                jobNote: staff.jobNote ?? '',
                staffType: staff.staffType ?? '',
            })
        }
    }, [isOpen, staff, departments, allPositions])

    // Filter positions based on selected department
    const filteredPositions = useMemo(() => {
        if (!form.department) return allPositions
        return allPositions.filter(p => p.staffDepartmentId === Number(form.department))
    }, [allPositions, form.department])

    // Build select options
    const departmentOptions = useMemo(() => [
        { value: '', label: '-- Select Department --' },
        ...departments.map(d => ({ value: d.id.toString(), label: d.name })),
    ], [departments])

    const positionOptions = useMemo(() => [
        { value: '', label: '-- Select Position --' },
        ...filteredPositions.map(p => ({ value: p.id.toString(), label: p.name })),
    ], [filteredPositions])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name === 'department') {
            // When department changes, reset position if current position doesn't belong to new department
            setForm(prev => {
                const currentPositionBelongs = allPositions.some(
                    p => p.id.toString() === prev.position && p.staffDepartmentId === Number(value)
                )
                return {
                    ...prev,
                    department: value,
                    position: currentPositionBelongs ? prev.position : '',
                }
            })
        } else if (name === 'position') {
            // When position is selected, auto-fill department from position's staffDepartmentId
            const selectedPosition = allPositions.find(p => p.id.toString() === value)
            setForm(prev => ({
                ...prev,
                position: value,
                department: selectedPosition ? selectedPosition.staffDepartmentId.toString() : prev.department,
            }))
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(form)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit Employment</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit}>
                    <div className="px-7 py-6 grid grid-cols-2 gap-x-5 gap-y-4 max-sm:grid-cols-1">
                        {/* Row 1: Employee ID → Staff Type */}
                        <FormField
                            label="Employee ID"
                            name="empId"
                            value={form.empId}
                            onChange={handleChange}
                            placeholder="EMP-XXXX"
                        />
                        <FormSelect
                            label="Staff Type"
                            name="staffType"
                            value={form.staffType}
                            onChange={handleChange}
                            options={[
                                { value: '', label: '-- Select Staff Type --' },
                                { value: 'MECH', label: 'MECH' },
                                { value: 'CS', label: 'CS' },
                                { value: 'Operational Staff', label: 'Operational Staff' },
                                { value: 'Back Office', label: 'Back Office' },
                            ]}
                        />
                        {/* Row 2: Department → Position */}
                        <FormSelect
                            label="Department"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            options={departmentOptions}
                        />
                        <FormSelect
                            label="Position"
                            name="position"
                            value={form.position}
                            onChange={handleChange}
                            options={positionOptions}
                        />
                        {/* Row 3: Start Date → End Working Date */}
                        <FormField
                            label="Start Date"
                            name="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                            type="date"
                        />
                        <FormField
                            label="End Working Date"
                            name="endWorkingDate"
                            value={form.endWorkingDate}
                            onChange={handleChange}
                            type="date"
                        />
                        {/* Row 4: Job Note */}
                        <div className="col-span-2 max-sm:col-span-1">
                            <FormField
                                label="Job Note"
                                name="jobNote"
                                value={form.jobNote}
                                onChange={handleChange}
                                placeholder="e.g. Senior Aircraft Mechanic"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:border-blue-700 hover:shadow-md"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
