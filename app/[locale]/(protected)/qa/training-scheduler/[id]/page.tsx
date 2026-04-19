'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, MapPin, Search, UserPlus, Trash2, Calendar as CalendarIcon, AlertCircle, Users, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { INITIAL_SESSIONS } from '../data'
import { STATUS_CONFIG, CAT_COLOR, formatDate } from '../types'

// Mock Data for Enrolled Staff Table
const MOCK_ENROLLED_STAFF = [
    { id: '1', name: 'Mr. Sanmanas Ruangsri', code: '0012', license: 'B1', dept: 'Maintenance', date: '2026-03-20', status: 'enrolled' },
    { id: '2', name: 'Mr. Pissanu Arunbutr', code: '0013', license: 'B1/B2', dept: 'Maintenance', date: '2026-03-20', status: 'enrolled' },
    { id: '3', name: 'Mr. Phaisal Sangasang', code: '0020', license: 'B1', dept: 'Maintenance', date: '2026-03-21', status: 'enrolled' },
    { id: '4', name: 'Mr. Papoj Imudom', code: '0028', license: 'B1', dept: 'Maintenance', date: '2026-03-21', status: 'enrolled' },
    { id: '5', name: 'Mr. Prakarn Sribudh', code: '0041', license: 'B1', dept: 'Technical Services', date: '2026-03-22', status: 'enrolled' },
    { id: '6', name: 'Mr. Trairattana Klinkaewboonvong', code: '0047', license: 'B1/B2', dept: 'Maintenance', date: '2026-03-22', status: 'enrolled' },
    { id: '7', name: 'Mr. Thawansak Bharmmano', code: '0049', license: 'B1', dept: 'Maintenance', date: '2026-03-23', status: 'enrolled' },
    { id: '8', name: 'Mr. Pongsak Wongrak', code: '0052', license: 'B2', dept: 'Compliance Monitoring', date: '2026-03-23', status: 'enrolled' },
]

const MOCK_AVAILABLE_STAFF = [
    { id: '101', name: 'Mr. Chalong Siri', code: '0022', license: 'B1/B2', dept: 'Maintenance', date: '-', status: 'available' },
    { id: '102', name: 'Eng. Somchai Kitti', code: '0025', license: 'B2', dept: 'Technical Services', date: '-', status: 'available' },
    { id: '103', name: 'Ms. Kanjana Wattana', code: '0030', license: 'B1', dept: 'Compliance Monitoring', date: '-', status: 'available' },
    { id: '104', name: 'Mr. Anan Sritape', code: '0085', license: 'B1/B2', dept: 'Maintenance', date: '-', status: 'available' },
]

export default function ScheduleDetailPage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = Number(params?.id)
    
    // Fallback to a mock full session if not found in INITIAL_SESSIONS
    const session = INITIAL_SESSIONS.find(s => s.id === sessionId) || {
        id: sessionId,
        courseId: 24, courseName: 'Electrical Wiring Interconnection System',
        courseCode: 'SP-EWIS', category: 'Specialized',
        dateStart: '2026-04-14', dateEnd: '2026-04-16',
        timeStart: '08:00', timeEnd: '17:00',
        instructor: 'Eng. Priya N.', venue: 'Hangar 1 – Classroom',
        dept: 'Maintenance', maxParticipants: 15, enrolled: 15,
        status: 'Full', type: 'Recurrent',
    }

    const [enrolledStaff, setEnrolledStaff] = useState(MOCK_ENROLLED_STAFF)
    const [availableStaff, setAvailableStaff] = useState(MOCK_AVAILABLE_STAFF)
    const [staffSearch, setStaffSearch] = useState('')
    const [enrolledSearch, setEnrolledSearch] = useState('')
    
    const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.Scheduled
    const enrolledCount = enrolledStaff.length
    const pct = session.maxParticipants > 0 ? (enrolledCount / session.maxParticipants) * 100 : 0
    const slotsLeft = session.maxParticipants - enrolledCount
    const isFull = slotsLeft <= 0

    const getInitials = (name: string) => {
        const words = name.replace('Mr. ', '').replace('Ms. ', '').replace('Capt. ', '').replace('Eng. ', '').split(' ')
        return words[0] ? words[0][0] : '?'
    }

    const handleEnroll = (staff: typeof MOCK_AVAILABLE_STAFF[0]) => {
        if (isFull) return;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const enrolledDate = `${yyyy}-${mm}-${dd}`;
        
        setEnrolledStaff(prev => [...prev, { ...staff, date: enrolledDate, status: 'enrolled' }]);
        setAvailableStaff(prev => prev.filter(s => s.id !== staff.id));
    }

    const handleRemove = (staff: typeof MOCK_ENROLLED_STAFF[0]) => {
        setEnrolledStaff(prev => prev.filter(s => s.id !== staff.id));
        setAvailableStaff(prev => [{ ...staff, date: '-', status: 'available' }, ...prev]);
    }

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer border border-border bg-white"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Sessions
                        </button>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {session.courseCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                                {session.status}
                            </span>
                        </div>
                    </div>
                    <CardTitle className="mt-2">{session.courseName}</CardTitle>
                    <CardDescription>Manage staff enrollment for this training session</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
                        {/* Left — Session Info */}
                        <div className="space-y-4">
                            {/* SessionInfoCard Replica */}
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-border p-5 space-y-4">
                                {/* Course Title & Status */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                {session.courseCode}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                                                {session.status}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground leading-snug">{session.courseName}</h3>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-xs">
                                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Date</span>
                                            <span className="text-foreground font-medium">
                                                {formatDate(session.dateStart)}
                                                {session.dateEnd !== session.dateStart && ` — ${formatDate(session.dateEnd)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Time</span>
                                            <span className="text-foreground font-medium">{session.timeStart} – {session.timeEnd}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Instructor</span>
                                            <span className="text-foreground font-medium">{session.instructor}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="text-muted-foreground/60 text-[9px] font-semibold uppercase block">Venue</span>
                                            <span className="text-foreground font-medium">{session.venue}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity Bar */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="font-semibold text-foreground">Enrollment Capacity</span>
                                        </div>
                                        <span className={`text-xs font-bold ${isFull ? 'text-red-600' : slotsLeft <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {enrolledCount}/{session.maxParticipants}
                                            <span className="text-muted-foreground font-medium ml-1">
                                                ({isFull ? 'Full' : `${slotsLeft} slots left`})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isFull ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Regulatory Notes */}
                                <div className="pt-2">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Regulatory Notes</h4>
                                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-2 border border-slate-100">
                                        <div className="flex gap-2 leading-relaxed"><span className="text-slate-400">•</span><p>Training shall be completed within <b className="text-foreground">6 months</b> of joining</p></div>
                                        <div className="flex gap-2 leading-relaxed"><span className="text-slate-400">•</span><p>Governed by CAAT MOE Issue 10 Rev.00</p></div>
                                        <div className="flex gap-2 leading-relaxed"><span className="text-slate-400">•</span><p>Ref: SAMS-FM-CM-014 Rev.03 (05 AUG 2025)</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Add Staff Panel */}
                            <div className="bg-white rounded-xl border border-border overflow-hidden">
                                <div className="p-3 bg-slate-50/80 border-b border-border flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-foreground">Add Staff</span>
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                        {availableStaff.length} available
                                    </span>
                                </div>

                                {/* Search */}
                                <div className="p-3 border-b border-border">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={staffSearch}
                                            onChange={e => setStaffSearch(e.target.value)}
                                            placeholder="Search by name, ID or department..."
                                            disabled={isFull}
                                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-60 disabled:bg-muted/30"
                                        />
                                    </div>
                                </div>

                                {/* Full Warning */}
                                {isFull ? (
                                    <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                        <span className="text-[11px] font-semibold text-red-700">Session is full. Remove existing enrollment to add more.</span>
                                    </div>
                                ) : (
                                    <div className="max-h-[340px] overflow-y-auto">
                                        {availableStaff
                                            .filter(s => 
                                                s.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
                                                s.code.includes(staffSearch) || 
                                                s.dept.toLowerCase().includes(staffSearch.toLowerCase())
                                            )
                                            .map(staff => (
                                                <div key={staff.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                                                        {getInitials(staff.name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-foreground truncate">{staff.name}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                            <span className="font-bold">{staff.code}</span>
                                                            <span>·</span>
                                                            <span>{staff.license}</span>
                                                            <span>·</span>
                                                            <span className="truncate">{staff.dept}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleEnroll(staff)}
                                                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-primary/10 text-primary hover:bg-primary hover:text-white cursor-pointer"
                                                    >
                                                        <UserPlus className="w-3 h-3" />
                                                        Enroll
                                                    </button>
                                                </div>
                                            ))}
                                        {availableStaff.length === 0 && (
                                            <div className="p-6 text-center text-xs text-muted-foreground">No available staff found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right — Enrolled Staff List */}
                        <div className="bg-white rounded-xl border border-border overflow-hidden">
                            <div className="p-4 bg-slate-50/80 border-b border-border flex items-center gap-3">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-foreground">Enrolled Staff</span>
                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                                    {enrolledCount}
                                </span>
                                <div className="relative ml-auto w-48">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={enrolledSearch}
                                        onChange={e => setEnrolledSearch(e.target.value)}
                                        placeholder="Search enrolled..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                                <span>Employee Name</span>
                                <span>License</span>
                                <span>Department</span>
                                <span>Enrolled Date</span>
                                <span className="text-center">Action</span>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto">
                                {enrolledStaff.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {enrolledSearch ? 'No matching enrolled staff' : 'No staff enrolled yet. Add staff from the left panel.'}
                                        </p>
                                    </div>
                                ) : (
                                    enrolledStaff.filter(e => e.name.toLowerCase().includes(enrolledSearch.toLowerCase())).map((staff, idx) => (
                                        <div
                                            key={staff.id}
                                            className={`grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-4 py-3 items-center border-b border-border/50 hover:bg-muted/20 transition-colors ${
                                                idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0">
                                                    {getInitials(staff.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">{staff.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{staff.code}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-foreground">{staff.license}</span>
                                            <span className="text-[11px] text-muted-foreground font-medium truncate">{staff.dept}</span>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-medium text-foreground">{staff.date}</span>
                                                <span
                                                    className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[9px] font-bold"
                                                    style={{ background: '#dbeafe', color: '#1e40af' }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
                                                    Enrolled
                                                </span>
                                            </div>
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleRemove(staff)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
