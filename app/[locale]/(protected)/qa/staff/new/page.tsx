'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Briefcase, Save, UserPlus, Camera, Trash2, ChevronDown, GraduationCap, Plus } from 'lucide-react'

// ── Form State ──
interface StaffForm {
    // Personal Info
    name: string
    nameEn: string
    titleName: string
    dob: string
    placeOfBirth: string
    idCard: string
    nationality: string
    // Contact
    phone: string
    email: string
    address: string
    // Employment
    empId: string
    position: string
    department: string
    startDate: string
}

interface EducationItem {
    degree: string
    institution: string
    field: string
    year: string
}

interface ExperienceItem {
    title: string
    company: string
    periodFrom: string
    periodTo: string
    description: string
}

const INITIAL_FORM: StaffForm = {
    name: '',
    nameEn: '',
    titleName: '',
    dob: '',
    placeOfBirth: '',
    idCard: '',
    nationality: 'Thai',
    phone: '',
    email: '',
    address: '',
    empId: '',
    position: '',
    department: '',
    startDate: new Date().toISOString().split('T')[0],
}

const POSITIONS = [
    'Aircraft Mechanic',
    'Aircraft Inspector',
    'Certifying Staff (B1)',
    'Certifying Staff (B2)',
    'Certifying Staff (B1/B2)',
    'Avionics Technician',
    'Senior Engineer',
    'Line Maintenance Engineer',
    'Base Maintenance Engineer',
    'Quality Assurance Inspector',
]

const DEPARTMENTS = [
    'Line Maintenance',
    'Base Maintenance',
    'Quality Assurance',
    'Engineering',
    'Avionics',
    'Structures',
    'Planning',
]

const TITLE_NAMES = ['Mr.', 'Mrs.', 'Ms.', 'Miss']

// ── Reusable Components ──
const inputCls =
    'w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all'
const selectCls =
    'w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all appearance-none cursor-pointer'

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

function SectionCard({
    icon,
    iconBg,
    iconColor,
    title,
    description,
    children,
    defaultOpen = true,
}: {
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    title: string
    description: string
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
            <div
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => setOpen(prev => !prev)}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: iconBg, color: iconColor }}
                >
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-slate-800">{title}</div>
                    <div className="text-xs text-slate-400">{description}</div>
                </div>
                <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
            {open && (
                <div className="border-t border-slate-100 mt-4 pt-5">
                    {children}
                </div>
            )}
        </div>
    )
}

// ── Main Page ──
export default function NewStaffPage() {
    const router = useRouter()
    const [form, setForm] = useState<StaffForm>(INITIAL_FORM)
    const [saving, setSaving] = useState(false)
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [educations, setEducations] = useState<EducationItem[]>([])
    const [experiences, setExperiences] = useState<ExperienceItem[]>([])

    const update = (field: keyof StaffForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setProfileImage(url)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }



    const handleSubmit = async () => {
        setSaving(true)
        // TODO: call API to create staff
        console.log('Create staff:', form)
        setTimeout(() => {
            setSaving(false)
            router.push('/en/qa/staff')
        }, 1000)
    }

    return (
        <div className="p-8 min-h-screen rounded-xl">
            <div className="bg-slate-50 rounded-xl p-8">
                {/* ── Top Bar ── */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-white text-slate-600 cursor-pointer transition-all duration-200 shrink-0 hover:border-slate-400 hover:text-slate-800 hover:shadow-sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">New Staff Registration</h1>
                            <p className="text-sm text-slate-400">Fill in the information below to register a new staff member</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Register Staff
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                        {/* ─── Section 1: Personal Info ─── */}
                        <SectionCard
                            icon={<User className="h-4 w-4" />}
                            iconBg="#eff6ff"
                            iconColor="#2563eb"
                            title="Personal Info"
                            description="Basic personal information of the staff member"
                        >
                            <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                                <Field label="Title" required>
                                    <select value={form.titleName} onChange={e => update('titleName', e.target.value)} className={selectCls}>
                                        <option value="">Select Title</option>
                                        {TITLE_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Full Name (Thai)" required>
                                    <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="ชื่อ-นามสกุล ภาษาไทย" className={inputCls} />
                                </Field>
                                <Field label="Full Name (English)" required>
                                    <input type="text" value={form.nameEn} onChange={e => update('nameEn', e.target.value)} placeholder="Full name in English" className={inputCls} />
                                </Field>
                                <Field label="Date of Birth" required>
                                    <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Place of Birth">
                                    <input type="text" value={form.placeOfBirth} onChange={e => update('placeOfBirth', e.target.value)} placeholder="e.g. Bangkok" className={inputCls} />
                                </Field>
                                <Field label="Nationality" required>
                                    <input type="text" value={form.nationality} onChange={e => update('nationality', e.target.value)} placeholder="e.g. Thai" className={inputCls} />
                                </Field>
                                <div className="col-span-2">
                                    <Field label="Thai ID Card No." required>
                                        <input type="text" value={form.idCard} onChange={e => update('idCard', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" className={inputCls} />
                                    </Field>
                                </div>
                            </div>
                        </SectionCard>

                        {/* ─── Section 2: Contact ─── */}
                        <SectionCard
                            icon={<Phone className="h-4 w-4" />}
                            iconBg="#f0fdf4"
                            iconColor="#16a34a"
                            title="Contact"
                            description="Contact details and address"
                        >
                            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                                <Field label="Phone" required>
                                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="0xx-xxx-xxxx" className={inputCls} />
                                </Field>
                                <Field label="Email" required>
                                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="name@company.com" className={inputCls} />
                                </Field>
                                <div className="col-span-2">
                                    <Field label="Address">
                                        <textarea
                                            value={form.address}
                                            onChange={e => update('address', e.target.value)}
                                            placeholder="Full address"
                                            rows={3}
                                            className={`${inputCls} resize-none`}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </SectionCard>

                        {/* ─── Section 3: Employment ─── */}
                        <SectionCard
                            icon={<Briefcase className="h-4 w-4" />}
                            iconBg="#fef3c7"
                            iconColor="#d97706"
                            title="Employment"
                            description="Job position and department assignment"
                        >
                            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                                <Field label="Employee ID" required>
                                    <input type="text" value={form.empId} onChange={e => update('empId', e.target.value)} placeholder="e.g. EMP-0001" className={inputCls} />
                                </Field>
                                <Field label="Start Date" required>
                                    <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Position" required>
                                    <select value={form.position} onChange={e => update('position', e.target.value)} className={selectCls}>
                                        <option value="">Select Position</option>
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </Field>
                                <Field label="Department" required>
                                    <select value={form.department} onChange={e => update('department', e.target.value)} className={selectCls}>
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </SectionCard>

                        {/* ─── Section 4: Education ─── */}
                        <SectionCard
                            icon={<GraduationCap className="h-4 w-4" />}
                            iconBg="#eff6ff"
                            iconColor="#2563eb"
                            title={`Education${educations.length > 0 ? ` (${educations.length})` : ''}`}
                            description="Academic qualifications and certifications"
                            defaultOpen={false}
                        >
                            <div className="space-y-4">
                                {educations.map((edu, i) => (
                                    <div key={i} className="relative border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                                        <button
                                            type="button"
                                            onClick={() => setEducations(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors border-none bg-transparent"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                                            <Field label="Degree" required>
                                                <input
                                                    type="text"
                                                    value={edu.degree}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, degree: e.target.value } : item))}
                                                    placeholder="e.g. Bachelor of Engineering"
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <Field label="Institution" required>
                                                <input
                                                    type="text"
                                                    value={edu.institution}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, institution: e.target.value } : item))}
                                                    placeholder="e.g. Kasetsart University"
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <Field label="Field of Study">
                                                <input
                                                    type="text"
                                                    value={edu.field}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, field: e.target.value } : item))}
                                                    placeholder="e.g. Aeronautical Engineering"
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <Field label="Year" required>
                                                <input
                                                    type="text"
                                                    value={edu.year}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, year: e.target.value } : item))}
                                                    placeholder="e.g. 2020"
                                                    className={inputCls}
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setEducations(prev => [...prev, { degree: '', institution: '', field: '', year: '' }])}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all bg-transparent"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Education
                                </button>
                            </div>
                        </SectionCard>

                        {/* ─── Section 5: Work Experience ─── */}
                        <SectionCard
                            icon={<Briefcase className="h-4 w-4" />}
                            iconBg="#fef3c7"
                            iconColor="#d97706"
                            title={`Work Experience${experiences.length > 0 ? ` (${experiences.length})` : ''}`}
                            description="Previous employment and work history"
                            defaultOpen={false}
                        >
                            <div className="space-y-4">
                                {experiences.map((exp, i) => (
                                    <div key={i} className="relative border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                                        <button
                                            type="button"
                                            onClick={() => setExperiences(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors border-none bg-transparent"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                                            <Field label="Job Title" required>
                                                <input
                                                    type="text"
                                                    value={exp.title}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, title: e.target.value } : item))}
                                                    placeholder="e.g. Aircraft Mechanic"
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <Field label="Company" required>
                                                <input
                                                    type="text"
                                                    value={exp.company}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, company: e.target.value } : item))}
                                                    placeholder="e.g. Thai Airways"
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <Field label="Period From" required>
                                                <input
                                                    type="date"
                                                    value={exp.periodFrom}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, periodFrom: e.target.value } : item))}
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <Field label="Period To">
                                                <input
                                                    type="date"
                                                    value={exp.periodTo}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, periodTo: e.target.value } : item))}
                                                    className={inputCls}
                                                />
                                            </Field>
                                            <div className="col-span-2">
                                                <Field label="Description">
                                                    <textarea
                                                        value={exp.description}
                                                        onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))}
                                                        placeholder="Job responsibilities and achievements"
                                                        rows={2}
                                                        className={`${inputCls} resize-none`}
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setExperiences(prev => [...prev, { title: '', company: '', periodFrom: '', periodTo: '', description: '' }])}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 cursor-pointer transition-all bg-transparent"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Work Experience
                                </button>
                            </div>
                        </SectionCard>
                    </div>

                    {/* ── Right Column: Summary Preview ── */}
                    <div className="col-span-4">
                        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 sticky top-8">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800 mb-5 pb-3.5 border-b border-slate-100">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                                    <UserPlus className="h-4 w-4" />
                                </div>
                                Preview
                            </div>

                            {/* Avatar Preview */}
                            <div className="flex flex-col items-center mb-5">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <div className="relative group mb-3">
                                    <div
                                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : form.nameEn ? (
                                            form.nameEn.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
                                        ) : (
                                            <User className="h-8 w-8 text-white/60" />
                                        )}
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl">
                                            <Camera className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    {profileImage && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setProfileImage(null) }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white cursor-pointer hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 cursor-pointer bg-transparent border-none mb-2 transition-colors"
                                >
                                    {profileImage ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                <span className="text-sm font-bold text-slate-800">
                                    {form.name || 'ชื่อ-นามสกุล'}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {form.nameEn || 'Full Name'}
                                </span>
                            </div>

                            {/* Info Preview */}
                            <div className="space-y-3">
                                {[
                                    { label: 'Employee ID', value: form.empId },
                                    { label: 'Position', value: form.position },
                                    { label: 'Department', value: form.department },
                                    { label: 'Phone', value: form.phone },
                                    { label: 'Email', value: form.email },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center py-1.5">
                                        <span className="text-xs font-medium text-slate-400">{item.label}</span>
                                        <span className={`text-xs font-medium ${item.value ? 'text-slate-700' : 'text-slate-300'}`}>
                                            {item.value || '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Completion Progress */}
                            <div className="mt-5 pt-4 border-t border-slate-100">
                                {(() => {
                                    const requiredFields: (keyof StaffForm)[] = ['name', 'nameEn', 'dob', 'idCard', 'nationality', 'phone', 'email', 'empId', 'position', 'department', 'startDate', 'titleName']
                                    const filled = requiredFields.filter(f => form[f].trim() !== '').length
                                    const total = requiredFields.length
                                    const pct = Math.round((filled / total) * 100)
                                    return (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-slate-500">Completion</span>
                                                <span className="text-xs font-bold text-slate-700">{filled}/{total} fields</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}