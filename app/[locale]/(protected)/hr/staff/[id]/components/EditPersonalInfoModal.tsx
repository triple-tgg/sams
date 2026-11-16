'use client'

import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { StaffData } from '../types'
import { useStaffTitles } from '@/lib/api/master/staff-titles.hooks'
import { resolveStaffTitleId } from '@/lib/api/master/staff-titles'

export interface PersonalInfoFormData {
    /** Name title id (titleObj.id) as a string; the Thai and English selects both edit it */
    titleId: string
    name: string
    nameEn: string
    dob: string
    placeOfBirth: string
    idCard: string
    nationality: string
}


interface EditPersonalInfoModalProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffData
    onSave: (data: PersonalInfoFormData) => void
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

// StaffData uses '-' as a display placeholder for missing values — never edit/save it as real data
const blankIfDash = (value?: string | null) => (!value || value.trim() === '-' ? '' : value)
// <input type="date"> needs YYYY-MM-DD; API may return a full ISO datetime
const toDateInputValue = (value?: string | null) => blankIfDash(value).slice(0, 10)

export function EditPersonalInfoModal({ isOpen, onClose, staff, onSave }: EditPersonalInfoModalProps) {
    const [form, setForm] = useState<PersonalInfoFormData>({
        titleId: staff.titleId ? String(staff.titleId) : '',
        name: blankIfDash(staff.name),
        nameEn: blankIfDash(staff.nameEn),
        dob: toDateInputValue(staff.dob),
        placeOfBirth: blankIfDash(staff.placeOfBirth),
        idCard: blankIfDash(staff.idCard),
        nationality: blankIfDash(staff.nationality),
    })

    // Sync form when staff data changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({
                titleId: staff.titleId ? String(staff.titleId) : '',
                name: blankIfDash(staff.name),
                nameEn: blankIfDash(staff.nameEn),
                dob: toDateInputValue(staff.dob),
                placeOfBirth: blankIfDash(staff.placeOfBirth),
                idCard: blankIfDash(staff.idCard),
                nationality: blankIfDash(staff.nationality),
            })
        }
    }, [isOpen, staff])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // Both title selects (Thai / English) set the same titleId
        const key = e.target.name === 'titleIdTh' || e.target.name === 'titleIdEn' ? 'titleId' : e.target.name
        setForm(prev => ({ ...prev, [key]: e.target.value }))
    }

    // Title options from the title master: each row has both the Thai and the English name
    const { data: titles = [] } = useStaffTitles()
    // Records saved before titleId existed: preselect by matching the old title text
    useEffect(() => {
        if (!isOpen || form.titleId || !staff.titleName || titles.length === 0) return
        const id = resolveStaffTitleId(staff.titleName, titles)
        if (id) setForm(prev => ({ ...prev, titleId: String(id) }))
    }, [isOpen, form.titleId, staff.titleName, titles])
    // Miss and Ms. are both "นางสาว": add the English name where the Thai one is shared
    const titleOptionsTh = [{ value: '', label: '-' }, ...titles.map(t => ({
        value: String(t.id),
        label: titles.some(o => o.id !== t.id && o.nameTh === t.nameTh) ? `${t.nameTh} (${t.nameEn})` : t.nameTh,
    }))]
    const titleOptionsEn = [{ value: '', label: '-' }, ...titles.map(t => ({ value: String(t.id), label: t.nameEn }))]

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
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                            <User className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit Personal Info</span>
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
                    <div className="px-7 py-6 grid grid-cols-6 gap-x-5 gap-y-4 max-sm:grid-cols-1">
                        <div className="col-span-full grid grid-cols-24 gap-x-2">
                            <div className="col-span-5">
                                <FormSelect
                                    label="Title"
                                    name="titleIdTh"
                                    value={form.titleId}
                                    onChange={handleChange}
                                    options={titleOptionsTh}
                                />
                            </div>
                            <div className="col-span-19">
                                <FormField
                                    label="Full Name (Thai)"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="ชื่อ-นามสกุล (ภาษาไทย)"
                                />
                            </div>
                        </div>
                        <div className="col-span-full grid grid-cols-24 gap-x-2">
                            <div className="col-span-5">
                                <FormSelect
                                    label="Title"
                                    name="titleIdEn"
                                    value={form.titleId}
                                    onChange={handleChange}
                                    options={titleOptionsEn}
                                />
                            </div>
                            <div className="col-span-19">
                                <FormField
                                    label="Full Name (English)"
                                    name="nameEn"
                                    value={form.nameEn}
                                    onChange={handleChange}
                                    placeholder="Full Name (English)"
                                />
                            </div>
                        </div>
                        <div className="col-span-full border-b border-slate-100"></div>
                        <div className="col-span-3">
                            <FormField
                                label="Date of Birth"
                                name="dob"
                                value={form.dob}
                                onChange={handleChange}
                                type="date"
                            />
                        </div>
                        <div className="col-span-3">
                            <FormField
                                label="Place of Birth"
                                name="placeOfBirth"
                                value={form.placeOfBirth}
                                onChange={handleChange}
                                placeholder="Place of Birth"
                            />
                        </div>
                        <div className="col-span-3">
                            <FormField
                                label="Thai ID Card No."
                                name="idCard"
                                value={form.idCard}
                                onChange={handleChange}
                                placeholder="x-xxxx-xxxxx-xx-x"
                            />
                        </div>
                        <div className="col-span-3">
                            <FormField
                                label="Nationality"
                                name="nationality"
                                value={form.nationality}
                                onChange={handleChange}
                                placeholder="Nationality"
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
