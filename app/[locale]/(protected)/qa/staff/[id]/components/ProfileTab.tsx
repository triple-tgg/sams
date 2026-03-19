'use client'

import { useState } from 'react'
import { User, Phone, Briefcase, Pencil, Award, Plane, FileText } from 'lucide-react'
import { StaffData } from '../types'
import { formatDate } from '../utils'
import { EditPersonalInfoModal } from './EditPersonalInfoModal'
import { EditContactModal } from './EditContactModal'
import { EditEmploymentModal } from './EditEmploymentModal'
import { EditLicenseModal } from './EditLicenseModal'

// ── Reusable Info Row ──
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 tracking-wide">{label}</span>
            <span className={`text-sm font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
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
                    <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                        onClick={onEdit}
                        title={`Edit ${title}`}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            {children}
        </div>
    )
}

// ── Profile Tab ──
export function ProfileTab({ staff }: { staff: StaffData }) {
    const [showEditPersonal, setShowEditPersonal] = useState(false)
    const [showEditContact, setShowEditContact] = useState(false)
    const [showEditEmployment, setShowEditEmployment] = useState(false)
    const [showEditLicense, setShowEditLicense] = useState(false)

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
                </div>
                <div className="col-span-4 ">
                    {/* AMEL License */}
                    <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-800">
                                    <Award className="h-4 w-4" />
                                </div>
                                AMEL License
                            </div>
                            {staff.license && (
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                                        { Valid: 'bg-green-50 text-green-600', Expired: 'bg-red-50 text-red-600', Permanent: 'bg-amber-50 text-amber-600' }[staff.license.status] ?? 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {staff.license.status}
                                    </span>
                                    <button
                                        onClick={() => setShowEditLicense(true)}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-none bg-transparent"
                                        title="Edit License"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {staff.license ? (
                            <div className="bg-linear-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-5 space-y-4">
                                {/* License Number */}
                                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-200/80">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                        <Award className="h-4.5 w-4.5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">License Number</div>
                                        <div className="font-mono text-base font-bold text-blue-800 tracking-wider">{staff.license.number}</div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Category</span>
                                        <span className="text-sm font-semibold text-slate-800">{staff.license.category}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Validity</span>
                                        <span className="text-sm font-semibold text-slate-800 font-mono">
                                            {formatDate(staff.license.issuedDate)} — {formatDate(staff.license.expiryDate)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Limitations</span>
                                        <span className="text-sm font-medium text-slate-700">{staff.license.limitations || '—'}</span>
                                    </div>
                                </div>

                                {/* Aircraft Ratings */}
                                {(staff.license.aircraftRatings ?? staff.ratings)?.length > 0 && (
                                    <div>
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">Aircraft Ratings</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(staff.license.aircraftRatings ?? staff.ratings).map(r => (
                                                <span key={r} className="inline-flex items-center gap-1 text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-white text-blue-700 border border-blue-200 shadow-sm">
                                                    <Plane className="h-3 w-3" /> {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                <div>
                                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">Attachments</span>
                                    <button
                                        type="button"
                                        onClick={() => console.log('View license file')}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 text-left group"
                                    >
                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-700 truncate flex-1">License Document.pdf</span>
                                        <span className="text-[11px] text-slate-400 shrink-0">View</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Empty State */
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

            {/* ── Modals ── */}
            <EditPersonalInfoModal
                isOpen={showEditPersonal}
                onClose={() => setShowEditPersonal(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save personal info:', data)
                    // TODO: call API to update staff data
                }}
            />
            <EditContactModal
                isOpen={showEditContact}
                onClose={() => setShowEditContact(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save contact:', data)
                    // TODO: call API to update staff data
                }}
            />
            <EditEmploymentModal
                isOpen={showEditEmployment}
                onClose={() => setShowEditEmployment(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save employment:', data)
                    // TODO: call API to update staff data
                }}
            />
            <EditLicenseModal
                isOpen={showEditLicense}
                onClose={() => setShowEditLicense(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save license:', data)
                    // TODO: call API to update staff data
                }}
            />
        </>

    )
}
