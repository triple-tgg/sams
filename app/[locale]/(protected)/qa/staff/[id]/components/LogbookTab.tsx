import { ClipboardList, Clock } from 'lucide-react'
import { StaffData } from '../types'
import { formatDate } from '../utils'

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
    const totalHours = staff.logbook.reduce((sum, l) => sum + l.hours, 0)
    const pendingCount = staff.logbook.filter(l => !l.signedOff).length

    return (
        <div>
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
                                {['Date', 'Aircraft', 'Reg. No.', 'Task Type', 'Work Order', 'Description'].map(h => (
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
                                        {log.workOrder}
                                    </td>
                                    <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-600 max-w-[280px]">
                                        {log.description}
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-center font-mono font-semibold">
                                        {log.hours.toFixed(1)}
                                    </td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-center">
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                                            log.signedOff ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
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
        </div>
    )
}
