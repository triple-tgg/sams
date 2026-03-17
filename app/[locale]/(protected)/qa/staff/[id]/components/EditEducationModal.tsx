'use client'

import { useState, useEffect } from 'react'
import { X, GraduationCap, Plus, Trash2 } from 'lucide-react'
import { StaffData, Education } from '../types'

interface EducationRow {
    degree: string
    institution: string
    startYear: string
    endYear: string
}

interface EditEducationModalProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffData
    onSave: (data: Education[]) => void
}

const DEGREE_OPTIONS = [
    'Diploma',
    'Certificate',
    'Associate',
    'Bachelor',
    'Master',
    'Doctoral',
    'Other',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 31 }, (_, i) => String(CURRENT_YEAR - i))

function parseEducation(edu: Education): EducationRow {
    const parts = edu.year.split('–').map(s => s.trim())
    return {
        degree: edu.degree,
        institution: edu.institution,
        startYear: parts[0] || edu.year,
        endYear: parts[1] || '',
    }
}

function toEducation(row: EducationRow): Education {
    return {
        degree: row.degree,
        institution: row.institution,
        year: row.endYear ? `${row.startYear} – ${row.endYear}` : row.startYear,
        field: '',
    }
}

function emptyRow(): EducationRow {
    return { degree: '', institution: '', startYear: '', endYear: '' }
}

export function EditEducationModal({ isOpen, onClose, staff, onSave }: EditEducationModalProps) {
    const [rows, setRows] = useState<EducationRow[]>([])

    useEffect(() => {
        if (isOpen) {
            if (staff.education.length > 0) {
                setRows(staff.education.map(parseEducation))
            } else {
                setRows([emptyRow()])
            }
        }
    }, [isOpen, staff])

    const updateRow = (index: number, field: keyof EducationRow, value: string) => {
        setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    }

    const addRow = () => setRows(prev => [...prev, emptyRow()])

    const removeRow = (index: number) => {
        if (rows.length <= 1) return
        setRows(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(rows.map(toEducation))
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit Education</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-7 py-5 overflow-y-auto flex-1 space-y-4">
                        {rows.map((row, i) => (
                            <div key={i} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 relative">
                                {/* Block header */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Education #{i + 1}
                                    </span>
                                    {rows.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRow(i)}
                                            className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600 cursor-pointer bg-transparent border-none transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Remove
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 max-sm:grid-cols-1">
                                    {/* Degree */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            Degree
                                        </label>
                                        <select
                                            value={row.degree}
                                            onChange={e => updateRow(i, 'degree', e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">Select Degree</option>
                                            {DEGREE_OPTIONS.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Institution */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            Institution / University / College
                                        </label>
                                        <input
                                            type="text"
                                            value={row.institution}
                                            onChange={e => updateRow(i, 'institution', e.target.value)}
                                            placeholder="Institution name"
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                        />
                                    </div>

                                    {/* Start Year */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            Start Year
                                        </label>
                                        <select
                                            value={row.startYear}
                                            onChange={e => updateRow(i, 'startYear', e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        >
                                            {YEARS.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* End Year */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            End Year
                                        </label>
                                        <select
                                            value={row.endYear}
                                            onChange={e => updateRow(i, 'endYear', e.target.value)}
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">Present</option>
                                            {YEARS.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Row Button */}
                        <button
                            type="button"
                            onClick={addRow}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 bg-transparent flex items-center justify-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" /> Add Education
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
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
