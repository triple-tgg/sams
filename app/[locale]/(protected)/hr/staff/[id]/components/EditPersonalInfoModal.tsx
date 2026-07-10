'use client'

import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { StaffData } from '../types'

interface PersonalInfoFormData {
    titleNameTH: string
    titleNameEN: string
    name: string
    nameEn: string
    dob: string
    placeOfBirth: string
    idCard: string
    nationality: string
}

const TITLE_OPTIONS_TH = [
    { value: 'นาย', label: 'นาย' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นางสาว', label: 'นางสาว' },
]

const TITLE_OPTIONS_EN = [
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Ms.', label: 'Ms.' },
    { value: 'Dr.', label: 'Dr.' },
]

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

export function EditPersonalInfoModal({ isOpen, onClose, staff, onSave }: EditPersonalInfoModalProps) {
    const [form, setForm] = useState<PersonalInfoFormData>({
        titleNameTH: staff.titleName ?? '',
        titleNameEN: '',
        name: staff.name,
        nameEn: staff.nameEn,
        dob: staff.dob,
        placeOfBirth: staff.placeOfBirth,
        idCard: staff.idCard,
        nationality: staff.nationality,
    })

    // Sync form when staff data changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setForm({
                titleNameTH: staff.titleName ?? '',
                titleNameEN: '',
                name: staff.name,
                nameEn: staff.nameEn,
                dob: staff.dob,
                placeOfBirth: staff.placeOfBirth,
                idCard: staff.idCard,
                nationality: staff.nationality,
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
                                    name="titleNameTH"
                                    value={form.titleNameTH}
                                    onChange={handleChange}
                                    options={TITLE_OPTIONS_TH}
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
                                    name="titleNameEN"
                                    value={form.titleNameEN}
                                    onChange={handleChange}
                                    options={TITLE_OPTIONS_EN}
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
