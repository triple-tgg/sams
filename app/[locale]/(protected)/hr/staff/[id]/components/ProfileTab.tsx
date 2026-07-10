'use client'

import { useState, useRef, useCallback } from 'react'
import { User, Phone, Briefcase, Pencil, Award, Plane, FileText, Shield, ExternalLink, Upload, X, Loader2, CheckCircle2, Save, Check, AlertTriangle } from 'lucide-react'
import { StaffData } from '../types'
import { formatDate } from '../utils'
import { EditPersonalInfoModal } from './EditPersonalInfoModal'
import { EditContactModal } from './EditContactModal'
import { EditEmploymentModal } from './EditEmploymentModal'
import { EditLicenseModal } from './EditLicenseModal'
import { EditAircraftModal } from './EditAircraftModal'
import { useUpsertStaff, useUploadStaffFile } from '@/lib/api/hooks/useQAStaffManagement'
import { StaffByIdData, UpsertStaffRequest, UpsertEducation, UpsertWorkExperience } from '@/lib/api/qa/staff-management'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard"

// ── Constants ──
const AIRCRAFT_TYPE_LICENSES = [
    'B737-600/700/800/900',
    'B737-7/8/9',
    'A318/A319/A320/A321',
    'B777-200/300/300ER',
    'A330-200/300/800/900',
    'B787-8/9/10',
    'B767-200/300',
    'A350-900/1000',
    'ERJ-190',
]

const AMEL_LICENSE_CATEGORIES = [
    { code: 'B1.1', label: 'B1.1 — Aeroplane Turbine' },
    { code: 'B1.2', label: 'B1.2 — Aeroplane Piston' },
    { code: 'B1.3', label: 'B1.3 — Helicopter Turbine' },
    { code: 'B1.4', label: 'B1.4 — Helicopter Piston' },
    { code: 'B2', label: 'B2 — Avionics' },
    { code: 'C', label: 'C — Base Maintenance' },
]

const DOCUMENT_TYPES: { key: string; label: string; subtitle?: string }[] = [
    { key: 'id_card', label: 'ID Card' },
    { key: 'passport', label: 'Passport' },
    { key: 'cv', label: 'CV' },
    { key: 'amel', label: 'AMEL', subtitle: 'For Certifying Staff' },
    { key: 'experience_log', label: 'Previous Experience Log', subtitle: 'For Certifying Staff' },
    { key: 'training_records', label: 'Previous Training Records', subtitle: 'For Certifying Staff' },
    { key: 'aircraft_type_cert', label: 'Aircraft Type Certificate', subtitle: 'For Certifying Staff' },
]

// ── Reusable Info Row ──
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 tracking-wide">{label}</span>
            <span className={`text-sm font-medium text-slate-800 ${mono ? '' : ''}`}>{value}</span>
        </div>
    )
}

// ── Section Wrapper ──
function Section({
    icon,
    iconBg,
    iconColor,
    title,
    onEdit,
    children,
}: {
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    title: string
    onEdit?: () => void
    children: React.ReactNode
}) {
    return (
        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: iconBg, color: iconColor }}
                    >
                        {icon}
                    </div>
                    {title}
                </div>
                {onEdit && (
                    <PermissionActionGuard menuCode="QA_STAFF" action="canEdit">
                        <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                            onClick={onEdit}
                            title={`Edit ${title}`}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    </PermissionActionGuard>
                )}
            </div>
            {children}
        </div>
    )
}

// ── Document upload slot state ──
interface DocSlotState {
    key: string
    label: string
    subtitle?: string
    // from API (existing uploaded)
    existingId: number
    fileName: string
    filePath: string
    // upload state
    uploading: boolean
}

function buildDocSlots(apiDocs: StaffByIdData['staffDocumentList']): DocSlotState[] {
    const existingByType: Record<string, typeof apiDocs[0]> = {}
    for (const d of (apiDocs || [])) {
        if (!d.isdelete) existingByType[d.documentType] = d
    }
    return DOCUMENT_TYPES.map(dt => {
        const existing = existingByType[dt.key]
        return {
            key: dt.key,
            label: dt.label,
            subtitle: dt.subtitle,
            existingId: existing?.id || 0,
            fileName: existing?.fileName || '',
            filePath: existing?.filePath || '',
            uploading: false,
        }
    })
}

// ── Profile Tab ──
export function ProfileTab({ staff, apiData }: { staff: StaffData, apiData?: StaffByIdData }) {
    const [showEditPersonal, setShowEditPersonal] = useState(false)
    const [showEditContact, setShowEditContact] = useState(false)
    const [showEditEmployment, setShowEditEmployment] = useState(false)
    const [showEditLicense, setShowEditLicense] = useState(false)
    const [showEditAircraft, setShowEditAircraft] = useState(false)
    const [savingAircraft, setSavingAircraft] = useState(false)
    const [editDocMode, setEditDocMode] = useState(false)
    const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<string | null>(null)
    const [confirmDeleteAmelDoc, setConfirmDeleteAmelDoc] = useState(false)
    const [isUploadingAmel, setIsUploadingAmel] = useState(false)
    const amelInputRef = useRef<HTMLInputElement>(null)

    const queryClient = useQueryClient()
    const upsertMutation = useUpsertStaff()
    const uploadMutation = useUploadStaffFile()

    // Derived data from API
    const aircraftLicenses = apiData?.staffAircraftLicenseList?.filter(l => !l.isdelete) || []
    const amelLicenses = apiData?.staffAmelLicenseList?.filter(l => !l.isdelete) || []
    const amelLicense = amelLicenses[0]

    // ── Document Slots State ──
    const [docSlots, setDocSlots] = useState<DocSlotState[]>(() => buildDocSlots(apiData?.staffDocumentList || []))
    const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

    // Sync docSlots when apiData changes (after refetch)
    const lastApiDataId = useRef<number | null>(null)
    if (apiData && apiData.id !== lastApiDataId.current) {
        lastApiDataId.current = apiData.id
    }

    // Re-sync slots when api data updates (e.g. after upsert)
    const syncDocSlots = useCallback(() => {
        if (apiData?.staffDocumentList) {
            setDocSlots(buildDocSlots(apiData.staffDocumentList))
        }
    }, [apiData?.staffDocumentList])

    // ── Document Upload Handler ──
    const handleDocUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx']
        const extension = (file.name.split('.').pop() || '').toLowerCase()
        if (!allowedExtensions.includes(extension)) {
            toast.error('Unsupported file type. Please upload an image (JPG, PNG) or document (PDF, DOC, DOCX)')
            const ref = docInputRefs.current[docKey]
            if (ref) ref.value = ''
            return
        }

        // Set uploading state
        setDocSlots(prev => prev.map(s => s.key === docKey ? { ...s, uploading: true } : s))

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            const ext = file.name.split('.').pop() || 'pdf'
            const fName = file.name.replace(/\.[^/.]+$/, '')

            uploadMutation.mutate(
                { FileBase64: base64, FileType: docKey, ExtensionFile: ext, FileName: fName },
                {
                    onSuccess: (response) => {
                        const filePath = response.responseData?.[0]?.filePath || ''
                        const fileName = response.responseData?.[0]?.fileName || file.name

                        // Update local slot
                        setDocSlots(prev => prev.map(s => s.key === docKey ? { ...s, filePath, fileName, uploading: false } : s))

                        // Auto-save to upsert API
                        saveDocumentList(docKey, { filePath, fileName })
                    },
                    onError: (error) => {
                        setDocSlots(prev => prev.map(s => s.key === docKey ? { ...s, uploading: false } : s))
                        toast.error(error.message || 'Upload failed')
                    },
                }
            )
        }
        reader.readAsDataURL(file)

        const ref = docInputRefs.current[docKey]
        if (ref) ref.value = ''
    }

    // ── Save document list via upsert ──
    const saveDocumentList = (updatedKey: string, updatedDoc: { filePath: string; fileName: string }) => {
        if (!apiData) return

        // Build doc list from current slots + the just-uploaded one
        const currentSlots = docSlots.map(s => {
            if (s.key === updatedKey) {
                return { ...s, filePath: updatedDoc.filePath, fileName: updatedDoc.fileName }
            }
            return s
        })

        const docList = currentSlots
            .filter(s => s.filePath)
            .map(s => ({
                id: s.existingId,
                documentType: s.key,
                fileName: s.fileName,
                filePath: s.filePath,
            }))

        const payload = buildUpsertPayload({ staffDocumentList: docList })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Document saved successfully')
                queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData.id] })
            },
            onError: (err) => toast.error(err.message || 'Failed to save document')
        })
    }

    // ── Remove document ──
    const handleRemoveDoc = (docKey: string) => {
        if (!apiData) return

        setDocSlots(prev => prev.map(s => s.key === docKey ? { ...s, filePath: '', fileName: '', existingId: 0 } : s))

        // Build doc list without the removed one
        const docList = docSlots
            .filter(s => s.filePath && s.key !== docKey)
            .map(s => ({
                id: s.existingId,
                documentType: s.key,
                fileName: s.fileName,
                filePath: s.filePath,
            }))

        const payload = buildUpsertPayload({ staffDocumentList: docList })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('Document removed')
                queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData.id] })
            },
            onError: (err) => toast.error(err.message || 'Failed to remove document')
        })
    }

    const buildUpsertPayload = (overrideFields: Partial<UpsertStaffRequest>): UpsertStaffRequest | null => {
        if (!apiData) {
            toast.error("Cannot edit: raw API data is missing.")
            return null
        }

        const documents = apiData.staffDocumentList?.filter(d => !d.isdelete) || []

        return {
            staffId: apiData.id,
            title: apiData.title || '',
            fullNameTh: apiData.name || '',
            fullNameEn: apiData.fullNameEn || '',
            dateOfBirth: apiData.dateOfBirth || '',
            placeOfBirth: apiData.placeOfBirth || '',
            nationality: apiData.nationality || '',
            idCardNo: apiData.idCardNo || '',
            phone: apiData.phone || '',
            email: apiData.email || '',
            address: apiData.address || '',
            employeeId: apiData.employeeId || '',
            startDate: apiData.startDate || '',
            positionId: apiData.positionObj?.id || 0,
            departmentId: apiData.departmentObj?.id || 0,
            staffstypeid: apiData.staffstypeObj?.id || 0,
            jobTitle: apiData.jobTitle || '',
            profileImagePath: apiData.profileImagePath || '',
            educations: (apiData.educations || []) as UpsertEducation[],
            workExperiences: (apiData.workExperiences || []) as UpsertWorkExperience[],
            staffDocumentList: documents.map(d => ({
                id: d.id,
                documentType: d.documentType,
                fileName: d.fileName,
                filePath: d.filePath,
            })),
            staffAircraftLicenseList: aircraftLicenses.map(l => ({
                id: l.id,
                aircraftTypeId: l.aircraftTypeId,
            })),
            staffAmelLicenseList: amelLicenses.map(l => ({
                id: l.id,
                licenseNumber: l.licenseNumber,
                categoryId: l.categoryId,
                issuedDate: l.issuedDate || '',
                expiryDate: l.expiryDate || '',
                limitations: l.limitations || '',
                aircraftRatings: l.aircraftRatings || '',
                attachmentFilePath: l.attachmentFilePath || '',
                attachmentFileName: l.attachmentFileName || '',
            })),
            userName: "system",
            ...overrideFields,
        }
    }

    const handleSavePersonal = (data: any) => {
        const payload = buildUpsertPayload({
            title: data.titleNameTH || data.titleNameEN || '',
            fullNameTh: data.name,
            fullNameEn: data.nameEn,
            dateOfBirth: data.dob,
            placeOfBirth: data.placeOfBirth,
            idCardNo: data.idCard,
            nationality: data.nationality,
        })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Personal info updated successfully")
                setShowEditPersonal(false)
            },
            onError: (err) => toast.error(err.message || "Failed to update personal info")
        })
    }

    const handleSaveContact = (data: any) => {
        const payload = buildUpsertPayload({
            phone: data.phone,
            email: data.email,
            address: data.address,
        })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Contact info updated successfully")
                setShowEditContact(false)
            },
            onError: (err) => toast.error(err.message || "Failed to update contact info")
        })
    }

    const handleSaveEmployment = (data: any) => {
        const payload = buildUpsertPayload({
            employeeId: data.empId,
            startDate: data.startDate,
            positionId: data.position ? Number(data.position) : (apiData?.positionObj?.id || 0),
            departmentId: data.department ? Number(data.department) : (apiData?.departmentObj?.id || 0),
        })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Employment info updated successfully")
                setShowEditEmployment(false)
            },
            onError: (err) => toast.error(err.message || "Failed to update employment info")
        })
    }

    const handleDeleteAmelDoc = () => {
        if (!apiData) return
        const existingLicenses = apiData.staffAmelLicenseList || []
        if (existingLicenses.length === 0) return

        const amelLicense = existingLicenses[0]
        const payload = buildUpsertPayload({
            staffAmelLicenseList: [
                {
                    ...amelLicense,
                    attachmentFilePath: '',
                    attachmentFileName: '',
                }
            ]
        })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success('AMEL attachment deleted successfully')
                setConfirmDeleteAmelDoc(false)
                queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData.id] })
            },
            onError: (err) => toast.error(err.message || 'Failed to delete attachment')
        })
    }

    const handleUploadAmelDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
        const extension = (file.name.split('.').pop() || '').toLowerCase()
        if (!allowedExtensions.includes(extension)) {
            toast.error('Unsupported file type. Please upload an image or document.')
            if (amelInputRef.current) amelInputRef.current.value = ''
            return
        }

        setIsUploadingAmel(true)
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            const ext = file.name.split('.').pop() || 'pdf'
            const fName = file.name.replace(/\.[^/.]+$/, '')

            uploadMutation.mutate(
                { FileBase64: base64, FileType: 'amel_license', ExtensionFile: ext, FileName: fName },
                {
                    onSuccess: (response) => {
                        const filePath = response.responseData?.[0]?.filePath || ''
                        const fileName = response.responseData?.[0]?.fileName || file.name

                        // Save to AMEL license object
                        const existingLicenses = apiData?.staffAmelLicenseList || []
                        const currentLicense = existingLicenses.length > 0 ? existingLicenses[0] : null
                        const payload = buildUpsertPayload({
                            staffAmelLicenseList: [
                                {
                                    id: currentLicense?.id || 0,
                                    licenseNumber: currentLicense?.licenseNumber || '',
                                    categoryId: currentLicense?.categoryId || 1,
                                    issuedDate: currentLicense?.issuedDate || new Date().toISOString().split('T')[0],
                                    expiryDate: currentLicense?.expiryDate || new Date().toISOString().split('T')[0],
                                    limitations: currentLicense?.limitations || '',
                                    aircraftRatings: currentLicense?.aircraftRatings || '',
                                    attachmentFilePath: filePath,
                                    attachmentFileName: fileName,
                                }
                            ]
                        })

                        if (payload) {
                            upsertMutation.mutate(payload, {
                                onSuccess: () => {
                                    toast.success('AMEL attachment uploaded successfully')
                                    setIsUploadingAmel(false)
                                    queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData?.id] })
                                },
                                onError: (err) => {
                                    toast.error(err.message || 'Failed to save attachment')
                                    setIsUploadingAmel(false)
                                }
                            })
                        } else {
                            setIsUploadingAmel(false)
                        }
                    },
                    onError: (err) => {
                        toast.error(err.message || 'Upload failed')
                        setIsUploadingAmel(false)
                    },
                }
            )
        }
        reader.readAsDataURL(file)
        if (amelInputRef.current) amelInputRef.current.value = ''
    }

    const handleSaveLicense = (data: any) => {
        if (!apiData) return
        
        // Preserve existing licenses and update/add the edited one
        const existingLicenses = apiData.staffAmelLicenseList || []
        const amelLicense = existingLicenses.length > 0 ? existingLicenses[0] : null
        
        const payload = buildUpsertPayload({
            staffAmelLicenseList: [
                {
                    id: amelLicense?.id || 0,
                    licenseNumber: data.licenseNumber,
                    categoryId: data.categoryId,
                    issuedDate: data.issuedDate,
                    expiryDate: data.expiryDate,
                    limitations: data.limitations,
                    aircraftRatings: data.aircraftRatings,
                    attachmentFilePath: amelLicense?.attachmentFilePath || '',
                    attachmentFileName: amelLicense?.attachmentFileName || '',
                }
            ]
        })
        if (!payload) return

        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("AMEL License updated successfully")
                setShowEditLicense(false)
                queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData.id] })
            },
            onError: (err) => toast.error(err.message || "Failed to update AMEL License")
        })
    }

    const getCategoryLabel = (categoryId: number) => {
        const cat = AMEL_LICENSE_CATEGORIES[categoryId - 1]
        return cat ? cat.label : `Category ${categoryId}`
    }

    const getAircraftTypeName = (typeId: number) => {
        return AIRCRAFT_TYPE_LICENSES[typeId - 1] || `Type ${typeId}`
    }

    const uploadedCount = docSlots.filter(s => s.filePath).length

    return (
        <>
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                    {/* Personal Info */}
                    <Section icon={<User className="h-4 w-4" />} iconBg="#eff6ff" iconColor="#2563eb" title="Personal Info" onEdit={() => setShowEditPersonal(true)}>
                        <div className="grid grid-cols-3 gap-y-5 gap-x-8 max-md:grid-cols-1">
                            <InfoRow label="Full Name (Thai)" value={staff.name} />
                            <InfoRow label="Full Name (English)" value={staff.nameEn} />
                            <InfoRow label="Date of Birth" value={formatDate(staff.dob)} mono />
                            <InfoRow label="Place of Birth" value={staff.placeOfBirth} />
                            <InfoRow label="Thai ID Card No." value={staff.idCard} mono />
                            <InfoRow label="Nationality" value={staff.nationality} />
                        </div>
                    </Section>

                    {/* Contact */}
                    <Section icon={<Phone className="h-4 w-4" />} iconBg="#f0fdf4" iconColor="#16a34a" title="Contact" onEdit={() => setShowEditContact(true)}>
                        <div className="grid grid-cols-3 gap-y-5 gap-x-8 max-md:grid-cols-1">
                            <InfoRow label="Phone" value={staff.phone} />
                            <InfoRow label="Email" value={staff.email} />
                            <div className="col-span-full flex flex-col gap-1">
                                <span className="text-xs font-medium text-slate-400 tracking-wide">Address</span>
                                <span className="text-sm font-medium text-slate-800">{staff.address}</span>
                            </div>
                        </div>
                    </Section>

                    {/* Employment */}
                    <Section icon={<Briefcase className="h-4 w-4" />} iconBg="#fef3c7" iconColor="#d97706" title="Employment" onEdit={() => setShowEditEmployment(true)}>
                        <div className="grid grid-cols-3 gap-y-5 gap-x-8 max-md:grid-cols-1">
                            <InfoRow label="Employee ID" value={staff.empId} mono />
                            <InfoRow label="Position" value={staff.position} />
                            <InfoRow label="Department" value={staff.department} />
                            <InfoRow label="Start Date" value={formatDate(staff.startDate)} mono />
                        </div>
                    </Section>

                    {/* ── Documents ── */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                                    <FileText className="h-4 w-4" />
                                </div>
                                Documents
                                {uploadedCount > 0 && (
                                    <span className="text-xs font-semibold text-slate-400 ml-1">({uploadedCount}/{docSlots.length})</span>
                                )}
                            </div>
                            {editDocMode ? (
                                <button
                                    onClick={() => {
                                        setEditDocMode(false)
                                        syncDocSlots()
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    Done
                                </button>
                            ) : (
                                <PermissionActionGuard menuCode="QA_STAFF" action="canEdit">
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                                        onClick={() => setEditDocMode(true)}
                                        title="Edit Documents"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                </PermissionActionGuard>
                            )}
                        </div>

                        {editDocMode ? (
                            /* ── Edit Mode: Upload grid ── */
                            <div className="grid grid-cols-2 gap-3">
                                {docSlots.map((slot) => (
                                    <div
                                        key={slot.key}
                                        className={`relative border rounded-xl p-4 transition-all duration-200 ${
                                            slot.filePath
                                                ? 'border-green-200 bg-green-50/40'
                                                : 'border-slate-200 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/20'
                                        }`}
                                    >
                                        <input
                                            ref={(el) => { docInputRefs.current[slot.key] = el }}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => handleDocUpload(slot.key, e)}
                                        />
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                slot.filePath ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {slot.uploading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : slot.filePath ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <FileText className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 leading-tight">{slot.label}</p>
                                                {slot.subtitle && (
                                                    <p className="text-[10px] text-amber-500 font-medium mt-0.5">{slot.subtitle}</p>
                                                )}
                                                {slot.fileName ? (
                                                    <a
                                                        href={slot.filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-blue-500 mt-1 truncate block hover:underline no-underline"
                                                        title={slot.fileName}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {slot.fileName}
                                                    </a>
                                                ) : (
                                                    <p className="text-[10px] text-slate-300 mt-1">No file uploaded</p>
                                                )}
                                            </div>
                                            {slot.filePath ? (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => docInputRefs.current[slot.key]?.click()}
                                                        className="px-2 py-1 text-[10px] font-semibold text-blue-500 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                                                        title="Replace file"
                                                    >
                                                        <Upload className="h-3 w-3 inline mr-0.5" />
                                                        Replace
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteDoc(slot.key)}
                                                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors border-none bg-transparent shrink-0"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : !slot.uploading ? (
                                                <button
                                                    type="button"
                                                    onClick={() => docInputRefs.current[slot.key]?.click()}
                                                    className="px-2.5 py-1 text-[10px] font-semibold text-blue-500 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors shrink-0"
                                                >
                                                    <Upload className="h-3 w-3 inline mr-1" />
                                                    Upload
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : uploadedCount > 0 ? (
                            /* ── Read-only: Show uploaded documents ── */
                            <div className="grid grid-cols-2 gap-3">
                                {docSlots.filter(s => s.filePath).map((slot) => (
                                    <a
                                        key={slot.key}
                                        href={slot.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 group no-underline"
                                    >
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 leading-tight">
                                                {slot.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={slot.fileName}>
                                                {slot.fileName}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            /* ── Empty state ── */
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                    <FileText className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">No Documents</p>
                                <p className="text-xs text-slate-400 mb-4">No documents have been uploaded yet.</p>
                                <button
                                    onClick={() => setEditDocMode(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-500 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors border-none"
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload Documents
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="col-span-4">
                    {/* ── Aircraft Type License ── */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600">
                                    <Shield className="h-4 w-4" />
                                </div>
                                Aircraft License
                                {aircraftLicenses.length > 0 && (
                                    <span className="text-xs font-semibold text-slate-400 ml-1">({aircraftLicenses.length})</span>
                                )}
                            </div>
                            <PermissionActionGuard menuCode="QA_STAFF" action="canEdit">
                                <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                                    onClick={() => setShowEditAircraft(true)}
                                    title="Edit Aircraft License"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </PermissionActionGuard>
                        </div>

                        {aircraftLicenses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {aircraftLicenses.map((lic) => (
                                    <span
                                        key={lic.id}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold py-1.5 px-3 rounded-lg bg-green-50 text-green-700 border border-green-200"
                                    >
                                        <Plane className="h-3 w-3" />
                                        {getAircraftTypeName(lic.aircraftTypeId)}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                    <Shield className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">No Aircraft License</p>
                                <p className="text-xs text-slate-400 mb-4">No aircraft type license has been assigned.</p>
                                <PermissionActionGuard menuCode="QA_STAFF" action="canCreate">
                                    <button
                                        onClick={() => setShowEditAircraft(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg cursor-pointer hover:bg-green-700 transition-colors border-none"
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                        Add License
                                    </button>
                                </PermissionActionGuard>
                            </div>
                        )}
                    </div>

                    {/* ── AMEL License ── */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-800">
                                    <Award className="h-4 w-4" />
                                </div>
                                AMEL License
                            </div>
                            {amelLicense && (
                                <button
                                    onClick={() => setShowEditLicense(true)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-none bg-transparent"
                                    title="Edit License"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {amelLicense ? (
                            <div className="bg-linear-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-5 space-y-4">
                                {/* License Number */}
                                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-200/80">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                        <Award className="h-4.5 w-4.5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">License Number</div>
                                        <div className="text-base font-bold text-blue-800 tracking-wider">{amelLicense.licenseNumber}</div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Category</span>
                                        <span className="text-sm font-semibold text-slate-800">{getCategoryLabel(amelLicense.categoryId)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Validity</span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {formatDate(amelLicense.issuedDate)} — {formatDate(amelLicense.expiryDate)}
                                        </span>
                                    </div>
                                    {amelLicense.limitations && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Limitations</span>
                                            <span className="text-sm font-medium text-slate-700">{amelLicense.limitations}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Aircraft Ratings */}
                                {amelLicense.aircraftRatings && (
                                    <div>
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">Aircraft Ratings</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {amelLicense.aircraftRatings.split(',').filter(Boolean).map(r => (
                                                <span key={r} className="inline-flex items-center gap-1 text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-white text-blue-700 border border-blue-200 shadow-sm">
                                                    <Plane className="h-3 w-3" /> {r.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Attachment */}
                                <div>
                                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">Attachment</span>
                                    {amelLicense.attachmentFilePath ? (
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={amelLicense.attachmentFilePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 text-left group no-underline"
                                            >
                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="text-sm text-slate-700 group-hover:text-blue-700 truncate flex-1">
                                                    {amelLicense.attachmentFileName || 'License Document'}
                                                </span>
                                                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteAmelDoc(true)}
                                                className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 cursor-pointer transition-all duration-200 shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => amelInputRef.current?.click()}
                                                disabled={isUploadingAmel}
                                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors disabled:opacity-50"
                                            >
                                                {isUploadingAmel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                                Upload Attachment
                                            </button>
                                            <input
                                                type="file"
                                                ref={amelInputRef}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                onChange={handleUploadAmelDoc}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Award className="h-7 w-7 text-slate-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">No License Data</p>
                                <p className="text-xs text-slate-400 mb-5">AMEL License information has not been added yet.</p>
                                <button
                                    onClick={() => setShowEditLicense(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-700 border-none"
                                >
                                    <Award className="h-4 w-4" />
                                    Add License
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Delete Document Confirmation Modal ── */}
            {confirmDeleteDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDeleteDoc(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Document</h3>
                            <p className="text-sm text-slate-500 mb-1">Are you sure you want to delete</p>
                            <p className="text-sm font-semibold text-slate-700 mb-5">
                                {DOCUMENT_TYPES.find(d => d.key === confirmDeleteDoc)?.label || confirmDeleteDoc}?
                            </p>
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeleteDoc(null)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleRemoveDoc(confirmDeleteDoc)
                                        setConfirmDeleteDoc(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 border-none rounded-xl cursor-pointer hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete AMEL Document Confirmation Modal ── */}
            {confirmDeleteAmelDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDeleteAmelDoc(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Attachment</h3>
                            <p className="text-sm text-slate-500 mb-1">Are you sure you want to delete</p>
                            <p className="text-sm font-semibold text-slate-700 mb-5">
                                AMEL License Document?
                            </p>
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeleteAmelDoc(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAmelDoc}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 border-none rounded-xl cursor-pointer hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            <EditPersonalInfoModal
                isOpen={showEditPersonal}
                onClose={() => setShowEditPersonal(false)}
                staff={staff}
                onSave={handleSavePersonal}
            />
            <EditContactModal
                isOpen={showEditContact}
                onClose={() => setShowEditContact(false)}
                staff={staff}
                onSave={handleSaveContact}
            />
            <EditEmploymentModal
                isOpen={showEditEmployment}
                onClose={() => setShowEditEmployment(false)}
                staff={staff}
                onSave={handleSaveEmployment}
            />
            <EditLicenseModal
                isOpen={showEditLicense}
                onClose={() => setShowEditLicense(false)}
                initialLicense={amelLicense}
                onSave={handleSaveLicense}
            />
            <EditAircraftModal
                isOpen={showEditAircraft}
                onClose={() => setShowEditAircraft(false)}
                initialSelection={aircraftLicenses.map(l => l.aircraftTypeId)}
                isSaving={savingAircraft}
                onSave={(selection) => {
                    if (!apiData) return
                    setSavingAircraft(true)
                    const payload = buildUpsertPayload({
                        staffAircraftLicenseList: selection.map((typeId) => ({
                            id: aircraftLicenses.find(l => l.aircraftTypeId === typeId)?.id || 0,
                            aircraftTypeId: typeId,
                        })),
                    })
                    if (!payload) { setSavingAircraft(false); return }
                    upsertMutation.mutate(payload, {
                        onSuccess: () => {
                            toast.success('Aircraft licenses updated')
                            setShowEditAircraft(false)
                            setSavingAircraft(false)
                            queryClient.invalidateQueries({ queryKey: ['qa-staff-detail', apiData.id] })
                        },
                        onError: (err) => {
                            toast.error(err.message || 'Failed to update aircraft licenses')
                            setSavingAircraft(false)
                        },
                    })
                }}
            />
        </>
    )
}
