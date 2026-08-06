'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Award, Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useCombinations } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks'
import type { AircraftEngineCombination } from '@/lib/api/master/aircraft-engine/aircraftEngine.types'

interface LicenseFormData {
    licenseNumber: string
    categoryId: string
    issuedDate: string
    expiryDate: string
    selectedCombinationIds: Set<number>
}

interface EditLicenseModalProps {
    isOpen: boolean
    onClose: () => void
    initialLicense: any // Maps to apiData.staffAmelLicenseList[0]
    onSave: (data: any) => void
}



const CATEGORY_OPTIONS = [
    { id: 1, label: 'B1.1 — Aeroplane Turbine' },
    { id: 2, label: 'B1.2 — Aeroplane Piston' },
    { id: 3, label: 'B1.3 — Helicopter Turbine' },
    { id: 4, label: 'B1.4 — Helicopter Piston' },
    { id: 5, label: 'B2 — Avionics' },
    { id: 6, label: 'C — Base Maintenance' },
]

function emptyForm(): LicenseFormData {
    return {
        licenseNumber: '',
        categoryId: '',
        issuedDate: '',
        expiryDate: '',
        selectedCombinationIds: new Set(),
    }
}

function fromLicense(license: any): LicenseFormData {
    // Parse combinationIds from the license data (could be an array or comma-separated string)
    let ids = new Set<number>()
    if (license?.combinationIds) {
        if (Array.isArray(license.combinationIds)) {
            ids = new Set(license.combinationIds.map(Number).filter((n: number) => !isNaN(n)))
        } else if (typeof license.combinationIds === 'string') {
            ids = new Set(
                license.combinationIds.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n) && n > 0)
            )
        }
    }
    return {
        licenseNumber: license?.licenseNumber || '',
        categoryId: license?.categoryId ? String(license.categoryId) : '',
        issuedDate: license?.issuedDate || '',
        expiryDate: license?.expiryDate || '',
        selectedCombinationIds: ids,
    }
}

function toLicense(form: LicenseFormData): any {
    return {
        licenseNumber: form.licenseNumber,
        categoryId: form.categoryId ? Number(form.categoryId) : 0,
        issuedDate: form.issuedDate,
        expiryDate: form.expiryDate,
        combinationIds: Array.from(form.selectedCombinationIds),
    }
}

export function EditLicenseModal({ isOpen, onClose, initialLicense, onSave }: EditLicenseModalProps) {
    const [form, setForm] = useState<LicenseFormData>(emptyForm())
    const [comboSearch, setComboSearch] = useState('')
    const { data: combinations = [] } = useCombinations()

    useEffect(() => {
        if (isOpen) {
            setForm(initialLicense ? fromLicense(initialLicense) : emptyForm())
            setComboSearch('')
        }
    }, [isOpen, initialLicense])

    const updateField = (field: keyof LicenseFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const toggleCombination = (id: number) => {
        setForm(prev => {
            const next = new Set(prev.selectedCombinationIds)
            next.has(id) ? next.delete(id) : next.add(id)
            return { ...prev, selectedCombinationIds: next }
        })
    }

    // Group combinations by familyCode, filtered by search
    const groupedCombos = useMemo(() => {
        const q = comboSearch.toLowerCase()
        const byFamily = new Map<string, AircraftEngineCombination[]>()
        for (const c of combinations) {
            if (q && !c.displayLabel.toLowerCase().includes(q) && !c.familyCode.toLowerCase().includes(q)) continue
            const arr = byFamily.get(c.familyCode) ?? []
            arr.push(c)
            byFamily.set(c.familyCode, arr)
        }
        return Array.from(byFamily.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    }, [combinations, comboSearch])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(toLicense(form))
        onClose()
    }

    if (!isOpen) return null

    const inputClass = 'w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300'
    const labelClass = 'text-xs font-semibold text-slate-500 tracking-wide'

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
                            <Award className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit AMEL License</span>
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
                    <div className="px-7 py-5 overflow-y-auto flex-1 space-y-5">

                        {/* License Number */}
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>License Number</label>
                            <input
                                type="text"
                                value={form.licenseNumber}
                                onChange={e => updateField('licenseNumber', e.target.value)}
                                placeholder="e.g. TCAR-66.B1.1-XXXX"
                                className={`${inputClass}`}
                            />
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Category</label>
                            <select
                                value={form.categoryId}
                                onChange={e => updateField('categoryId', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select Category</option>
                                {CATEGORY_OPTIONS.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Issued Date + Expiry Date */}
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 max-sm:grid-cols-1">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Issued Date</label>
                                <input
                                    type="date"
                                    value={form.issuedDate}
                                    onChange={e => updateField('issuedDate', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Expiry Date</label>
                                <input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={e => updateField('expiryDate', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* ── Aircraft License: Selected combinations ── */}
                        <div className="flex flex-col gap-2.5">
                            <label className={labelClass}>Aircraft License</label>

                            {/* Search box */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={comboSearch}
                                    onChange={e => setComboSearch(e.target.value)}
                                    placeholder="Search combination..."
                                    className={`${inputClass} !pl-9`}
                                />
                            </div>

                            {/* Selected count */}
                            <div className="flex items-center text-xs text-slate-400">
                                <span>Selected {form.selectedCombinationIds.size} combinations</span>
                            </div>

                            {/* Grouped checkbox list */}
                            <div className="min-h-[120px] max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-3">
                                {groupedCombos.map(([family, combos]) => (
                                    <div key={family}>
                                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            {family}
                                        </div>
                                        <div className="space-y-0.5">
                                            {combos.map((c) => (
                                                <label
                                                    key={c.id}
                                                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-slate-50 transition-colors duration-150"
                                                >
                                                    <Checkbox
                                                        checked={form.selectedCombinationIds.has(c.id)}
                                                        onCheckedChange={() => toggleCombination(c.id)}
                                                    />
                                                    <span className="text-xs text-slate-700">{c.displayLabel}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {groupedCombos.length === 0 && (
                                    <p className="py-6 text-center text-xs text-slate-400">No combination found</p>
                                )}
                            </div>
                        </div>

                        {/* Attachments section removed per user request */}
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
