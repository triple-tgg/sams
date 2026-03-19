import { useState } from 'react'
import { Briefcase, GraduationCap, Pencil } from 'lucide-react'
import { StaffData } from '../types'
import { EditWorkExperienceModal } from './EditWorkExperienceModal'
import { EditEducationModal } from './EditEducationModal'

// ── Experience Tab ──
export function ExperienceTab({ staff }: { staff: StaffData }) {
    const [showEditExp, setShowEditExp] = useState(false)
    const [showEditEdu, setShowEditEdu] = useState(false)

    return (
        <div>
            {/* Work Experience */}
            <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        Work Experience
                    </div>
                    {staff.experience.length > 0 && (
                        <button
                            onClick={() => setShowEditExp(true)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-700 hover:shadow-sm"
                            title="Edit Work Experience"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {staff.experience.length > 0 ? (
                    <div className="relative ml-2">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[54px] top-2 bottom-2 w-[2px] bg-slate-200" />

                        {staff.experience.map((exp, i) => {
                            // Parse period like "2021 – Present" into start part
                            const periodParts = exp.period.split('–').map(s => s.trim())
                            const startLabel = periodParts[0] || ''

                            return (
                                <div key={i} className="relative flex gap-0 mb-8 last:mb-0">
                                    {/* Left: Date label */}
                                    <div className="w-[44px] shrink-0 text-right pr-0">
                                        <span className="text-xs font-medium text-rose-400 leading-tight block mt-0.5">
                                            {startLabel}
                                        </span>
                                    </div>

                                    {/* Center: Dot on timeline */}
                                    <div className="w-[22px] shrink-0 flex justify-center relative z-10">
                                        <div className="w-3 h-3 rounded-full bg-white border-[2.5px] border-rose-400 mt-1.5" />
                                    </div>

                                    {/* Right: Content */}
                                    <div className="flex-1 min-w-0 pl-1">
                                        <h4 className="text-sm font-bold text-slate-800 mb-1">{exp.title}</h4>
                                        <div className="text-xs text-slate-500 mb-0.5">
                                            Company: {exp.company}
                                        </div>
                                        <div className="text-xs text-slate-400 mb-2">
                                            {exp.period}
                                        </div>
                                        {exp.description && (
                                            <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-2 mt-1">
                                                <span className="text-slate-500 font-medium">Notes:</span>{' '}
                                                <span className="text-slate-400">{exp.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                            <Briefcase className="h-7 w-7 text-amber-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">No Work Experience</p>
                        <p className="text-xs text-slate-400 mb-5">Work experience records have not been added yet.</p>
                        <button
                            onClick={() => setShowEditExp(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none"
                        >
                            <Briefcase className="h-4 w-4" />
                            Add Work Experience
                        </button>
                    </div>
                )}
            </div>

            {/* Education */}
            <div className="bg-white border border-[#e8ecf1] rounded-[14px] py-6 px-7 mb-4">
                <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 text-base font-bold text-slate-800">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        Education
                    </div>
                    {staff.education.length > 0 && (
                        <button
                            onClick={() => setShowEditEdu(true)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-slate-200 bg-white text-slate-400 cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-700 hover:shadow-sm"
                            title="Edit Education"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {staff.education.length > 0 ? (
                    staff.education.map((edu, i) => (
                        <div key={i} className="border border-[#e8ecf1] rounded-xl py-4.5 px-5.5 mb-3 bg-[#fafbfc] transition-all duration-200 hover:border-blue-300 hover:shadow-[0_2px_8px_rgba(37,99,235,0.06)] last:mb-0">
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-sm font-semibold text-slate-800">{edu.degree}</span>
                                <span className="text-xs font-medium text-slate-500">{edu.year}</span>
                            </div>
                            <div className="text-[13px] text-slate-600 mb-1.5">{edu.institution}</div>
                            <div className="text-xs text-slate-400 leading-relaxed">{edu.field}</div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                            <GraduationCap className="h-7 w-7 text-blue-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">No Education Records</p>
                        <p className="text-xs text-slate-400 mb-5">Education records have not been added yet.</p>
                        <button
                            onClick={() => setShowEditEdu(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none"
                        >
                            <GraduationCap className="h-4 w-4" />
                            Add Education
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Work Experience Modal */}
            <EditWorkExperienceModal
                isOpen={showEditExp}
                onClose={() => setShowEditExp(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save work experience:', data)
                }}
            />

            {/* Edit Education Modal */}
            <EditEducationModal
                isOpen={showEditEdu}
                onClose={() => setShowEditEdu(false)}
                staff={staff}
                onSave={(data) => {
                    console.log('Save education:', data)
                }}
            />
        </div>
    )
}
