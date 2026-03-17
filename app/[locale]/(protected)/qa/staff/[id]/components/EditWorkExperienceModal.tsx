'use client'

import { useState, useEffect } from 'react'
import { X, Briefcase, Plus, Trash2 } from 'lucide-react'
import { StaffData, WorkExperience } from '../types'

interface ExperienceRow {
    company: string
    title: string
    fromMonth: string
    fromYear: string
    toMonth: string
    toYear: string
    notes: string
}

interface EditWorkExperienceModalProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffData
    onSave: (data: WorkExperience[]) => void
}

const MONTHS = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 31 }, (_, i) => String(CURRENT_YEAR - i))

function parseExperience(exp: WorkExperience): ExperienceRow {
    // Parse "2021 – Present" or "2015 – 2021"
    const parts = exp.period.split('–').map(s => s.trim())
    return {
        company: exp.company,
        title: exp.title,
        fromMonth: '',
        fromYear: parts[0] || '',
        toMonth: '',
        toYear: parts[1] || '',
        notes: exp.description || '',
    }
}

function toWorkExperience(row: ExperienceRow): WorkExperience {
    const from = row.fromMonth ? `${row.fromMonth}-${row.fromYear}` : row.fromYear
    const to = row.toMonth ? `${row.toMonth}-${row.toYear}` : (row.toYear || 'Present')
    return {
        title: row.title,
        company: row.company,
        period: `${from} – ${to}`,
        description: row.notes,
    }
}

function emptyRow(): ExperienceRow {
    return { company: '', title: '', fromMonth: '', fromYear: '', toMonth: '', toYear: '', notes: '' }
}

export function EditWorkExperienceModal({ isOpen, onClose, staff, onSave }: EditWorkExperienceModalProps) {
    const [rows, setRows] = useState<ExperienceRow[]>([])

    useEffect(() => {
        if (isOpen) {
            if (staff.experience.length > 0) {
                setRows(staff.experience.map(parseExperience))
            } else {
                setRows([emptyRow()])
            }
        }
    }, [isOpen, staff])

    const updateRow = (index: number, field: keyof ExperienceRow, value: string) => {
        setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    }

    const addRow = () => setRows(prev => [...prev, emptyRow()])

    const removeRow = (index: number) => {
        if (rows.length <= 1) return
        setRows(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(rows.map(toWorkExperience))
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
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit Work Experience</span>
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
                                        Employer #{i + 1}
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
                                    {/* Employer / Company */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            Employer / Company
                                        </label>
                                        <input
                                            type="text"
                                            value={row.company}
                                            onChange={e => updateRow(i, 'company', e.target.value)}
                                            placeholder="Company name"
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                        />
                                    </div>

                                    {/* Position / Title */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            Position / Title
                                        </label>
                                        <input
                                            type="text"
                                            value={row.title}
                                            onChange={e => updateRow(i, 'title', e.target.value)}
                                            placeholder="Job title"
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                        />
                                    </div>

                                    {/* From */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            From (Month-Year)
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={row.fromMonth}
                                                onChange={e => updateRow(i, 'fromMonth', e.target.value)}
                                                className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="">Month</option>
                                                {MONTHS.filter(m => m).map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={row.fromYear}
                                                onChange={e => updateRow(i, 'fromYear', e.target.value)}
                                                className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            >

                                                {YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* To */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            To (Month-Year)
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={row.toMonth}
                                                onChange={e => updateRow(i, 'toMonth', e.target.value)}
                                                className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="">Month</option>
                                                {MONTHS.filter(m => m).map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={row.toYear}
                                                onChange={e => updateRow(i, 'toYear', e.target.value)}
                                                className="flex-1 px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            >

                                                <option value="Present">Present</option>
                                                {YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="col-span-full flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                            Notes
                                        </label>
                                        <textarea
                                            value={row.notes}
                                            onChange={e => updateRow(i, 'notes', e.target.value)}
                                            placeholder="Job responsibilities, achievements, etc."
                                            rows={2}
                                            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 resize-none"
                                        />
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
                            <Plus className="h-4 w-4" /> Add Employer
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
