import { Award, Plane, BookOpen } from 'lucide-react'
import { StaffData } from '../types'
import { formatDate } from '../utils'

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
    const styles = {
        Valid: 'bg-green-50 text-green-600',
        Expired: 'bg-red-50 text-red-600',
        Permanent: 'bg-amber-50 text-amber-600',
    }[status] ?? 'bg-slate-100 text-slate-500'

    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${styles}`}>
            {status}
        </span>
    )
}

// ── Training & License Tab ──
export function TrainingTab({ staff }: { staff: StaffData }) {
    return (
        <div>
            {/* AMEL License */}
            {staff.license && (
                <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                    <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-800">
                                <Award className="h-4 w-4" />
                            </div>
                            AMEL License
                        </div>
                        <StatusBadge status={staff.license.status} />
                    </div>

                    {/* License Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-6 space-y-5">
                        {/* License Number - Hero */}
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">License Number</div>
                                <div className="font-mono text-lg font-bold text-blue-800 tracking-wider">{staff.license.number}</div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 max-md:grid-cols-1">
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
                            <div className="flex flex-col gap-1 col-span-full">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Limitations</span>
                                <span className="text-sm font-medium text-slate-700">{staff.license.limitations || '—'}</span>
                            </div>
                        </div>

                        {/* Aircraft Ratings */}
                        {(staff.license.aircraftRatings ?? staff.ratings)?.length > 0 && (
                            <div>
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">Aircraft Ratings</span>
                                <div className="flex flex-wrap gap-2">
                                    {(staff.license.aircraftRatings ?? staff.ratings).map(r => (
                                        <span key={r} className="inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3 rounded-lg bg-white text-blue-700 border border-blue-200 shadow-sm">
                                            <Plane className="h-3.5 w-3.5" /> {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Training Records */}
            {staff.training.length > 0 && (
                <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                    <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            Training Records
                        </div>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {['Course', 'Type', 'Completed', 'Expiry', 'Status'].map(h => (
                                    <th key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 border-b border-[#e8ecf1] text-left">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.training.map((t, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 font-medium">{t.course}</td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${t.type === 'R2Y' ? 'bg-blue-100 text-blue-800' : 'bg-green-50 text-green-800'
                                            }`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 font-mono">{formatDate(t.completedDate)}</td>
                                    <td className="text-xs py-3 px-3.5 border-b border-slate-100 text-slate-700 font-mono">{t.expiryDate === '-' ? '—' : formatDate(t.expiryDate)}</td>
                                    <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700">
                                        <StatusBadge status={t.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
