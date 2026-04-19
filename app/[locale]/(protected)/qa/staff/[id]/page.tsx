'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, User, Shield, Briefcase, ClipboardList, Building2, Calendar, FileText, Printer, Loader2 } from 'lucide-react'

import { ProfileAvatar } from './components/ProfileAvatar'
import { PrintPreview } from './components/PrintPreview'

import { TabName, StaffData } from './types'
import { formatDate } from './utils'
import { ProfileTab } from './components/ProfileTab'
import { TrainingTab } from './components/TrainingTab'
import { ExperienceTab } from './components/ExperienceTab'
import { LogbookTab } from './components/LogbookTab'
import { useStaffById } from '@/lib/api/hooks/useQAStaffManagement'
import type { StaffByIdData } from '@/lib/api/qa/staff-management'

// ── Tab Configuration ──
const TABS: { name: TabName; icon: React.ReactNode }[] = [
    { name: 'Profile', icon: <User className="h-4 w-4" /> },
    { name: 'Training', icon: <Shield className="h-4 w-4" /> },
    { name: 'Experience', icon: <Briefcase className="h-4 w-4" /> },
    { name: 'Logbook Records', icon: <ClipboardList className="h-4 w-4" /> },
]

// ── Tab Content Map ──
const TAB_CONTENT: Record<TabName, React.ComponentType<{ staff: StaffData }>> = {
    'Profile': ProfileTab,
    'Training': TrainingTab,
    'Experience': ExperienceTab,
    'Logbook Records': LogbookTab,
}

// ── Map API data → StaffData ──
function mapApiToStaffData(api: StaffByIdData): StaffData {
    const nameEn = api.fullNameEn || api.name || 'Staff Member'
    const initials = nameEn
        .split(' ')
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

    return {
        id: api.id,
        empId: api.employeeId || `EMP-${String(api.id).padStart(4, '0')}`,
        name: api.name || '-',
        nameEn: api.fullNameEn || '-',
        position: api.positionObj?.name || api.jobTitle || '-',
        department: api.departmentObj?.name || '-',
        status: api.isActive ? 'active' : 'inactive',
        startDate: api.startDate || '-',
        initials,
        avatarBg: 'linear-gradient(135deg,#475569,#94a3b8)',
        profileImage: api.profileImagePath && api.profileImagePath !== 'string' ? api.profileImagePath : undefined,
        titleName: api.title || undefined,
        dob: api.dateOfBirth || '-',
        idCard: api.idCardNo || '-',
        nationality: api.nationality || '-',
        phone: api.phone || '-',
        email: api.email || '-',
        address: api.address || '-',
        placeOfBirth: api.placeOfBirth || '-',
        ratings: [],
        training: [],
        experience: (api.workExperiences || [])
            .filter(w => !w.isdelete)
            .map(w => ({
                title: w.jobTitle || '-',
                company: w.company || '-',
                period: [
                    w.periodFrom ? formatDate(w.periodFrom) : '',
                    w.periodTo ? formatDate(w.periodTo) : 'Present',
                ].filter(Boolean).join(' – '),
                description: w.description || '-',
            })),
        education: (api.educations || [])
            .filter(e => !e.isdelete)
            .map(e => ({
                degree: e.degree || '-',
                institution: e.institution || '-',
                year: e.year?.toString() || '-',
                field: e.fieldOfStudy || '-',
            })),
        logbook: [],
    }
}

// ── Main Page ──
export default function StaffProfilePage() {
    const router = useRouter()
    const params = useParams()
    const staffId = Number(params.id)
    const [activeTab, setActiveTab] = useState<TabName>('Profile')
    const [showPrintPreview, setShowPrintPreview] = useState(false)

    // ── Fetch from API ──
    const { data, isLoading, isError, error } = useStaffById(staffId)

    const staff = useMemo<StaffData>(() => {
        if (data?.responseData) {
            return mapApiToStaffData(data.responseData)
        }
        // Fallback while loading
        return {
            id: staffId,
            empId: `EMP-${String(staffId).padStart(4, '0')}`,
            name: 'Loading...',
            nameEn: 'Loading...',
            position: '-',
            department: '-',
            status: 'active',
            startDate: '-',
            initials: '--',
            avatarBg: 'linear-gradient(135deg,#475569,#94a3b8)',
            dob: '-',
            idCard: '-',
            nationality: '-',
            phone: '-',
            email: '-',
            address: '-',
            placeOfBirth: '-',
            ratings: [],
            training: [],
            experience: [],
            education: [],
            logbook: [],
        }
    }, [data, staffId])

    const ActiveTabContent = TAB_CONTENT[activeTab]

    // ── Loading State ──
    if (isLoading) {
        return (
            <div className="p-8 min-h-screen rounded-xl">
                <div className="bg-slate-50 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <p className="text-sm font-medium text-slate-500">Loading staff profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    // ── Error State ──
    if (isError) {
        return (
            <div className="p-8 min-h-screen rounded-xl">
                <div className="bg-slate-50 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                            <User className="h-7 w-7 text-red-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Failed to load staff profile</p>
                        <p className="text-xs text-slate-400 max-w-xs">{error?.message || 'An unexpected error occurred'}</p>
                        <button
                            onClick={() => router.push('/en/qa/staff')}
                            className="mt-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                            Back to Staff List
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="p-8 min-h-screen rounded-xl ">
                <div className="bg-slate-50 rounded-xl p-8 grid grid-cols-12 gap-4">
                    {/* ── Top Bar ── */}
                    <div className="col-span-12 flex items-center gap-3 ">
                        <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-white text-slate-600 cursor-pointer transition-all duration-200 shrink-0 hover:border-slate-400 hover:text-slate-800 hover:shadow-sm"
                            onClick={() => router.push('/en/qa/staff')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <span className=" font-bold text-slate-800">Back</span>
                    </div>
                    <div className="col-span-12">
                        {/* ── Profile Header Card ── */}
                        <div className="bg-white border border-[#e8ecf1] rounded-t-[14px] py-7 px-8 mb-0 flex items-center gap-6 relative max-md:flex-col max-md:items-start max-md:gap-4 max-md:p-5">
                            <div className="absolute top-5 right-6 flex items-center gap-2">
                                <button
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-white text-slate-500 cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-800 hover:shadow-sm"
                                    onClick={() => setShowPrintPreview(true)}
                                    title="Print"
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                            </div>
                            <ProfileAvatar
                                initials={staff.initials}
                                avatarBg={staff.avatarBg}
                                profileImage={staff.profileImage}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xl font-bold text-slate-800 mb-0.5">{staff.name}</div>
                                <div className="text-sm text-slate-500 mb-2.5">{staff.nameEn}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg whitespace-nowrap bg-blue-50 text-blue-600 border border-blue-200">
                                        {staff.position}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg whitespace-nowrap border ${staff.status === 'active'
                                        ? 'bg-green-50 text-green-600 border-green-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                        {staff.status === 'active' ? '● Active' : '● Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 mt-2.5 text-[13px] text-slate-400">
                                    <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {staff.department}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {formatDate(staff.startDate)}</span>
                                    <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {staff.empId}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabs ── */}
                        <div className="flex gap-1 bg-white border border-[#e8ecf1] border-t-0 rounded-b-[14px] py-2 px-7 mb-3 max-md:overflow-x-auto">
                            {TABS.map(t => (
                                <button
                                    key={t.name}
                                    className={`inline-flex items-center gap-[7px] py-2.5 px-5 text-[13px] font-medium cursor-pointer border-none bg-transparent rounded-[10px] transition-all duration-200 whitespace-nowrap ${activeTab === t.name
                                        ? 'text-blue-600 !bg-slate-100 font-semibold! '
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-[#f8f9fb]'
                                        }`}
                                    onClick={() => setActiveTab(t.name)}
                                >
                                    {t.icon} {t.name}
                                </button>
                            ))}
                        </div>

                        {/* ── Active Tab Content ── */}
                        <ActiveTabContent staff={staff} />
                    </div>
                </div>
            </div>

            {/* Print Preview Modal */}
            <PrintPreview
                isOpen={showPrintPreview}
                onClose={() => setShowPrintPreview(false)}
                staff={staff}
            />
        </>
    )
}
