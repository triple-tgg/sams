'use client'

import { useState } from 'react'
import { ClipboardList, Clock, AlertCircle, Wrench, AlertTriangle, CheckCircle2, ChevronDown, Search, Calendar } from 'lucide-react'
import { StaffData, LogbookEntry } from '../types'
import { formatDate } from '../utils'
import { LogbookRecordModal } from './LogbookRecordModal'
import { useLogbookSummary, useLogbookRecords, useLogbookPending, useUpsertLogbookRecord } from '@/lib/api/hooks/useQAStaffManagement'
import { useAircraftTypes } from '@/lib/api/hooks/useAircraftTypes'

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




// ── Logbook Records Tab ──
export function LogbookTab({ staff }: { staff: StaffData }) {
    const [page, setPage] = useState(1);
    const perPage = 10;
    const [filterDate, setFilterDate] = useState("");
    const [filterThfNo, setFilterThfNo] = useState("");
    const [filterAircraftTypeId, setFilterAircraftTypeId] = useState<number | null>(null);

    const { options: aircraftTypeOptions } = useAircraftTypes();

    // ── Fetch summary from API ──
    const { data: summaryData } = useLogbookSummary(staff.id)
    const apiSummary = summaryData?.responseData

    // ── Fetch records from API ──
    const { data: recordsData } = useLogbookRecords(staff.id, {
        formDate: filterDate,
        aircraftTypeId: filterAircraftTypeId,
        thfNo: filterThfNo,
        page,
        perPage
    })
    const apiRecords = recordsData?.responseData
    const totalRecords = recordsData?.total || 0;
    const totalPages = Math.ceil(totalRecords / perPage);

    // ── Fetch pending sign-off from API ──
    const { data: pendingData } = useLogbookPending(staff.id)
    const apiPendingRecords = pendingData?.responseData || []
    
    // ── Upsert mutation ──
    const upsertRecord = useUpsertLogbookRecord(staff.id)

    const totalEntries = apiSummary?.totalEntries ?? 0
    const totalHours = apiSummary?.totalHours ?? 0
    const pendingCount = apiSummary?.pendingSignOff ?? 0

    const pendingEntries = apiPendingRecords
    const [expandedPending, setExpandedPending] = useState<Record<number, boolean>>({ 0: true })
    const [recordModal, setRecordModal] = useState<{ defect: { defectId?: string; ata: string; description: string }; logEntry: any } | null>(null)

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
                        <span className="text-sm font-medium text-slate-800">{totalEntries}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-400 tracking-wide">Total Hours</span>
                        <span className="text-sm font-medium text-slate-800">{totalHours.toFixed(2)} hrs</span>
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
                            const defects = log.defectItems || []
                            const totalDefects = defects.length
                            const signedDefects = defects.filter(d => {
                                const s = d.status?.toLowerCase() || ''
                                return s === 'completed' || s === 'closed' || s === 'record'
                            }).length
                            const progressPct = totalDefects > 0 ? Math.round((signedDefects / totalDefects) * 100) : 0
                            const hasRecordedItem = signedDefects > 0

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
                                                <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">
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
                                            {defects.map((d, di) => {
                                                const isPending = !d.status || d.status.toLowerCase() === 'pending' || d.status.toLowerCase() === 'open'
                                                
                                                return (
                                                    <div key={di} className="flex items-center gap-2.5 py-1.5 px-2.5 bg-white/70 rounded-lg border border-slate-100">
                                                        <span className="inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">{d.ataCode}</span>
                                                        <span className="text-xs text-slate-600 truncate flex-1">{d.description}</span>
                                                        
                                                        {!isPending ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100 shrink-0">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Recorded
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {hasRecordedItem && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            upsertRecord.mutate({
                                                                                id: 0,
                                                                                lineMaintenanceId: log.lineMaintenanceId || 0,
                                                                                additionalDefectId: d.defectId,
                                                                                licenseCategoryId: 0,
                                                                                dateToPerformTask: new Date().toISOString().split('T')[0],
                                                                                stationId: 0,
                                                                                aircraftTypeId: 0,
                                                                                aircraftRegistration: log.regNo || '',
                                                                                privilegeId: 0,
                                                                                ataChapterId: 0,
                                                                                flagTransitCheck: false,
                                                                                flagDailyCheck: false,
                                                                                flagAcheck: false,
                                                                                flagEngineChange: false,
                                                                                flagApuchange: false,
                                                                                flagEngineBorescope: false,
                                                                                flagCrs: false,
                                                                                flagInspinspection: false,
                                                                                flagTstroubleshooting: false,
                                                                                flagRemovalInstallation: false,
                                                                                flagDefectRectification: false,
                                                                                flagTraining: false,
                                                                                flagSghservicing: false,
                                                                                flagFotfunctionalOperational: false,
                                                                                flagReprepair: false,
                                                                                flagSupervising: false,
                                                                                flagBorescopeInspection: false,
                                                                                flagOther: false,
                                                                                typeOfActivity: '',
                                                                                maintenanceReference: '',
                                                                                performedDurationHrs: 0,
                                                                                authorizedStampNo: '',
                                                                                description: '',
                                                                                statusId: 2, // Skip
                                                                                attachments: null
                                                                            })
                                                                        }}
                                                                        disabled={upsertRecord.isPending}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 bg-white rounded-md hover:bg-slate-50 transition-colors cursor-pointer border border-slate-200 shrink-0 disabled:opacity-50"
                                                                    >
                                                                        Skip
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setRecordModal({ defect: { defectId: d.defectId, ata: d.ataCode, description: d.description }, logEntry: log as any }) }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors cursor-pointer border-none shrink-0"
                                                                >
                                                                    Record
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
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
                    <span className="text-[13px] text-slate-500">{totalRecords || (apiRecords ? apiRecords.length : 0)} entries</span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search THF No." 
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-44 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                            value={filterThfNo}
                            onChange={(e) => { setFilterThfNo(e.target.value); setPage(1); }}
                        />
                    </div>
                    <input 
                        type="date" 
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-40 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-600"
                        value={filterDate}
                        onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                    />
                    <select 
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[160px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-600"
                        value={filterAircraftTypeId || ""}
                        onChange={(e) => { setFilterAircraftTypeId(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                    >
                        <option value="">All Aircraft Types</option>
                        {aircraftTypeOptions?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    
                    {(filterThfNo || filterDate || filterAircraftTypeId) && (
                        <button 
                            onClick={() => {
                                setFilterThfNo("");
                                setFilterDate("");
                                setFilterAircraftTypeId(null);
                                setPage(1);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {apiRecords && apiRecords.length > 0 ? (
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
                            {apiRecords?.map((rec) => {
                                const isSigned = rec.signOffStatus === 'Signed-Off' || rec.signOffStatus === 'Signed Off'
                                return (
                                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap">
                                            {formatDate(rec.date)}
                                        </td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium whitespace-nowrap">
                                            {rec.aircraft}
                                        </td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                {rec.regNo}
                                            </span>
                                        </td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${getTaskTypeStyle(rec.taskType)}`}>
                                                {rec.taskType}
                                            </span>
                                        </td>
                                        <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                            {rec.thfNo}
                                        </td>
                                        <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-600 max-w-[280px]">
                                            {rec.description}
                                        </td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-center font-semibold">
                                            {rec.hours.toFixed(1)}
                                        </td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-center">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${isSigned ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {isSigned ? '✓ Signed-Off' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-slate-400 text-sm">No logbook records.</p>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="text-sm text-slate-500">
                            Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalRecords)} of {totalRecords} entries
                        </div>
                        <div className="flex gap-1">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 text-sm border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 text-sm border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
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
