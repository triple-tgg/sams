'use client'
import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Shield, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react'
import './staff-profile.css'

// ── Mock Data (keyed by ID) ──
const staffProfiles: Record<number, {
    empId: string; title: string; name: string; nameEn: string; nickname: string;
    position: string; department: string; email: string; phone: string; address: string;
    startDate: string; dob: string; status: string; initials: string; avatarBg: string;
    experience: Array<{ company: string; position: string; years: string; desc: string }>;
    certifications: string[];
    training: Array<{ course: string; body: string; status: 'completed' | 'in-progress' | 'required' | 'expired'; expiry: string }>;
}> = {
    1: {
        empId: 'EMP-0412', title: 'นาย', name: 'สมชาย ชาญชัย', nameEn: 'Somchai Chanchai', nickname: 'ชาย',
        position: 'B1 Engineer', department: 'Line Maintenance', email: 'somchai.c@sams.co.th', phone: '081-234-5678',
        address: '123 Aviation Rd., Don Muang, Bangkok 10210', startDate: '2021-04-15', dob: '1988-03-12',
        status: 'active', initials: 'SC', avatarBg: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        experience: [
            { company: 'Thai Airways International', position: 'Junior Mechanic', years: '3', desc: 'A320 line maintenance' },
            { company: 'Bangkok Airways', position: 'B1 Licensed Engineer', years: '5', desc: 'ATR 72 / A319 base maintenance' },
        ],
        certifications: ['EASA Part-66 Cat B1', 'CAAT Aircraft Maintenance License', 'FAA A&P Certificate'],
        training: [
            { course: 'Human Factors', body: 'EASA Part-66 Module 9', status: 'completed', expiry: '15 MAR 2027' },
            { course: 'Fuel Tank Safety', body: 'EASA Part-145', status: 'expired', expiry: '01 FEB 2026' },
            { course: 'SMS Awareness', body: 'ICAO / CAAT', status: 'completed', expiry: '20 JUN 2027' },
            { course: 'EWIS (Electrical Wiring)', body: 'EASA Part-66 Module 11', status: 'in-progress', expiry: '—' },
            { course: 'Engine Run-up', body: 'CAAT Authorization', status: 'required', expiry: '—' },
            { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', status: 'completed', expiry: '10 DEC 2027' },
            { course: 'RVSM / PBN Awareness', body: 'CAAT', status: 'required', expiry: '—' },
        ],
    },
    2: {
        empId: 'EMP-0287', title: 'นาย', name: 'วิชัย ทองดี', nameEn: 'Wichai Thongdee', nickname: 'ชัย',
        position: 'Technician', department: 'Base Maintenance', email: 'wichai.t@sams.co.th', phone: '089-876-5432',
        address: '456 Maintenance Ave., Suvarnabhumi, Samut Prakan 10540', startDate: '2019-08-01', dob: '1992-07-22',
        status: 'active', initials: 'VT', avatarBg: 'linear-gradient(135deg,#dc2626,#ef4444)',
        experience: [
            { company: 'Nok Air', position: 'Apprentice Technician', years: '2', desc: 'Boeing 737 support' },
        ],
        certifications: ['CAAT Aircraft Maintenance License'],
        training: [
            { course: 'Human Factors (Basic)', body: 'EASA / CAAT', status: 'completed', expiry: '08 SEP 2027' },
            { course: 'Engine Run-up', body: 'CAAT Authorization', status: 'expired', expiry: '01 MAR 2026' },
            { course: 'NDT Level II', body: 'CAAT / ASNT', status: 'required', expiry: '—' },
            { course: 'SMS Awareness', body: 'ICAO / CAAT', status: 'completed', expiry: '15 NOV 2026' },
            { course: 'FOD Prevention', body: 'CAAT', status: 'in-progress', expiry: '—' },
            { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', status: 'completed', expiry: '22 APR 2027' },
        ],
    },
}

// Generate default profile for IDs not in mock data
function getProfile(id: number) {
    if (staffProfiles[id]) return staffProfiles[id]
    const defaults = [
        { empId: 'EMP-0521', title: 'Ms.', name: 'Sarah Weston', nameEn: 'Sarah Weston', nickname: 'Sarah', position: 'Avionics', department: 'Line Maintenance', initials: 'SW', avatarBg: 'linear-gradient(135deg,#0369a1,#3b82f6)' },
        { empId: 'EMP-0198', title: 'นาย', name: 'กมล มีชัย', nameEn: 'Kamol Meechai', nickname: 'กมล', position: 'B2 Engineer', department: 'Workshop', initials: 'KM', avatarBg: 'linear-gradient(135deg,#b45309,#f59e0b)' },
        { empId: 'EMP-0367', title: 'นางสาว', name: 'พิมพ์ อร่ามศรี', nameEn: 'Pim Aramsri', nickname: 'พิมพ์', position: 'Structures', department: 'Base Maintenance', initials: 'PA', avatarBg: 'linear-gradient(135deg,#065f46,#22c55e)' },
    ]
    const d = defaults[(id - 3) % defaults.length] || defaults[0]
    return {
        ...d, email: `${d.nameEn.split(' ')[0].toLowerCase()}@sams.co.th`, phone: '08x-xxx-xxxx',
        address: 'Bangkok, Thailand', startDate: '2022-01-01', dob: '1990-01-01', status: 'active',
        experience: [{ company: 'Previous Company', position: d.position, years: '2', desc: 'General maintenance' }],
        certifications: ['CAAT License'],
        training: [
            { course: 'Human Factors', body: 'EASA / CAAT', status: 'completed' as const, expiry: '2027-06-01' },
            { course: 'SMS Awareness', body: 'ICAO / CAAT', status: 'required' as const, expiry: '—' },
        ],
    }
}

const statusConfig = {
    'completed': { label: 'Completed', icon: CheckCircle2, color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)' },
    'in-progress': { label: 'In Progress', icon: Clock, color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)' },
    'required': { label: 'Required', icon: AlertTriangle, color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)' },
    'expired': { label: 'Expired', icon: XCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
}

export default function StaffProfilePage() {
    const router = useRouter()
    const params = useParams()
    const id = Number(params?.id || 1)
    const profile = getProfile(id)
    const [activeTab, setActiveTab] = useState<'personnel' | 'experience' | 'training'>('personnel')

    const completedCount = profile.training.filter(t => t.status === 'completed').length
    const compliancePct = Math.round((completedCount / profile.training.length) * 100) || 0

    return (
        <div className="sp-page">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => router.push('/en/hr/staff')} className="sp-back-btn">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Staff List
            </Button>

            {/* Profile Header */}
            <Card className="sp-header-card">
                <CardContent className="p-6">
                    <div className="sp-header-content">
                        <div className="sp-avatar-large" style={{ background: profile.avatarBg }}>
                            {profile.initials}
                        </div>
                        <div className="sp-header-info">
                            <div className="sp-header-top">
                                <div>
                                    <h1 className="sp-name">{profile.title}{profile.name}</h1>
                                    <p className="sp-name-en">{profile.nameEn}</p>
                                </div>
                                <Badge color={profile.status === 'active' ? 'success' : 'default'} className="text-xs h-fit">
                                    {profile.status === 'active' ? '● Active' : '○ Inactive'}
                                </Badge>
                            </div>
                            <div className="sp-meta-row">
                                <span className="sp-meta-item sp-position-tag">{profile.position}</span>
                                <span className="sp-meta-item"><Briefcase className="h-3.5 w-3.5" /> {profile.department}</span>
                                <span className="sp-meta-item"><span className="sp-emp-id">{profile.empId}</span></span>
                            </div>
                            <div className="sp-contact-row">
                                <span className="sp-contact-item"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                                <span className="sp-contact-item"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>
                                <span className="sp-contact-item"><Calendar className="h-3.5 w-3.5" /> Started {new Date(profile.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Summary */}
            <div className="sp-compliance-bar">
                <div className="sp-compliance-info">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Training Compliance</span>
                    <span className="text-sm text-muted-foreground">{completedCount}/{profile.training.length} courses completed</span>
                </div>
                <div className="sp-compliance-pct" style={{ color: compliancePct >= 80 ? '#16a34a' : compliancePct >= 50 ? '#d97706' : '#dc2626' }}>
                    {compliancePct}%
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="sp-tabs">
                {(['personnel', 'experience', 'training'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`sp-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'personnel' && <><MapPin className="h-3.5 w-3.5" /> Personnel</>}
                        {tab === 'experience' && <><Briefcase className="h-3.5 w-3.5" /> Experience</>}
                        {tab === 'training' && <><GraduationCap className="h-3.5 w-3.5" /> Training</>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <Card className="sp-content-card">
                <CardContent className="p-6">
                    {/* ── Personnel Tab ── */}
                    {activeTab === 'personnel' && (
                        <div className="sp-detail-grid">
                            <div className="sp-detail-item">
                                <label>Full Name (Thai)</label>
                                <span>{profile.title}{profile.name}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Full Name (English)</label>
                                <span>{profile.nameEn}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Nickname</label>
                                <span>{profile.nickname}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Employee ID</label>
                                <span className="font-mono">{profile.empId}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Date of Birth</label>
                                <span>{new Date(profile.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Phone</label>
                                <span>{profile.phone}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Email</label>
                                <span>{profile.email}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Position</label>
                                <span>{profile.position}</span>
                            </div>
                            <div className="sp-detail-item">
                                <label>Department</label>
                                <span>{profile.department}</span>
                            </div>
                            <div className="sp-detail-item span-full">
                                <label>Address</label>
                                <span>{profile.address}</span>
                            </div>
                        </div>
                    )}

                    {/* ── Experience Tab ── */}
                    {activeTab === 'experience' && (
                        <div className="sp-exp-section">
                            <h3 className="sp-section-title">Work Experience</h3>
                            <div className="sp-timeline">
                                {profile.experience.map((exp, i) => (
                                    <div key={i} className="sp-timeline-item">
                                        <div className="sp-timeline-dot" />
                                        <div className="sp-timeline-content">
                                            <div className="sp-timeline-company">{exp.company}</div>
                                            <div className="sp-timeline-position">{exp.position} · {exp.years} years</div>
                                            <div className="sp-timeline-desc">{exp.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h3 className="sp-section-title mt-6">Certifications</h3>
                            <div className="sp-cert-list">
                                {profile.certifications.map((cert, i) => (
                                    <div key={i} className="sp-cert-item">
                                        <Shield className="h-4 w-4 text-blue-600" />
                                        {cert}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Training Tab ── */}
                    {activeTab === 'training' && (
                        <div className="sp-training-section">
                            <table className="sp-training-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Training Course</th>
                                        <th>Regulatory Body</th>
                                        <th>Status</th>
                                        <th>Expiry</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profile.training.map((t, i) => {
                                        const cfg = statusConfig[t.status]
                                        const Icon = cfg.icon
                                        return (
                                            <tr key={i}>
                                                <td className="text-muted-foreground">{i + 1}</td>
                                                <td className="font-medium">{t.course}</td>
                                                <td className="text-muted-foreground text-xs">{t.body}</td>
                                                <td>
                                                    <span
                                                        className="sp-status-pill"
                                                        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                                                    >
                                                        <Icon className="h-3 w-3" />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="text-sm" style={{ color: t.status === 'expired' ? '#dc2626' : undefined }}>
                                                    {t.expiry}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
