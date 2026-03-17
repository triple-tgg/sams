'use client'

import { useState, useEffect } from 'react'
import { X, Briefcase } from 'lucide-react'
import { StaffData } from '../types'

interface EmploymentFormData {
    empId: string
    position: string
    department: string
    startDate: string
}

const POSITION_OPTIONS = [
    { value: 'B1 Engineer', label: 'B1 Engineer' },
    { value: 'B2 Engineer', label: 'B2 Engineer' },
    { value: 'Technician', label: 'Technician' },
    { value: 'Senior Technician', label: 'Senior Technician' },
    { value: 'Inspector', label: 'Inspector' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Manager', label: 'Manager' },
]

const DEPARTMENT_OPTIONS = [
    { value: 'Line Maintenance', label: 'Line Maintenance' },
    { value: 'Base Maintenance', label: 'Base Maintenance' },
    { value: 'Quality Assurance', label: 'Quality Assurance' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Planning', label: 'Planning' },
    { value: 'Store / Logistics', label: 'Store / Logistics' },
]

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

function FormSelect({ label, name, value, onChange, options }: {
    label: string
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string; label: string }[]
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
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white appearance-none cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

export function EditEmploymentModal({ isOpen, onClose, staff, onSave }: EditEmploymentModalProps) {
    const [form, setForm] = useState<EmploymentFormData>({
        empId: staff.empId,
        position: staff.position,
        department: staff.department,
        startDate: staff.startDate,
    })

    useEffect(() => {
        if (isOpen) {
            setForm({
                empId: staff.empId,
                position: staff.position,
                department: staff.department,
                startDate: staff.startDate,
            })
        }
    }, [isOpen, staff])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
                        <FormField
                            label="Employee ID"
                            name="empId"
                            value={form.empId}
                            onChange={handleChange}
                            placeholder="EMP-XXXX"
                        />
                        <FormField
                            label="Start Date"
                            name="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                            type="date"
                        />
                        <FormSelect
                            label="Position"
                            name="position"
                            value={form.position}
                            onChange={handleChange}
                            options={POSITION_OPTIONS}
                        />
                        <FormSelect
                            label="Department"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            options={DEPARTMENT_OPTIONS}
                        />
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
