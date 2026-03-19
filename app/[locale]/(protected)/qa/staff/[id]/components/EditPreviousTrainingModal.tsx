'use client'

import { useState, useEffect } from 'react'
import { X, History, Plus, Trash2, ChevronDown } from 'lucide-react'
import { StaffData, PreviousTrainingRecord } from '../types'

interface TrainingRow {
    provider: string
    course: string
    dateFrom: string
    dateTo: string
}

interface EditPreviousTrainingModalProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffData
    onSave: (data: PreviousTrainingRecord[]) => void
}

function parseRecord(rec: PreviousTrainingRecord): TrainingRow {
    return {
        provider: rec.provider,
        course: rec.course,
        dateFrom: rec.dateFrom || '',
        dateTo: rec.dateTo || '',
    }
}

function toRecord(row: TrainingRow): PreviousTrainingRecord {
    return {
        provider: row.provider,
        course: row.course,
        dateFrom: row.dateFrom,
        dateTo: row.dateTo,
    }
}

function emptyRow(): TrainingRow {
    return { provider: '', course: '', dateFrom: '', dateTo: '' }
}

export function EditPreviousTrainingModal({ isOpen, onClose, staff, onSave }: EditPreviousTrainingModalProps) {
    const [rows, setRows] = useState<TrainingRow[]>([])
    const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set())

    const toggleCollapse = (index: number) => {
        setCollapsedItems(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    useEffect(() => {
        if (isOpen) {
            const records = staff.previousTraining ?? []
            if (records.length > 0) {
                setRows(records.map(parseRecord))
                // Collapse all existing items by default
                setCollapsedItems(new Set(records.map((_, idx) => idx)))
            } else {
                setRows([emptyRow()])
                setCollapsedItems(new Set())
            }
        }
    }, [isOpen, staff])

    const updateRow = (index: number, field: keyof TrainingRow, value: string) => {
        setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    }

    const addRow = () => {
        setRows(prev => [...prev, emptyRow()])
        // New rows start expanded — don't add to collapsedItems
    }

    const removeRow = (index: number) => {
        if (rows.length <= 1) return
        setRows(prev => prev.filter((_, i) => i !== index))
        // Re-index collapsed items
        setCollapsedItems(prev => {
            const next = new Set<number>()
            prev.forEach(idx => {
                if (idx < index) next.add(idx)
                else if (idx > index) next.add(idx - 1)
            })
            return next
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(rows.map(toRecord))
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
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-100 text-violet-600">
                            <History className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit Previous Training Records</span>
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
                        {rows.map((row, i) => {
                            const isCollapsed = collapsedItems.has(i)
                            const summary = row.provider || row.course
                                ? `${row.provider}${row.provider && row.course ? ' — ' : ''}${row.course}`
                                : 'Untitled'

                            return (
                                <div key={i} className="border border-slate-200 rounded-xl bg-slate-50/50 relative overflow-hidden">
                                    {/* Block header — clickable to toggle */}
                                    <div
                                        className="flex items-center justify-between p-5 cursor-pointer select-none"
                                        onClick={() => toggleCollapse(i)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                                Training #{i + 1}
                                            </span>
                                            {isCollapsed && (
                                                <span className="text-xs text-slate-400 truncate ml-1">
                                                    · {summary}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
                                    </div>

                                    {/* Collapsible content */}
                                    <div
                                        className={`grid transition-all duration-200 ease-in-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 max-sm:grid-cols-1 p-5 pt-4">
                                                {/* Provider */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                                        Provider
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={row.provider}
                                                        onChange={e => updateRow(i, 'provider', e.target.value)}
                                                        placeholder="Training provider"
                                                        className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                                    />
                                                </div>

                                                {/* Course */}
                                                <div className="col-span-2 flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                                        Course
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={row.course}
                                                        onChange={e => updateRow(i, 'course', e.target.value)}
                                                        placeholder="Course name"
                                                        className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                                    />
                                                </div>

                                                {/* Date From */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                                        Date From
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={row.dateFrom}
                                                        onChange={e => updateRow(i, 'dateFrom', e.target.value)}
                                                        className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                </div>

                                                {/* Date To */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 tracking-wide">
                                                        Date To
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={row.dateTo}
                                                        onChange={e => updateRow(i, 'dateTo', e.target.value)}
                                                        className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Add Row Button */}
                        <button
                            type="button"
                            onClick={addRow}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 bg-transparent flex items-center justify-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" /> Add Training Record
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
