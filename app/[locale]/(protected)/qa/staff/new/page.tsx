'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, Briefcase, Save, UserPlus, Camera, Trash2, ChevronDown, GraduationCap, Plus, Loader2 } from 'lucide-react'
import { useUpsertStaff, useUploadStaffFile } from '@/lib/api/hooks/useQAStaffManagement'
import { UpsertStaffRequest } from '@/lib/api/qa/staff-management'
import { toast } from 'sonner'
import { dateTimeUtils } from '@/lib/dayjs'

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
    staffType: string
    jobTitle: string
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
    staffType: '',
    jobTitle: '',
    startDate: dateTimeUtils.todayLocal(),
}

const POSITIONS = [
    { id: 1, name: 'Aircraft Mechanic' },
    { id: 2, name: 'Aircraft Inspector' },
    { id: 3, name: 'Certifying Staff (B1)' },
    { id: 4, name: 'Certifying Staff (B2)' },
    { id: 5, name: 'Certifying Staff (B1/B2)' },
    { id: 6, name: 'Avionics Technician' },
    { id: 7, name: 'Senior Engineer' },
    { id: 8, name: 'Line Maintenance Engineer' },
    { id: 9, name: 'Base Maintenance Engineer' },
    { id: 10, name: 'Quality Assurance Inspector' },
]

const DEPARTMENTS = [
    { id: 1, name: 'Line Maintenance' },
    { id: 2, name: 'Base Maintenance' },
    { id: 3, name: 'Quality Assurance' },
    { id: 4, name: 'Engineering' },
    { id: 5, name: 'Avionics' },
    { id: 6, name: 'Structures' },
    { id: 7, name: 'Planning' },
]

const STAFF_TYPES = [
    { id: 1, name: 'MECH' },
    { id: 2, name: 'CS' },
    { id: 3, name: 'Operational Staff' },
    { id: 4, name: 'Back Office' },
]

const TITLE_NAMES = ['Mr.', 'Mrs.', 'Ms.', 'Miss']

// ── Validation Rules ──
const VALIDATION_RULES: Record<string, { validate: (v: string) => string | null }> = {
    name: { validate: (v) => !v.trim() ? 'Full Name (Thai) is required' : null },
    nameEn: { validate: (v) => !v.trim() ? 'Full Name (English) is required' : !/^[a-zA-Z\s.'-]+$/.test(v.trim()) ? 'Please enter English characters only' : null },
    titleName: { validate: (v) => !v ? 'Title is required' : null },
    dob: { validate: (v) => !v ? 'Date of Birth is required' : null },
    idCard: { validate: (v) => !v.trim() ? 'Thai ID Card No. is required' : !/^\d[\d-]{12,16}\d$/.test(v.replace(/\s/g, '')) ? 'Invalid ID Card format (e.g. 1-1234-12345-12-3)' : null },
    nationality: { validate: (v) => !v.trim() ? 'Nationality is required' : null },
    phone: { validate: (v) => !v.trim() ? 'Phone is required' : !/^[0-9+\-()\s]{8,15}$/.test(v.trim()) ? 'Invalid phone number format' : null },
    email: { validate: (v) => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Invalid email format' : null },
    empId: { validate: (v) => !v.trim() ? 'Employee ID is required' : null },
    position: { validate: (v) => !v ? 'Position is required' : null },
    department: { validate: (v) => !v ? 'Department is required' : null },
    startDate: { validate: (v) => !v ? 'Start Date is required' : null },
}

// ── Reusable Components ──
const inputBase =
    'w-full text-sm px-3.5 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all'
const inputNormal = `${inputBase} border-slate-200 focus:ring-blue-100 focus:border-blue-300`
const inputError = `${inputBase} border-red-300 focus:ring-red-100 focus:border-red-400 bg-red-50/30`
const selectBase =
    'w-full text-sm px-3.5 py-2.5 rounded-lg border bg-white text-slate-800 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer'
const selectNormal = `${selectBase} border-slate-200 focus:ring-blue-100 focus:border-blue-300`
const selectError = `${selectBase} border-red-300 focus:ring-red-100 focus:border-red-400 bg-red-50/30`

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string | null; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>}
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

// ── Required fields for completion tracking ──
const REQUIRED_FIELDS: (keyof StaffForm)[] = [
    'name', 'nameEn', 'titleName', 'dob', 'idCard', 'nationality',
    'phone', 'email', 'empId', 'position', 'department', 'startDate'
]

// ── Main Page ──
export default function NewStaffPage() {
    const router = useRouter()
    const [form, setForm] = useState<StaffForm>(INITIAL_FORM)
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [profileImagePath, setProfileImagePath] = useState<string>('')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [educations, setEducations] = useState<EducationItem[]>([])
    const [experiences, setExperiences] = useState<ExperienceItem[]>([])
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [submitAttempted, setSubmitAttempted] = useState(false)

    // ── API Mutations ──
    const upsertMutation = useUpsertStaff()
    const uploadMutation = useUploadStaffFile()

    const update = (field: keyof StaffForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const touch = useCallback((field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }))
    }, [])

    // ── Validation ──
    const getError = useCallback((field: keyof StaffForm): string | null => {
        if (!submitAttempted && !touched[field]) return null
        const rule = VALIDATION_RULES[field]
        if (!rule) return null
        return rule.validate(form[field])
    }, [form, touched, submitAttempted])

    const hasErrors = useMemo(() => {
        return Object.keys(VALIDATION_RULES).some(field => {
            const rule = VALIDATION_RULES[field]
            return rule.validate(form[field as keyof StaffForm]) !== null
        })
    }, [form])

    const inputCls = useCallback((field: keyof StaffForm) => {
        return getError(field) ? inputError : inputNormal
    }, [getError])

    const selCls = useCallback((field: keyof StaffForm) => {
        return getError(field) ? selectError : selectNormal
    }, [getError])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate image file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
        const extension = (file.name.split('.').pop() || '').toLowerCase()

        if (!file.type.startsWith('image/') || !allowedTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
            toast.error('Please select an image file only (JPG, PNG, GIF, WEBP, SVG)')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file)
        setProfileImage(localUrl)

        // Convert file to base64
        const reader = new FileReader()
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1] // strip data:...;base64,
            const extension = file.name.split('.').pop() || 'jpg'
            const fileName = file.name.replace(/\.[^/.]+$/, '') // filename without extension

            setIsUploading(true)
            uploadMutation.mutate(
                {
                    FileBase64: base64,
                    FileType: 'staff_profile',
                    ExtensionFile: extension,
                    FileName: fileName,
                },
                {
                    onSuccess: (response) => {
                        const filePath = response.responseData?.[0]?.filePath || ''
                        setProfileImagePath(filePath)
                        setIsUploading(false)
                        toast.success('Photo uploaded successfully')
                    },
                    onError: (error) => {
                        setIsUploading(false)
                        toast.error(error.message || 'Failed to upload photo')
                    },
                }
            )
        }
        reader.readAsDataURL(file)

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRemovePhoto = () => {
        setProfileImage(null)
        setProfileImagePath('')
    }

    // ── Completion calculation ──
    const { filled, total, pct } = useMemo(() => {
        const filledCount = REQUIRED_FIELDS.filter(f => form[f].trim() !== '').length
        const totalCount = REQUIRED_FIELDS.length
        return {
            filled: filledCount,
            total: totalCount,
            pct: Math.round((filledCount / totalCount) * 100),
        }
    }, [form])

    const isComplete = pct === 100

    // ── Build API request body ──
    const buildRequestBody = (): UpsertStaffRequest => {
        // Map form position/department name → id
        const positionId = POSITIONS.find(p => p.name === form.position)?.id ?? 0
        const departmentId = DEPARTMENTS.find(d => d.name === form.department)?.id ?? 0
        const staffstypeid = STAFF_TYPES.find(s => s.name === form.staffType)?.id ?? 1

        return {
            staffId: 0, // new staff
            title: form.titleName.replace('.', ''), // "Mr." → "Mr"
            fullNameTh: form.name,
            fullNameEn: form.nameEn,
            dateOfBirth: form.dob || '',
            placeOfBirth: form.placeOfBirth || '',
            nationality: form.nationality || '',
            idCardNo: form.idCard || '',
            phone: form.phone || '',
            email: form.email || '',
            address: form.address || '',
            employeeId: form.empId || '',
            startDate: form.startDate || '',
            positionId,
            departmentId,
            staffstypeid,
            jobTitle: form.jobTitle || form.position || '',
            profileImagePath: profileImagePath,
            educations: educations.map((edu, idx) => ({
                id: idx,
                degree: edu.degree,
                institution: edu.institution,
                fieldOfStudy: edu.field,
                year: parseInt(edu.year) || 0,
            })),
            workExperiences: experiences.map((exp, idx) => ({
                id: idx,
                jobTitle: exp.title,
                company: exp.company,
                periodFrom: exp.periodFrom || '',
                periodTo: exp.periodTo || '',
                description: exp.description || '',
            })),
            userName: 'system',
        }
    }

    const handleSubmit = async () => {
        setSubmitAttempted(true)

        if (hasErrors || !isComplete) {
            toast.error('Please fix all validation errors before submitting')
            return
        }

        const body = buildRequestBody()

        upsertMutation.mutate(body, {
            onSuccess: (response) => {
                const staffId = response.responseData?.[0]?.staffId
                toast.success('Staff registered successfully!')
                if (staffId) {
                    router.push(`/en/qa/staff/${staffId}`)
                } else {
                    router.push('/en/qa/staff')
                }
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to register staff')
            },
        })
    }

    const saving = upsertMutation.isPending

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
                            disabled={saving || !isComplete}
                            title={!isComplete ? `Please complete all required fields (${filled}/${total})` : ''}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Register
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
                                <Field label="Title" required error={getError('titleName')}>
                                    <select value={form.titleName} onChange={e => update('titleName', e.target.value)} onBlur={() => touch('titleName')} className={selCls('titleName')}>
                                        <option value="">Select Title</option>
                                        {TITLE_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Full Name (Thai)" required error={getError('name')}>
                                    <input type="text" value={form.name} onChange={e => update('name', e.target.value)} onBlur={() => touch('name')} placeholder="ชื่อ-นามสกุล ภาษาไทย" className={inputCls('name')} />
                                </Field>
                                <Field label="Full Name (English)" required error={getError('nameEn')}>
                                    <input type="text" value={form.nameEn} onChange={e => update('nameEn', e.target.value)} onBlur={() => touch('nameEn')} placeholder="Full name in English" className={inputCls('nameEn')} />
                                </Field>
                                <Field label="Date of Birth" required error={getError('dob')}>
                                    <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)} onBlur={() => touch('dob')} className={inputCls('dob')} />
                                </Field>
                                <Field label="Place of Birth">
                                    <input type="text" value={form.placeOfBirth} onChange={e => update('placeOfBirth', e.target.value)} placeholder="e.g. Bangkok" className={inputNormal} />
                                </Field>
                                <Field label="Nationality" required error={getError('nationality')}>
                                    <input type="text" value={form.nationality} onChange={e => update('nationality', e.target.value)} onBlur={() => touch('nationality')} placeholder="e.g. Thai" className={inputCls('nationality')} />
                                </Field>
                                <div className="col-span-2">
                                    <Field label="Thai ID Card No." required error={getError('idCard')}>
                                        <input type="text" value={form.idCard} onChange={e => update('idCard', e.target.value)} onBlur={() => touch('idCard')} placeholder="x-xxxx-xxxxx-xx-x" className={inputCls('idCard')} />
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
                                <Field label="Phone" required error={getError('phone')}>
                                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} onBlur={() => touch('phone')} placeholder="0xx-xxx-xxxx" className={inputCls('phone')} />
                                </Field>
                                <Field label="Email" required error={getError('email')}>
                                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)} onBlur={() => touch('email')} placeholder="name@company.com" className={inputCls('email')} />
                                </Field>
                                <div className="col-span-2">
                                    <Field label="Address">
                                        <textarea
                                            value={form.address}
                                            onChange={e => update('address', e.target.value)}
                                            placeholder="Full address"
                                            rows={3}
                                            className={`${inputNormal} resize-none`}
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
                                <Field label="Employee ID" required error={getError('empId')}>
                                    <input type="text" value={form.empId} onChange={e => update('empId', e.target.value)} onBlur={() => touch('empId')} placeholder="e.g. EMP-0001" className={inputCls('empId')} />
                                </Field>
                                <Field label="Start Date" required error={getError('startDate')}>
                                    <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} onBlur={() => touch('startDate')} className={inputCls('startDate')} />
                                </Field>
                                <Field label="Position" required error={getError('position')}>
                                    <select value={form.position} onChange={e => update('position', e.target.value)} onBlur={() => touch('position')} className={selCls('position')}>
                                        <option value="">Select Position</option>
                                        {POSITIONS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Department" required error={getError('department')}>
                                    <select value={form.department} onChange={e => update('department', e.target.value)} onBlur={() => touch('department')} className={selCls('department')}>
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Staff Type">
                                    <select value={form.staffType} onChange={e => update('staffType', e.target.value)} className={selectNormal}>
                                        <option value="">Select Staff Type</option>
                                        {STAFF_TYPES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Job Title">
                                    <input type="text" value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} placeholder="e.g. Senior Aircraft Mechanic" className={inputNormal} />
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
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <Field label="Institution" required>
                                                <input
                                                    type="text"
                                                    value={edu.institution}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, institution: e.target.value } : item))}
                                                    placeholder="e.g. Kasetsart University"
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <Field label="Field of Study">
                                                <input
                                                    type="text"
                                                    value={edu.field}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, field: e.target.value } : item))}
                                                    placeholder="e.g. Aeronautical Engineering"
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <Field label="Year" required>
                                                <input
                                                    type="text"
                                                    value={edu.year}
                                                    onChange={e => setEducations(prev => prev.map((item, idx) => idx === i ? { ...item, year: e.target.value } : item))}
                                                    placeholder="e.g. 2020"
                                                    className={inputNormal}
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
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <Field label="Company" required>
                                                <input
                                                    type="text"
                                                    value={exp.company}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, company: e.target.value } : item))}
                                                    placeholder="e.g. Thai Airways"
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <Field label="Period From" required>
                                                <input
                                                    type="date"
                                                    value={exp.periodFrom}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, periodFrom: e.target.value } : item))}
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <Field label="Period To">
                                                <input
                                                    type="date"
                                                    value={exp.periodTo}
                                                    onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, periodTo: e.target.value } : item))}
                                                    className={inputNormal}
                                                />
                                            </Field>
                                            <div className="col-span-2">
                                                <Field label="Description">
                                                    <textarea
                                                        value={exp.description}
                                                        onChange={e => setExperiences(prev => prev.map((item, idx) => idx === i ? { ...item, description: e.target.value } : item))}
                                                        placeholder="Job responsibilities and achievements"
                                                        rows={2}
                                                        className={`${inputNormal} resize-none`}
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
                                        className="w-40 h-40 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden cursor-pointer relative"
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                    >
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : form.nameEn ? (
                                            form.nameEn.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
                                        ) : (
                                            <User className="h-8 w-8 text-white/60" />
                                        )}
                                        {/* Uploading overlay */}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        {!isUploading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl">
                                                <Camera className="h-5 w-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {profileImage && !isUploading && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemovePhoto() }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white cursor-pointer hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 cursor-pointer bg-transparent border-none mb-2 transition-colors"
                                >
                                    {isUploading ? 'Uploading...' : profileImage ? 'Change Photo' : 'Upload Photo'}
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
                                {!isComplete && (
                                    <p className="text-[10px] text-amber-500 mt-2 font-medium">
                                        ⚠ Complete all required fields to enable Save Register
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}