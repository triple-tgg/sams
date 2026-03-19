'use client'

import { X as XIcon } from 'lucide-react'
import { SessionFormData, STATUS_CONFIG } from '../types'
import { COURSES_REF, INSTRUCTORS, VENUES, DEPTS } from '../data'

interface SessionFormModalProps {
    form: SessionFormData
    setForm: React.Dispatch<React.SetStateAction<SessionFormData>>
    isEdit: boolean
    onSave: () => void
    onClose: () => void
    onCourseSelect: (courseId: string) => void
}

export function SessionFormModal({ form, setForm, isEdit, onSave, onClose, onCourseSelect }: SessionFormModalProps) {
    const f = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-screen overflow-y-auto border border-border" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Training Session' : 'Schedule New Training Session'}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Fill in the session details below</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted cursor-pointer transition-colors border-none bg-transparent">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Course select */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                            Training Course <span className="text-red-400">*</span>
                        </label>
                        <select value={String(form.courseId)} onChange={e => onCourseSelect(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                            <option value="">Select a course...</option>
                            {['Core', 'Aircraft Familiarization', 'Aircraft Type', 'Specialized', 'Compliance'].map(cat => (
                                <optgroup key={cat} label={cat}>
                                    {COURSES_REF.filter(c => c.category === cat).map(c => (
                                        <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Dates + Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                                Start Date <span className="text-red-400">*</span>
                            </label>
                            <input type="date" value={form.dateStart} onChange={e => f('dateStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Date</label>
                            <input type="date" value={form.dateEnd} onChange={e => f('dateEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Start Time</label>
                            <input type="time" value={form.timeStart} onChange={e => f('timeStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Time</label>
                            <input type="time" value={form.timeEnd} onChange={e => f('timeEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>

                    {/* Instructor + Venue */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Instructor</label>
                            <select value={form.instructor} onChange={e => f('instructor', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                <option value="">Select...</option>
                                {INSTRUCTORS.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Venue</label>
                            <select value={form.venue} onChange={e => f('venue', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                <option value="">Select...</option>
                                {VENUES.map(v => <option key={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dept + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Department</label>
                            <select value={form.dept} onChange={e => f('dept', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                {DEPTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
                            <select value={form.status} onChange={e => f('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Max participants + Enrolled */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Participants</label>
                            <input type="number" min={1} max={200} value={form.maxParticipants} onChange={e => f('maxParticipants', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Enrolled</label>
                            <input type="number" min={0} value={form.enrolled} onChange={e => f('enrolled', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-0 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent">Cancel</button>
                    <button onClick={onSave}
                        className="flex-1 py-2.5 text-sm rounded-xl text-white bg-primary hover:bg-primary/90 transition-all cursor-pointer font-medium border-none">
                        {isEdit ? 'Save Changes' : 'Schedule Session'}
                    </button>
                </div>
            </div>
        </div>
    )
}
