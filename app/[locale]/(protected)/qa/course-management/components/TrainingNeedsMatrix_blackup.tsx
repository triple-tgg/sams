import { ShieldCheck, Check } from 'lucide-react'
import { Course, POSITIONS } from '../types'

interface TrainingNeedsMatrixProps {
    courses: Course[]
}

export function TrainingNeedsMatrix({ courses }: TrainingNeedsMatrixProps) {
    const activeCourses = courses.filter(c => c.status === 'Active')

    return (
        <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mt-4">
            <div className="flex items-center gap-2.5 text-base font-bold text-slate-800 mb-5 pb-3.5 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                </div>
                Training Needs Matrix
                <span className="text-xs font-normal text-slate-400 ml-1">Position × Course mapping</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr>
                            <th className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-3 border-b-2 border-slate-200 text-left bg-slate-50 sticky left-0 z-10 min-w-[160px]">
                                Position
                            </th>
                            {activeCourses.map(c => (
                                <th key={c.id} className="text-[10px] font-semibold text-slate-500 py-2.5 px-2 border-b-2 border-slate-200 text-center min-w-[40px] max-w-[40px]" title={c.name}>
                                    <div
                                        className="rotate-180 h-[100px] flex items-center justify-start overflow-hidden whitespace-nowrap text-ellipsis"
                                        style={{ writingMode: 'vertical-rl' }}
                                    >
                                        {c.name.length > 25 ? c.name.substring(0, 25) + '…' : c.name}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {POSITIONS.map(position => (
                            <tr key={position} className="hover:bg-slate-50/50 transition-colors">
                                <td className="text-[12px] font-semibold text-slate-700 py-2.5 px-3 border-b border-slate-100 bg-white sticky left-0 z-10">
                                    {position}
                                </td>
                                {activeCourses.map(c => {
                                    const required = c.requiredFor.includes(position)
                                    return (
                                        <td key={c.id} className="py-2 px-2 border-b border-slate-100 text-center">
                                            {required ? (
                                                <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center mx-auto">
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <span className="text-slate-200">—</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
