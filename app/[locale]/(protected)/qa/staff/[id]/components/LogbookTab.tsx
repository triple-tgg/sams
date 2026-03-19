'use client'

import { useState } from 'react'
import { ClipboardList, Clock, AlertCircle, Wrench, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react'
import { StaffData, LogbookEntry } from '../types'
import { formatDate } from '../utils'
import { LogbookRecordModal } from './LogbookRecordModal'

// ── Task Type Badge Color Map ──
function getTaskTypeStyle(taskType: string) {
    switch (taskType) {
        case 'Defect Rectification':
            return 'bg-red-50 text-red-600'
        case 'A-Check':
            return 'bg-purple-50 text-violet-600'
        default:
            return 'bg-blue-50 text-blue-600'
    }
}

// ── Mock THF Defect Data ──
interface DefectItem {
    defectNo: string
    ata: string
    description: string
    action: string
    status: 'Open' | 'Deferred' | 'Closed'
    raisedBy: string
    raisedDate: string
}

function getMockDefects(thfNo: string): DefectItem[] {
    const defectMap: Record<string, DefectItem[]> = {
        'THF-2026-0135': [
            { defectNo: 'DEF-2026-0421', ata: 'ATA 21', description: 'PACK 1 fault indication intermittent during flight', action: 'Replaced flow control valve P/N 1234-5678. Ops check satisfactory.', status: 'Closed', raisedBy: 'Capt. Somsak', raisedDate: '2026-03-08' },
            { defectNo: 'DEF-2026-0422', ata: 'ATA 21', description: 'PACK 1 temperature fluctuation noted after valve replacement', action: 'Monitoring required — awaiting next flight feedback', status: 'Open', raisedBy: 'Somchai C.', raisedDate: '2026-03-08' },
            { defectNo: 'DEF-2026-0423', ata: 'ATA 36', description: 'Bleed air duct shows minor chafing near station 400', action: 'Deferred per MEL 36-11-01. Repair scheduled for next A-Check.', status: 'Deferred', raisedBy: 'Somchai C.', raisedDate: '2026-03-08' },
        ],
    }
    // Return mapped defects or generate demo data
    return defectMap[thfNo] ?? [
        { defectNo: `DEF-${thfNo.replace('THF-', '')}`, ata: 'ATA 32', description: 'Nose wheel steering sluggish during taxi', action: 'Pending inspection', status: 'Open', raisedBy: 'Crew Report', raisedDate: '2026-03-15' },
    ]
}

// ── Defect Status Badge ──
function DefectStatusBadge({ status }: { status: DefectItem['status'] }) {
    const styles = {
        Open: 'bg-red-50 text-red-600',
        Deferred: 'bg-amber-50 text-amber-600',
        Closed: 'bg-green-50 text-green-600',
    }[status]

    const icons = {
        Open: <AlertTriangle className="h-3 w-3" />,
        Deferred: <Clock className="h-3 w-3" />,
        Closed: <CheckCircle2 className="h-3 w-3" />,
    }[status]

    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${styles}`}>
            {icons} {status}
        </span>
    )
}


// ── Logbook Records Tab ──
export function LogbookTab({ staff }: { staff: StaffData }) {
    const totalHours = staff.logbook.reduce((sum, l) => sum + l.hours, 0)
    const pendingEntries = staff.logbook.filter(l => !l.signedOff)
    const pendingCount = pendingEntries.length
    const [expandedPending, setExpandedPending] = useState<Record<number, boolean>>({ 0: true })
    const [recordModal, setRecordModal] = useState<{ defect: { ata: string; description: string }; logEntry: LogbookEntry } | null>(null)

    return (
        <div>
            {/* Summary Card */}
            <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                            <Clock className="h-4 w-4" />
                        </div>
                        Summary
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-y-5 gap-x-8 max-md:grid-cols-1">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-400 tracking-wide">Total Entries</span>
                        <span className="text-sm font-medium text-slate-800">{staff.logbook.length}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-400 tracking-wide">Total Hours</span>
                        <span className="text-sm font-medium text-slate-800 font-mono">{totalHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-400 tracking-wide">Pending Sign-off</span>
                        <span className={`text-sm font-medium ${pendingCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {pendingCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Pending Sign-off Card */}
            {pendingEntries.length > 0 && (
                <div className="bg-white border  rounded-[14px] py-6 px-7 mb-4">
                    <div className="flex items-center justify-between mb-5 pb-3.5 border-b ">
                        <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                            Pending Sign-off
                        </div>
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500">
                            {pendingEntries.length} pending
                        </span>
                    </div>
                    <div className="space-y-3">
                        {pendingEntries.map((log, i) => {
                            const defects = getMockDefects(log.thfNo)
                            const totalDefects = defects.length
                            const signedDefects = defects.filter(d => d.status === 'Closed').length
                            const progressPct = totalDefects > 0 ? Math.round((signedDefects / totalDefects) * 100) : 0

                            const isExpanded = expandedPending[i] ?? false

                            return (
                                <div key={i} className="p-4 bg-red-50/40 rounded-xl border border-red-100">
                                    <div
                                        className="flex items-start gap-4 cursor-pointer select-none"
                                        onClick={() => setExpandedPending(prev => ({ ...prev, [i]: !prev[i] }))}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* THF No + Aircraft info */}
                                            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                                <div className='gap-2 mb-1.5'>
                                                    <span className="text-xs mr-2">{formatDate(log.date)}</span>
                                                    <span className="text-[13px] font-semibold text-slate-800">{log.aircraft}</span>
                                                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                                        {log.regNo}
                                                    </span>
                                                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${getTaskTypeStyle(log.taskType)}`}>
                                                        {log.taskType}
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-mono">
                                                    {log.thfNo}
                                                </span>
                                            </div>
                                            {/* Defect Progress */}
                                            <div className="mb-1.5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                                        <span className="text-[11px] font-semibold text-slate-500">Defect Sign-off</span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600">{signedDefects}/{totalDefects}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-green-500' : progressPct > 0 ? 'bg-red-300' : 'bg-blue-400'}`}
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Defect Items List (Collapsible) */}
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-3 pt-3 border-t border-red-100/80' : 'max-h-0 opacity-0'}`}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Wrench className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Defect Items</span>
                                            <span className="text-xs font-semibold text-slate-400 ml-auto">{defects.length} item{defects.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {defects.map((d, di) => (
                                                <div key={di} className="flex items-center gap-2.5 py-1.5 px-2.5 bg-white/70 rounded-lg border border-slate-100">
                                                    {/* <span className="text-xs font-bold text-slate-700 shrink-0">{d.defectNo}</span> */}
                                                    <span className="inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">{d.ata}</span>
                                                    <span className="text-xs text-slate-600 truncate flex-1">{d.description}</span>
                                                    {/* <DefectStatusBadge status={d.status} /> */}
                                                    <button
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 bg-white rounded-md hover:bg-slate-50 transition-colors cursor-pointer border border-slate-200 shrink-0"
                                                    >
                                                        Skip
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setRecordModal({ defect: { ata: d.ata, description: d.description }, logEntry: log }) }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors cursor-pointer border-none shrink-0"
                                                    >
                                                        Record
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Maintenance Logbook Table */}
            <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-emerald-600">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                        Maintenance Logbook
                    </div>
                    <span className="text-[13px] text-slate-500">{staff.logbook.length} entries</span>
                </div>

                {staff.logbook.length > 0 ? (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {['Date', 'Aircraft', 'Reg. No.', 'Task Type', 'THF No.', 'Description'].map(h => (
                                    <th key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">
                                        {h}
                                    </th>
                                ))}
                                <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-center">Hours</th>
                                <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-center">Sign-off</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.logbook.map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 font-mono whitespace-nowrap">
                                        {formatDate(log.date)}
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium whitespace-nowrap">
                                        {log.aircraft}
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                            {log.regNo}
                                        </span>
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${getTaskTypeStyle(log.taskType)}`}>
                                            {log.taskType}
                                        </span>
                                    </td>
                                    <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 font-mono">
                                        {log.thfNo}
                                    </td>
                                    <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-600 max-w-[280px]">
                                        {log.description}
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-center font-mono font-semibold">
                                        {log.hours.toFixed(1)}
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-center">
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${log.signedOff ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {log.signedOff ? '✓ Signed' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-slate-400 text-sm">No logbook records.</p>
                )}
            </div>


            {/* Logbook Record Modal */}
            {recordModal && (
                <LogbookRecordModal
                    staff={staff}
                    defect={recordModal.defect}
                    logEntry={recordModal.logEntry}
                    onClose={() => setRecordModal(null)}
                />
            )}
        </div>
    )
}
