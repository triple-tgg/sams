'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Trash2, User, Briefcase, ClipboardCheck, Paperclip, Wrench } from 'lucide-react'
import { StaffData, LogbookEntry } from '../types'

// ── Option Constants ──
const LICENSE_CATEGORIES = [
    'A1 Aircraft Certifying Staff',
    'Aircraft Mechanic',
    'Aircraft Inspector',
]

const LOCATIONS = ['BKK', 'DMK', 'HKT', 'CNX', 'HDY', 'KBV', 'CEI']

const AIRCRAFT_TYPES = [
    'Boeing B737-800 (CFM56)',
    'Airbus A320 (CFM LEAP-1A)',
    'Airbus A320 (V2500)',
    'Boeing B737-400 (CFM56)',
    'Boeing B737 MAX 8 (CFM LEAP-1B)',
    'Airbus A330-300 (Trent 700)',
    'ATR 72-600 (PW127M)',
]

const PRIVILEGES = ['B1', 'B2', 'B1B2']

const ATA_CHAPTERS = [
    'ATA 21 – Air Conditioning',
    'ATA 24 – Electrical Power',
    'ATA 27 – Flight Controls',
    'ATA 28 – Fuel',
    'ATA 29 – Hydraulic Power',
    'ATA 32 – Landing Gear',
    'ATA 36 – Pneumatic',
    'ATA 49 – APU',
    'ATA 52 – Doors',
    'ATA 71 – Power Plant',
    'ATA 72 – Engine',
    'ATA 73 – Engine Fuel & Control',
    'ATA 78 – Exhaust',
    'ATA 79 – Oil',
    'ATA 80 – Starting',
]

const MAINTENANCE_RATINGS = [
    'Transit Check',
    'Daily Check',
    'Schedule Maintenance up to A-Check',
    'Engine Change',
    'APU Change',
    'Engine Borescope',
]

const TASK_TYPES = [
    'CRS – Certificate of Release to Service',
    'SGH – Servicing',
    'INSP – Inspection',
    'FOT – Functional/Operational Test',
    'TS – Troubleshooting',
    'REP – Repair',
    'R/I – Removal/Installation',
    'Supervising',
    'Defect Rectification',
    'Borescope Inspection',
    'Training',
    'Other',
]

const ACTIVITY_TYPES = ['CRS', 'Perform', 'Supervise', 'Training']

const ACCEPTED_FILE_TYPES =
    '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mp3,.wav'

// ── Form State Interface ──
interface LogbookRecordForm {
    // General
    name: string
    employeeId: string
    licenseCategory: string
    // Experiences
    dateToPerform: string
    location: string
    aircraftType: string
    aircraftRegistration: string
    privilegeUsed: string
    ataChapter: string
    // Task Details
    maintenanceRatings: string[]
    taskTypes: string[]
    activityType: string
    // References
    maintenanceRef: string
    performedDuration: string
    authorizedStampNo: string
}

interface FileAttachment {
    name: string
    size: number
    type: string
}

// ── Section Header ──
function SectionHeader({ icon, title, number }: { icon: React.ReactNode; title: string; number: number }) {
    return (
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 text-xs font-bold">
                {number}
            </div>
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-bold text-slate-800">{title}</span>
            </div>
        </div>
    )
}

// ── Form Field Wrapper ──
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
        </div>
    )
}

// ── Multi-Select Checkbox Field ──
function CheckboxSelect({
    options,
    selected,
    onChange,
}: {
    options: string[]
    selected: string[]
    onChange: (val: string[]) => void
}) {
    const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
    }
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {options.map(opt => (
                <label
                    key={opt}
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => toggle(opt)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200 focus:ring-2 cursor-pointer accent-blue-600"
                    />
                    <span className={`text-xs transition-colors ${selected.includes(opt) ? 'text-slate-800 font-semibold' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {opt}
                    </span>
                </label>
            ))}
        </div>
    )
}

// ── Input Classes ──
const inputCls =
    'w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all'
const selectCls =
    'w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none cursor-pointer'
const readOnlyCls =
    'w-full text-sm px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 text-slate-600'

// ── Modal Props ──
interface LogbookRecordModalProps {
    staff: StaffData
    defect: { ata: string; description: string } | null
    logEntry: LogbookEntry | null
    onClose: () => void
}

// ── Modal Component ──
export function LogbookRecordModal({ staff, defect, logEntry, onClose }: LogbookRecordModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState<LogbookRecordForm>({
        name: staff.nameEn || staff.name,
        employeeId: staff.empId,
        licenseCategory: staff.license?.category || '',
        dateToPerform: logEntry?.date || new Date().toISOString().split('T')[0],
        location: '',
        aircraftType: '',
        aircraftRegistration: logEntry?.regNo || '',
        privilegeUsed: '',
        ataChapter: defect?.ata || '',
        maintenanceRatings: [],
        taskTypes: [],
        activityType: '',
        maintenanceRef: logEntry?.thfNo || '',
        performedDuration: logEntry ? String(logEntry.hours) : '',
        authorizedStampNo: '',
    })

    const [files, setFiles] = useState<FileAttachment[]>([])

    const update = (field: keyof LogbookRecordForm, value: string | string[]) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []).map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
        }))
        setFiles(prev => [...prev, ...newFiles])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (!defect || !logEntry) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-600 text-white">
                            <ClipboardCheck className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <span className="text-base font-bold text-slate-800 block">Maintenance Experiences Logbook Record</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-semibold text-slate-400 font-mono">{logEntry.thfNo}</span>
                                <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{defect.ata}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="overflow-y-auto flex-1 px-7 py-6 space-y-8">

                    {/* ─── Section 1: General Information ─── */}
                    <div>
                        <SectionHeader icon={<User className="h-4 w-4 text-blue-500" />} title="General Information" number={1} />
                        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                            <Field label="Name – Surname" required>
                                <input type="text" value={form.name} readOnly className={readOnlyCls} />
                            </Field>
                            <Field label="Employee ID" required>
                                <input type="text" value={form.employeeId} readOnly className={readOnlyCls} />
                            </Field>
                            <div className="col-span-2">
                                <Field label="License Category" required>
                                    <select value={form.licenseCategory} onChange={e => update('licenseCategory', e.target.value)} className={selectCls}>
                                        <option value="">Select License Category</option>
                                        {LICENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* ─── Section 2: Experiences Record ─── */}
                    <div>
                        <SectionHeader icon={<Briefcase className="h-4 w-4 text-blue-500" />} title="Experiences Record" number={2} />
                        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                            <Field label="Date to Perform Task" required>
                                <input type="date" value={form.dateToPerform} onChange={e => update('dateToPerform', e.target.value)} className={inputCls} />
                            </Field>
                            <Field label="Location" required>
                                <select value={form.location} onChange={e => update('location', e.target.value)} className={selectCls}>
                                    <option value="">Select Location</option>
                                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </Field>
                            <Field label="Aircraft Type" required>
                                <select value={form.aircraftType} onChange={e => update('aircraftType', e.target.value)} className={selectCls}>
                                    <option value="">Select Aircraft Type</option>
                                    {AIRCRAFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                            <Field label="Aircraft Registration" required>
                                <input type="text" value={form.aircraftRegistration} onChange={e => update('aircraftRegistration', e.target.value)} placeholder="e.g. HS-DBW" className={inputCls} />
                            </Field>
                            <Field label="Privilege Used" required>
                                <select value={form.privilegeUsed} onChange={e => update('privilegeUsed', e.target.value)} className={selectCls}>
                                    <option value="">Select Privilege</option>
                                    {PRIVILEGES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </Field>
                            <Field label="ATA Chapter" required>
                                <select value={form.ataChapter} onChange={e => update('ataChapter', e.target.value)} className={selectCls}>
                                    <option value="">Select ATA Chapter</option>
                                    {ATA_CHAPTERS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </Field>
                        </div>
                    </div>

                    {/* ─── Section 3: Task Details ─── */}
                    <div>
                        <SectionHeader icon={<Wrench className="h-4 w-4 text-blue-500" />} title="Task Details" number={3} />
                        <div className="space-y-5">
                            <Field label="Type of Maintenance (Rating)" required>
                                <CheckboxSelect options={MAINTENANCE_RATINGS} selected={form.maintenanceRatings} onChange={v => update('maintenanceRatings', v)} />
                            </Field>
                            <Field label="Type of Task" required>
                                <CheckboxSelect options={TASK_TYPES} selected={form.taskTypes} onChange={v => update('taskTypes', v)} />
                            </Field>
                            <Field label="Type of Activity" required>
                                <div className="flex flex-wrap gap-1.5">
                                    {ACTIVITY_TYPES.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => update('activityType', form.activityType === opt ? '' : opt)}
                                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all duration-150 cursor-pointer ${
                                                form.activityType === opt
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* ─── Section 4: References & Completion ─── */}
                    <div>
                        <SectionHeader icon={<Paperclip className="h-4 w-4 text-blue-500" />} title="References & Completion" number={4} />
                        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                            <div className="col-span-2">
                                <Field label="Maintenance References (Technical Logbook No. / Work Order No.)" required>
                                    <input type="text" value={form.maintenanceRef} onChange={e => update('maintenanceRef', e.target.value)} placeholder="e.g. TLB-2026-0135 or WO-2026-0421" className={inputCls} />
                                </Field>
                            </div>

                            {/* File Attachment */}
                            <div className="col-span-2">
                                <Field label="File Attachment">
                                    <div
                                        className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                                        <p className="text-xs font-semibold text-slate-500">Click to upload or drag & drop</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Word, Excel, PPT, PDF, Image, Video, Audio</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ACCEPTED_FILE_TYPES}
                                        multiple
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    {files.length > 0 && (
                                        <div className="mt-2 space-y-1.5">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className="text-xs text-slate-700 font-medium truncate flex-1">{f.name}</span>
                                                    <span className="text-[10px] text-slate-400 shrink-0">{formatFileSize(f.size)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors border-none bg-transparent shrink-0"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Field>
                            </div>

                            <Field label="Performed Duration (hrs)" required>
                                <input type="number" step="0.1" min="0" value={form.performedDuration} onChange={e => update('performedDuration', e.target.value)} placeholder="e.g. 2.5" className={inputCls} />
                            </Field>
                            <Field label="Authorized Stamp No." required>
                                <input type="text" value={form.authorizedStampNo} onChange={e => update('authorizedStampNo', e.target.value)} placeholder="e.g. STAMP-001" className={inputCls} />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            // TODO: submit form
                            onClose()
                        }}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-700"
                    >
                        Save Record
                    </button>
                </div>
            </div>
        </div>
    )
}
