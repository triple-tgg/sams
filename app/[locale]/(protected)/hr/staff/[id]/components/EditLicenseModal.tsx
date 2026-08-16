'use client'

import { useState, useEffect } from 'react'
import { X, Award } from 'lucide-react'

interface LicenseFormData {
    licenseNumber: string
    categoryId: string
    issuedDate: string
    expiryDate: string
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
    }
}

function fromLicense(license: any): LicenseFormData {
    return {
        licenseNumber: license?.licenseNumber || '',
        categoryId: license?.categoryId ? String(license.categoryId) : '',
        issuedDate: license?.issuedDate || '',
        expiryDate: license?.expiryDate || '',
    }
}

function toLicense(form: LicenseFormData): any {
    return {
        licenseNumber: form.licenseNumber,
        categoryId: form.categoryId ? Number(form.categoryId) : 0,
        issuedDate: form.issuedDate,
        expiryDate: form.expiryDate,
        // Preserve combinationIds as empty or ignore, 
        // actually we should probably not touch combinationIds from here if it belongs to Aircraft License
        // But since the API definition might still have it, we return empty array for now.
        combinationIds: [],
    }
}

export function EditLicenseModal({ isOpen, onClose, initialLicense, onSave }: EditLicenseModalProps) {
    const [form, setForm] = useState<LicenseFormData>(emptyForm())

    useEffect(() => {
        if (isOpen) {
            setForm(initialLicense ? fromLicense(initialLicense) : emptyForm())
        }
    }, [isOpen, initialLicense])

    const updateField = (field: keyof LicenseFormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

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
                                className={inputClass}
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
