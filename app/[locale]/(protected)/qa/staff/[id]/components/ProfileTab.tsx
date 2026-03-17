'use client'

import { useState } from 'react'
import { User, Phone, Briefcase, Pencil } from 'lucide-react'
import { StaffData } from '../types'
import { formatDate } from '../utils'
import { EditPersonalInfoModal } from './EditPersonalInfoModal'
import { EditContactModal } from './EditContactModal'
import { EditEmploymentModal } from './EditEmploymentModal'

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
            <div className="col-span-4 bg-white border border-[#e8ecf1] rounded-[14px] py-7 px-8 mb-0">

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
        </>

    )
}
